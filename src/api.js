const { InstanceStatus } = require('@companion-module/base')
const KiloviewDecoder = require('./kiloview')

module.exports = {
	stopPolling() {
		const self = this
		clearInterval(self.INTERVAL)
		clearInterval(self.INTERVAL_SOURCES)
		self.INTERVAL = null
		self.INTERVAL_SOURCES = null
	},

	async initConnection() {
		const self = this

		if (self._connecting) {
			return
		}
		self._connecting = true

		self.stopPolling()
		clearTimeout(self.RECONNECT_INTERVAL)
		self.RECONNECT_INTERVAL = null

		if (!self.config.host) {
			self._connecting = false
			return
		}

		self.updateStatus(InstanceStatus.Connecting)
		self.log('info', `Opening connection to ${self.config.host}`)

		self.DEVICE = new KiloviewDecoder(
			self,
			self.config.host,
			self.config.username,
			self.config.password,
			self.config.protocol,
			self.config.port
		)

		let authorized = false

		if (self.config.useAuth === false) {
			self.log('info', 'No authentication required. Connecting to device...')
			authorized = true
			self.DEVICE.authorized = true
		} else {
			try {
				self.log('info', 'Attempting to authorize...')
				authorized = await self.DEVICE.authorize()
			} catch (error) {
				if (error.name === 'KiloviewDecoderError') {
					self.log('error', 'Authorization failed. Check your username and password and try again.')
					self.updateStatus(InstanceStatus.ConnectionFailure, 'Authorization Failed. See log.')
				} else {
					self.log('error', 'Could not reach device. Retrying in 30 seconds.')
					self.updateStatus(InstanceStatus.ConnectionFailure)
					self.startReconnectInterval()
				}
				self._connecting = false
				return
			}
		}

		if (authorized) {
			self.updateStatus(InstanceStatus.Ok)
			self.alias = self.DEVICE.alias
			self.log('info', `Connected to device with user: ${self.alias}`)

			self.startInterval()
			self.startSourcesInterval()
			self.checkState().catch((e) => {
				if (self.config.verbose) {
					self.log('debug', 'Initial state poll failed: ' + e.message)
				}
			})
		} else {
			self.log('error', 'Authorization failed.')
			self.updateStatus(InstanceStatus.ConnectionFailure, 'Authorization Failed. See log.')
		}

		self._connecting = false
	},

	startReconnectInterval() {
		const self = this

		self.stopPolling()
		self.updateStatus(InstanceStatus.ConnectionFailure, 'Reconnecting')

		if (self.RECONNECT_INTERVAL !== undefined) {
			clearTimeout(self.RECONNECT_INTERVAL)
			self.RECONNECT_INTERVAL = undefined
		}

		self.log('info', 'Attempting to reconnect in 30 seconds...')
		self.RECONNECT_INTERVAL = setTimeout(self.initConnection.bind(self), self.RECONNECT_TIME)
	},

	startInterval() {
		const self = this

		if (!self.config.polling) {
			self.log('info', 'Polling is disabled. Feedbacks and variables will not update automatically.')
			return
		}

		const rate = Math.max(parseInt(self.config.pollingrate) || self.POLLINGRATE, 1000)
		self.log('info', `Starting update interval: fetching device state every ${rate}ms`)
		self.INTERVAL = setInterval(self.checkState.bind(self), rate)
	},

	startSourcesInterval() {
		const self = this

		if (!self.config.polling) {
			return
		}

		const rate = Math.max(parseInt(self.config.pollingrate_sources) || self.POLLINGRATE_SOURCES, 5000)
		self.INTERVAL_SOURCES = setInterval(self.checkSources.bind(self), rate)
	},

	updateDynamicChoices() {
		const self = this

		const outputs = []
		if (Array.isArray(self.STATE.outputs)) {
			self.STATE.outputs.forEach((output) => {
				outputs.push({ id: String(output.id), label: output.name || `Output ${output.id}` })
			})
		}
		if (outputs.length === 0) {
			outputs.push({ id: '1', label: 'Output 1' })
		}

		const layouts = []
		if (Array.isArray(self.STATE.layouts)) {
			self.STATE.layouts.forEach((layout) => {
				layouts.push({ id: String(layout.layout_id), label: layout.name || `Layout ${layout.layout_id}` })
			})
		}
		if (layouts.length === 0) {
			layouts.push({ id: '1', label: 'Single' })
		}

		const outputLayouts = []
		outputs.forEach((output) => {
			layouts.forEach((layout) => {
				outputLayouts.push({
					id: `${output.id}:${layout.id}`,
					label: `${output.label} - ${layout.label}`,
					output_id: output.id,
					layout_id: layout.id,
				})
			})
		})
		if (outputLayouts.length === 0) {
			outputLayouts.push({ id: '1:1', label: 'Output 1 - Single' })
		}

		const positions = []
		const positionsByOutput = {}
		const outputPositions = []
		if (Array.isArray(self.STATE.outputs)) {
			self.STATE.outputs.forEach((output) => {
				const outputId = String(output.id)
				const outputLabel = output.name || `Output ${output.id}`
				const detail = self.STATE.output_details?.[outputId]
				const outputPosChoices = []
				if (detail?.position) {
					detail.position.forEach((pos) => {
						outputPosChoices.push({ id: pos.id, label: `Position ${pos.number || pos.id}` })
						outputPositions.push({
							id: `${outputId}:${pos.id}`,
							label: `${outputLabel} - Position ${pos.number || pos.id}`,
							output_id: outputId,
							pos_id: pos.id,
						})
					})
				}
				if (outputPosChoices.length === 0) {
					for (let i = 1; i <= 4; i++) {
						outputPosChoices.push({ id: i, label: `Position ${i}` })
						outputPositions.push({ id: `${outputId}:${i}`, label: `${outputLabel} - Position ${i}` })
					}
				}
				positionsByOutput[outputId] = outputPosChoices
			})
		}
		const defaultOutput = self.STATE.output_details?.['1']
		if (defaultOutput?.position) {
			defaultOutput.position.forEach((pos) => {
				positions.push({ id: pos.id, label: `Position ${pos.number || pos.id}` })
			})
		}
		if (positions.length === 0) {
			for (let i = 1; i <= 9; i++) {
				positions.push({ id: i, label: `Position ${i}` })
			}
		}
		if (Object.keys(positionsByOutput).length === 0) {
			positionsByOutput['1'] = positions.slice(0, 4)
			positionsByOutput['2'] = positions.slice(0, 4)
		}
		if (outputPositions.length === 0) {
			for (let i = 1; i <= 4; i++) {
				outputPositions.push({ id: `1:${i}`, label: `Output 1 - Position ${i}` })
				outputPositions.push({ id: `2:${i}`, label: `Output 2 - Position ${i}` })
			}
		}

		const resolutions = []
		if (Array.isArray(self.STATE.resolutions)) {
			self.STATE.resolutions.forEach((res) => {
				resolutions.push({ id: String(res.id), label: res.name || res.value })
			})
		}
		if (resolutions.length === 0) {
			resolutions.push({ id: '5', label: '1920x1080P60' })
		}

		const previewSlots = []
		if (Array.isArray(self.STATE.preview)) {
			self.STATE.preview.forEach((slot) => {
				previewSlots.push({
					id: slot.id,
					label: slot.stream_name ? `Preview ${slot.id}: ${slot.stream_name}` : `Preview ${slot.id}`,
				})
			})
		}
		if (previewSlots.length === 0) {
			for (let i = 1; i <= 8; i++) {
				previewSlots.push({ id: i, label: `Preview ${i}` })
			}
		}

		const buildOutputInterfaceChoices = (interfacesState, fallbackInterfaces) => {
			const choices = []
			outputs.forEach((output) => {
				const list = interfacesState?.[output.id]
				const intfs =
					Array.isArray(list) && list.length > 0
						? list.filter((intf) => intf.visible !== false)
						: fallbackInterfaces.map((intf) => ({ id: intf.id, label: intf.label }))

				intfs.forEach((intf) => {
					choices.push({
						id: `${output.id}:${intf.id}`,
						label: `${output.label} - ${intf.label}`,
						output_id: output.id,
						intf_id: String(intf.id),
					})
				})
			})
			return choices
		}

		const outputVideoInterfaces = buildOutputInterfaceChoices(
			self.STATE.video_interfaces,
			self.CHOICES_VIDEO_INTERFACES
		)
		const outputAudioInterfaces = buildOutputInterfaceChoices(
			self.STATE.audio_interfaces,
			self.CHOICES_AUDIO_INTERFACES
		)

		const changed =
			JSON.stringify(self.CHOICES_OUTPUTS) !== JSON.stringify(outputs) ||
			JSON.stringify(self.CHOICES_LAYOUTS) !== JSON.stringify(layouts) ||
			JSON.stringify(self.CHOICES_OUTPUT_LAYOUTS) !== JSON.stringify(outputLayouts) ||
			JSON.stringify(self.CHOICES_POSITIONS) !== JSON.stringify(positions) ||
			JSON.stringify(self.CHOICES_POSITIONS_BY_OUTPUT) !== JSON.stringify(positionsByOutput) ||
			JSON.stringify(self.CHOICES_OUTPUT_POSITIONS) !== JSON.stringify(outputPositions) ||
			JSON.stringify(self.CHOICES_RESOLUTIONS) !== JSON.stringify(resolutions) ||
			JSON.stringify(self.CHOICES_PREVIEW_SLOTS) !== JSON.stringify(previewSlots) ||
			JSON.stringify(self.CHOICES_OUTPUT_VIDEO_INTERFACES) !== JSON.stringify(outputVideoInterfaces) ||
			JSON.stringify(self.CHOICES_OUTPUT_AUDIO_INTERFACES) !== JSON.stringify(outputAudioInterfaces)

		self.CHOICES_OUTPUTS = outputs
		self.CHOICES_LAYOUTS = layouts
		self.CHOICES_OUTPUT_LAYOUTS = outputLayouts
		self.CHOICES_POSITIONS = positions
		self.CHOICES_POSITIONS_BY_OUTPUT = positionsByOutput
		self.CHOICES_OUTPUT_POSITIONS = outputPositions
		self.CHOICES_RESOLUTIONS = resolutions
		self.CHOICES_PREVIEW_SLOTS = previewSlots
		self.CHOICES_OUTPUT_VIDEO_INTERFACES =
			outputVideoInterfaces.length > 0 ? outputVideoInterfaces : [{ id: '1:1', label: 'Output 1 - HDMI 1' }]
		self.CHOICES_OUTPUT_AUDIO_INTERFACES =
			outputAudioInterfaces.length > 0 ? outputAudioInterfaces : [{ id: '1:1', label: 'Output 1 - HDMI 1' }]

		if (changed) {
			self.initActions()
			self.initFeedbacks()
			self.initVariables()
			self.initPresets()
		}
	},

	async checkState() {
		const self = this

		if (!self.DEVICE || self._statePollInFlight) {
			return
		}
		self._statePollInFlight = true

		try {
			try {
				const info = await self.DEVICE.getInfo()
				if (info?.data) {
					self.STATE.device_name = info.data.device_name || ''
					self.STATE.firmware_version = info.data.firmware_version || ''
					self.STATE.hardware_version = info.data.hardware_version || ''
					self.STATE.serial_number = info.data.serial_number || ''
					self.STATE.software_version = info.data.software_version || ''
				}
				self.updateStatus(InstanceStatus.Ok)
			} catch (e) {
				self.log('error', 'Error getting device info: ' + e.message)
				self.updateStatus(InstanceStatus.ConnectionFailure)
				self.startReconnectInterval()
				return
			}

			try {
				const outputList = await self.DEVICE.getOutputList()
				self.STATE.outputs = outputList?.data || []
			} catch (e) {
				if (self.config.verbose) {
					self.log('debug', 'Error getting output list: ' + e.message)
				}
			}

			try {
				const layoutList = await self.DEVICE.getLayoutList()
				self.STATE.layouts = layoutList?.data || []
			} catch (e) {
				if (self.config.verbose) {
					self.log('debug', 'Error getting layout list: ' + e.message)
				}
			}

			try {
				const resolutions = await self.DEVICE.getResolutionList()
				self.STATE.resolutions = resolutions?.data || []
			} catch (e) {
				if (self.config.verbose) {
					self.log('debug', 'Error getting resolution list: ' + e.message)
				}
			}

			self.STATE.output_details = {}
			if (Array.isArray(self.STATE.outputs)) {
				for (const output of self.STATE.outputs) {
					try {
						const detail = await self.DEVICE.getOutput(String(output.id))
						self.STATE.output_details[String(output.id)] = detail?.data || {}
					} catch (e) {
						if (self.config.verbose) {
							self.log('debug', `Error getting output ${output.id}: ` + e.message)
						}
					}

				try {
					const audiomix = await self.DEVICE.getAudiomix(String(output.id))
					self.STATE.audiomix[String(output.id)] = audiomix?.data || {}
				} catch (e) {
					if (self.config.verbose) {
						self.log('debug', `Error getting audiomix ${output.id}: ` + e.message)
					}
				}

				try {
					const videoIf = await self.DEVICE.getVideoInterfaces(String(output.id))
					self.STATE.video_interfaces[String(output.id)] = videoIf?.data || []
				} catch (e) {
					if (self.config.verbose) {
						self.log('debug', `Error getting video interfaces ${output.id}: ` + e.message)
					}
				}

				try {
					const audioIf = await self.DEVICE.getAudioInterfaces(String(output.id))
					self.STATE.audio_interfaces[String(output.id)] = audioIf?.data || []
				} catch (e) {
					if (self.config.verbose) {
						self.log('debug', `Error getting audio interfaces ${output.id}: ` + e.message)
					}
				}
			}
		}

			try {
				const preview = await self.DEVICE.getPreviewList()
				self.STATE.preview = preview?.data?.position || []
			} catch (e) {
				if (self.config.verbose) {
					self.log('debug', 'Error getting preview list: ' + e.message)
				}
			}

			self.updateDynamicChoices()
			self.checkFeedbacks()
			self.checkVariables()
		} finally {
			self._statePollInFlight = false
		}
	},

	async checkSources() {
		const self = this

		if (!self.DEVICE || self._sourcesPollInFlight) {
			return
		}
		self._sourcesPollInFlight = true

		let streamsArray = [{ id: 'null', label: '- No streams available -' }]
		let groupsArray = [{ id: 'null', label: '- No groups available -' }]
		let streamsByGroup = {}

		try {
			try {
				const groups = await self.DEVICE.getSourceGroups()
				const streams = []
				const groupChoices = []

				if (Array.isArray(groups?.data)) {
					self.STATE.source_groups = groups.data
					groups.data.forEach((group) => {
						groupChoices.push({
							id: group.id,
							label: group.name || group.id,
						})
						const groupStreams = []
						if (Array.isArray(group.streams)) {
							group.streams.forEach((stream) => {
								const entry = {
									id: stream.id,
									group_id: group.id,
									name: stream.name,
									url: stream.url,
									type: stream.type,
									group: group.name,
									raw: stream,
								}
								groupStreams.push({
									...entry,
									label: stream.name,
								})
								streams.push({
									...entry,
									label: `${group.name || group.id}: ${stream.name}`,
								})
							})
						}
						streamsByGroup[group.id] =
							groupStreams.length > 0
								? groupStreams
								: [{ id: 'null', label: '- No streams in group -' }]
					})
				}

				if (streams.length > 0) {
					streamsArray = streams
				}
				if (groupChoices.length > 0) {
					groupsArray = groupChoices
				}

				self.STATE.sources = streams
			} catch (e) {
				self.log('error', 'Error getting source list: ' + e.message)
			}

			const sourcesChanged =
				JSON.stringify(self.CHOICES_STREAMS) !== JSON.stringify(streamsArray) ||
				JSON.stringify(self.CHOICES_GROUPS) !== JSON.stringify(groupsArray) ||
				JSON.stringify(self.CHOICES_STREAMS_BY_GROUP) !== JSON.stringify(streamsByGroup)

			if (sourcesChanged) {
				self.log('info', 'Source list changed. Updating choices.')
				self.CHOICES_STREAMS = streamsArray
				self.CHOICES_GROUPS = groupsArray
				self.CHOICES_STREAMS_BY_GROUP = streamsByGroup
				self.initActions()
				self.initFeedbacks()
				self.initVariables()
				self.initPresets()
			}
		} finally {
			self._sourcesPollInFlight = false
		}
	},
}
