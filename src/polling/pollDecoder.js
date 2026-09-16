const { InstanceStatus } = require('@companion-module/base')
const { updateDecoderChoices, updateSourceChoices } = require('../choices/common')

/**
 * Decoder profile polling: checkState + checkSources.
 * Migrated from companion-module-kiloview-decoder/src/api.js.
 */
module.exports = {
	async checkState() {
		if (!this.DEVICE || this._statePollInFlight) return
		this._statePollInFlight = true

		try {
			try {
				const info = await this.DEVICE.getInfo()
				if (info?.data) {
					this.STATE.device_name = String(info.data.device_name || '').trim()
					this.STATE.firmware_version = String(info.data.firmware_version || '').trim()
					this.STATE.hardware_version = String(info.data.hardware_version || '').trim()
					this.STATE.serial_number = String(info.data.serial_number || '').trim()
					this.STATE.software_version = String(info.data.software_version || '').trim()
				}
				this.updateStatus(InstanceStatus.Ok)
			} catch (e) {
				this.log('error', 'Error getting device info: ' + e.message)
				this.updateStatus(InstanceStatus.ConnectionFailure)
				this.startReconnectInterval()
				return
			}

			// Device IP for the common `ip` variable — fetched once per
			// connection, not on every 1s poll (matches the legacy module and
			// avoids sustained load on /network/get).
			if (!this._networkFetched) {
				this._networkFetched = true
				this.STATE.ip = this.config.host
				try {
					const netResult = await this.DEVICE.getNetwork()
					if (netResult?.data) {
						const interfaces = Array.isArray(netResult.data) ? netResult.data : [netResult.data]
						this.STATE.ip = interfaces.find((i) => i.ip)?.ip || this.config.host
					}
				} catch (e) {
					if (this.config.verbose) this.log('debug', 'getNetwork failed: ' + e.message)
				}
			}

			try {
				const outputList = await this.DEVICE.getOutputList()
				// D350-api.md: list may include id="-1" placeholder channel(s) (Output0).
				// Skip them for Companion choices / per-output polling.
				const rawOutputs = outputList?.data || []
				this.STATE.outputs = Array.isArray(rawOutputs)
					? rawOutputs.filter((o) => String(o.id) !== '-1')
					: []
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'Error getting output list: ' + e.message)
			}

			try {
				const layoutList = await this.DEVICE.getLayoutList()
				this.STATE.layouts = layoutList?.data || []
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'Error getting layout list: ' + e.message)
			}

			try {
				const resolutions = await this.DEVICE.getResolutionList()
				this.STATE.resolutions = resolutions?.data || []
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'Error getting resolution list: ' + e.message)
			}

			this.STATE.output_details = {}
			if (Array.isArray(this.STATE.outputs)) {
				for (const output of this.STATE.outputs) {
					try {
						const detail = await this.DEVICE.getOutput(String(output.id))
						this.STATE.output_details[String(output.id)] = detail?.data || {}
					} catch (e) {
						if (this.config.verbose) this.log('debug', `Error getting output ${output.id}: ` + e.message)
					}

					try {
						const audiomix = await this.DEVICE.getAudiomix(String(output.id))
						this.STATE.audiomix[String(output.id)] = audiomix?.data || {}
					} catch (e) {
						if (this.config.verbose) this.log('debug', `Error getting audiomix ${output.id}: ` + e.message)
					}

					try {
						const videoIf = await this.DEVICE.getVideoInterfaces(String(output.id))
						this.STATE.video_interfaces[String(output.id)] = videoIf?.data || []
					} catch (e) {
						if (this.config.verbose) this.log('debug', `Error getting video interfaces ${output.id}: ` + e.message)
					}

					try {
						const audioIf = await this.DEVICE.getAudioInterfaces(String(output.id))
						this.STATE.audio_interfaces[String(output.id)] = audioIf?.data || []
					} catch (e) {
						if (this.config.verbose) this.log('debug', `Error getting audio interfaces ${output.id}: ` + e.message)
					}
				}
			}

			try {
				const preview = await this.DEVICE.getPreviewList()
				this.STATE.preview = preview?.data?.position || []
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'Error getting preview list: ' + e.message)
			}

			const choicesChanged = updateDecoderChoices(this)
			if (choicesChanged) {
				this.rebuildDefinitions()
			}
			this.checkFeedbacks()
			this.checkVariables()
		} finally {
			this._statePollInFlight = false
		}
	},

	async checkSources() {
		if (!this.DEVICE || this._sourcesPollInFlight) return
		this._sourcesPollInFlight = true

		let streamsArray = [{ id: 'null', label: '- No streams available -' }]
		let groupsArray = [{ id: 'null', label: '- No groups available -' }]
		let streamsByGroup = {}

		try {
			try {
				const groups = await this.DEVICE.getSourceGroups()
				const streams = []
				const groupChoices = []

				if (Array.isArray(groups?.data)) {
					this.STATE.source_groups = groups.data
					groups.data.forEach((group) => {
						groupChoices.push({ id: String(group.id), label: group.name || group.id })
						const groupStreams = []
						if (Array.isArray(group.streams)) {
							group.streams.forEach((stream) => {
								const entry = {
									id: String(stream.id),
									group_id: String(group.id),
									name: stream.name,
									url: stream.url,
									type: stream.type,
									group: group.name,
									raw: stream,
								}
								groupStreams.push({ ...entry, label: stream.name })
								streams.push({ ...entry, label: `${group.name || group.id}: ${stream.name}` })
							})
						}
						streamsByGroup[String(group.id)] =
							groupStreams.length > 0 ? groupStreams : [{ id: 'null', label: '- No streams in group -' }]
					})
				}

				if (streams.length > 0) streamsArray = streams
				if (groupChoices.length > 0) groupsArray = groupChoices

				this.STATE.sources = streams
			} catch (e) {
				this.log('error', 'Error getting source list: ' + e.message)
			}

			const changed = updateSourceChoices(this, streamsArray, groupsArray, streamsByGroup)
			if (changed) {
				this.log('info', 'Source list changed. Updating choices.')
				this.rebuildDefinitions()
			}
		} finally {
			this._sourcesPollInFlight = false
		}
	},
}
