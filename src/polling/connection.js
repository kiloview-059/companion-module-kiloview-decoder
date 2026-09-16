const { InstanceStatus } = require('@companion-module/base')
const { createDevice } = require('../device/factory')
const { detectDeviceType } = require('../device/detect')
const decoderProfile = require('../http/decoderProfile')
const gatewayProfile = require('../http/gatewayProfile')
const DecoderApi = require('../http/decoderApi')
const GatewayApi = require('../http/gatewayApi')

module.exports = {
	stopPolling() {
		clearInterval(this.INTERVAL)
		clearInterval(this.INTERVAL_SOURCES)
		clearTimeout(this.RECONNECT_INTERVAL)
		this.INTERVAL = null
		this.INTERVAL_SOURCES = null
		this.RECONNECT_INTERVAL = null
	},

	async initConnection() {
		if (this._connecting) return
		this._connecting = true

		this.stopPolling()

		// Reset one-shot poll flags so the next checkState re-fetches network info
		this._networkFetched = false
		this._statePollInFlight = false
		this._sourcesPollInFlight = false

		if (!this.config.host) {
			this.updateStatus(InstanceStatus.BadConfig, 'Host is required')
			this._connecting = false
			return
		}

		this.updateStatus(InstanceStatus.Connecting)
		this.log('info', `Opening connection to ${this.config.host}`)

		const { client, api } = createDevice(this, this.config)
		this.DEVICE_CLIENT = client

		// For explicit deviceType, set profile + api immediately
		const deviceType = this.config.deviceType || 'auto'
		if (deviceType === 'decoder') {
			client.setProfile(decoderProfile)
			this.DEVICE = new DecoderApi(client)
		} else if (deviceType === 'gateway') {
			client.setProfile(gatewayProfile)
			this.DEVICE = new GatewayApi(client)
		} else {
			// auto: login first, then detect
			this.DEVICE = null
		}

		let authorized = false

		if (this.config.useAuth === false) {
			this.log('info', 'No authentication required. Connecting to device...')
			authorized = true
			client.authorized = true
		} else {
			try {
				this.log('info', 'Attempting to authorize...')
				authorized = await client.authorize()
			} catch (error) {
				if (error.name === 'KiloviewDeviceError') {
					this.log('error', 'Authorization failed. Check your username and password and try again.')
					this.updateStatus(InstanceStatus.ConnectionFailure, 'Authorization Failed. See log.')
				} else {
					this.log('error', 'Could not reach device. Retrying in 30 seconds.')
					this.updateStatus(InstanceStatus.ConnectionFailure)
					this.startReconnectInterval()
				}
				this._connecting = false
				return
			}
		}

		if (!authorized) {
			this.log('error', 'Authorization failed.')
			this.updateStatus(InstanceStatus.ConnectionFailure, 'Authorization Failed. See log.')
			this._connecting = false
			return
		}

		// Auto-detect device type if needed
		if (deviceType === 'auto') {
			this.log('info', 'Auto-detecting device type...')
			const detected = await detectDeviceType(client)

			if (detected === 'unknown') {
				this.log('error', 'Could not auto-detect device type. Please select Decoder or Gateway manually.')
				this.updateStatus(InstanceStatus.ConnectionFailure, 'Auto-detect failed. Select device type manually.')
				this._connecting = false
				return
			}

			this.log('info', `Detected device type: ${detected}`)
			this.detectedType = detected

			if (detected === 'decoder') {
				client.setProfile(decoderProfile)
				this.DEVICE = new DecoderApi(client)
			} else {
				client.setProfile(gatewayProfile)
				this.DEVICE = new GatewayApi(client)
			}
		} else {
			this.detectedType = deviceType
		}

		this.alias = client.alias
		this.updateStatus(InstanceStatus.Ok)
		this.log('info', `Connected to device with user: ${this.alias} (type: ${this.detectedType})`)

		// Rebuild definitions for the detected/explicit type
		this.rebuildDefinitions()

		// Start polling
		this.startInterval()
		this.startSourcesInterval()

		// Initial state + sources poll
		this.checkState().catch((e) => {
			if (this.config.verbose) this.log('debug', 'Initial state poll failed: ' + e.message)
		})
		this.checkSources().catch((e) => {
			if (this.config.verbose) this.log('debug', 'Initial sources poll failed: ' + e.message)
		})

		this._connecting = false
	},

	startReconnectInterval() {
		this.stopPolling()
		this.updateStatus(InstanceStatus.ConnectionFailure, 'Reconnecting')

		this.log('info', 'Attempting to reconnect in 30 seconds...')
		this.RECONNECT_INTERVAL = setTimeout(() => this.initConnection(), this.RECONNECT_TIME)
	},

	startInterval() {
		if (!this.config.polling) {
			this.log('info', 'Polling is disabled. Feedbacks and variables will not update automatically.')
			return
		}

		const rate = Math.max(parseInt(this.config.pollingrate) || this.POLLINGRATE, 1000)
		this.log('info', `Starting state polling every ${rate}ms`)
		this.INTERVAL = setInterval(() => this.checkState(), rate)
	},

	startSourcesInterval() {
		if (!this.config.polling) return

		const rate = Math.max(parseInt(this.config.pollingrate_sources) || this.POLLINGRATE_SOURCES, 5000)
		this.INTERVAL_SOURCES = setInterval(() => this.checkSources(), rate)
	},

	currentProfileType() {
		return this.detectedType || this.config?.deviceType || 'auto'
	},

	/**
	 * Decoder profile — also the default when deviceType is 'auto' and
	 * detection has not completed yet, so the full action/feedback/preset
	 * set is available in the UI before connecting.
	 */
	isDecoder() {
		const t = this.currentProfileType()
		return t === 'decoder' || t === 'auto'
	},

	isGateway() {
		return this.currentProfileType() === 'gateway'
	},
}
