const { InstanceStatus } = require('@companion-module/base')

/**
 * Gateway profile polling: checkState + checkSources.
 * Migrated from companion-module-kiloview-mediagateway/src/api.js.
 * Fixes: guide_status operator precedence, request timeout.
 */
module.exports = {
	async checkState() {
		if (!this.DEVICE || this._statePollInFlight) return
		this._statePollInFlight = true

		let hasError = false

		try {
			// fw 2.20.0132: /output/get returns { layout_id, name, position[], vumeter }.
			// There is no aggregate mute/background_type field — derive them:
			//  - mute_status: '1' only when every active position is muted
			//  - output_resolution: from /output/list item res_name
			//  - background_type: from /output/background/get (enable:false → black)
			try {
				const outputResult = await this.DEVICE.getOutput('1')
				if (outputResult?.data) {
					const d = outputResult.data
					this.STATE.output_name = d.name || d.output_name || ''

					const positions = Array.isArray(d.position)
						? d.position.filter((p) => p && p.stream_id)
						: []
					if (positions.length > 0) {
						const allMuted = positions.every((p) => p.mute === true)
						this.STATE.mute_status = allMuted ? '1' : '0'
					}
				}
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'getOutput failed: ' + e.message)
				hasError = true
			}

			try {
				const listResult = await this.DEVICE.getOutputList()
				const out1 = (listResult?.data || []).find((o) => String(o.id) === '1') || listResult?.data?.[0]
				if (out1) {
					this.STATE.output_resolution = out1.res_name || out1.resolution || ''
					this.STATE.outputs = listResult.data
				}
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'getOutputList failed: ' + e.message)
			}

			try {
				const bgResult = await this.DEVICE.getBackground('1')
				if (bgResult?.data) {
					// Firmware exposes {background, enable}: a hex string like "#9A2525"
					// means solid color; an image path/name means custom image.
					const bg = bgResult.data
					if (bg.enable === false) {
						this.STATE.background_type = 'black'
					} else if (typeof bg.background === 'string' && bg.background && !bg.background.startsWith('#')) {
						this.STATE.background_type = 'image'
					} else {
						this.STATE.background_type = 'color'
					}
				}
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'getBackground failed: ' + e.message)
			}

			try {
				const infoResult = await this.DEVICE.getInfo()
				if (infoResult?.data) {
					this.STATE.device_name = String(infoResult.data.device_name || this.STATE.device_name || '').trim()
					this.STATE.serial_number = String(infoResult.data.serial_number || '').trim()
					this.STATE.hardware_version = String(infoResult.data.hardware_version || '').trim()
					this.STATE.firmware_version = String(infoResult.data.firmware_version || '').trim()
					this.STATE.software_version = String(infoResult.data.software_version || '').trim()
				}
				this.updateStatus(InstanceStatus.Ok)
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'getDeviceInfo failed: ' + e.message)
				hasError = true
			}

			try {
				const deviceResult = await this.DEVICE.getDeviceName()
				const name = deviceResult?.data?.device_name || deviceResult?.data?.name
				if (name) {
					this.STATE.device_name = String(name).trim()
				}
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'getDeviceName failed: ' + e.message)
			}

			// Fetch network info once per connection, not on every poll
			if (!this._networkFetched) {
				this._networkFetched = true
				try {
					const netResult = await this.DEVICE.getNetwork()
					if (netResult?.data) {
						const interfaces = Array.isArray(netResult.data) ? netResult.data : [netResult.data]
						this.STATE.ip = interfaces.find((i) => i.ip)?.ip || this.config.host
					}
				} catch (e) {
					this.STATE.ip = this.config.host
				}
			}

			try {
				const usageResult = await this.DEVICE.getUsage()
				if (usageResult?.data) {
					const d = usageResult.data
					// MG300V2 doc: fields are cpu_precent / mem_precent (sic), not cpu/mem.
					if (d.cpu_precent !== undefined) this.STATE.cpu_usage = d.cpu_precent
					else if (d.cpu !== undefined) this.STATE.cpu_usage = d.cpu
					if (d.mem_precent !== undefined) this.STATE.mem_used = d.mem_precent
					if (d.mem !== undefined) {
						this.STATE.mem_used = d.mem.used || d.memory_used || this.STATE.mem_used
						this.STATE.mem_total = d.mem.total || d.memory_total
					}
					if (d.uptime !== undefined) this.STATE.uptime = d.uptime
				}
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'getUsage failed: ' + e.message)
				hasError = true
			}

			try {
				const guideResult = await this.DEVICE.getGuideStatus()
				if (guideResult?.data) {
					const g = guideResult.data
					const on = g.show_guide === true || g.status === true || g.enabled === true
					this.STATE.guide_status = on ? 'on' : 'off'
				}
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'getGuideStatus failed: ' + e.message)
				hasError = true
			}

			try {
				const multiOutResult = await this.DEVICE.multiOutQuery()
				if (multiOutResult?.data && multiOutResult.data.enable !== undefined) {
					const newEnable = Number(multiOutResult.data.enable)
					const currentEnable = Number(this.CHOICES_MULTI_OUT.find((c) => c.enable)?.id)
					if (currentEnable !== newEnable) {
						this.CHOICES_MULTI_OUT = [
							{ id: '1', label: 'Output 1' + (newEnable === 1 ? ' (Active)' : ''), enable: newEnable === 1 },
							{ id: '2', label: 'Output 2' + (newEnable === 2 ? ' (Active)' : ''), enable: newEnable === 2 },
						]
						this.rebuildDefinitions()
					}
				}
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'getMultiOutState failed: ' + e.message)
			}

			this.checkFeedbacks()
			this.checkVariables()

			if (hasError && !this._endpointWarned) {
				this._endpointWarned = true
				this.log('warn', 'Some status endpoints returned errors - connection is OK but data may be incomplete')
			}
		} finally {
			this._statePollInFlight = false
		}
	},

	async checkSources() {
		if (!this.DEVICE || this._sourcesPollInFlight) return
		this._sourcesPollInFlight = true

		let streamsArray = [{ id: 'null', label: '- No streams available -' }]
		let groupsArray = [{ id: 'null', label: '- No groups available -' }]
		let layoutsArray = [{ id: 'null', label: '- No layouts available -' }]
		let positionsArray = [{ id: '1', label: 'Position 1' }]
		let outputsArray = [{ id: 'null', label: '- No outputs available -' }]
		let gatewayStreamsArray = [{ id: 'null', label: '- No gateway streams available -' }]
		let gatewayStreamingsArray = [{ id: 'null', label: '- No active push streams -' }]
		let resolutionsArray = null

		try {
			try {
				const groupResult = await this.DEVICE.getSourceGroups()
				if (groupResult?.data && Array.isArray(groupResult.data)) {
					this.STATE.groups = groupResult.data
					const streams = []
					const groups = []
					const streamsByGroup = {}
					let count = 0
					const groupLines = []

					groupResult.data.forEach((group) => {
						const name = group.name || group.group_name || group.id || 'Unknown'
						const streamCount = group.streams ? group.streams.length : 0
						count += streamCount
						groupLines.push(`- ${name}(${streamCount})`)
						groups.push({ id: String(group.id ?? ''), label: name })
						const groupStreams = []
						if (Array.isArray(group.streams)) {
							group.streams.forEach((stream) => {
								const sName = stream.name || stream.stream_name || stream.ndi_name || 'Unknown'
								const entry = {
									id: String(stream.id ?? ''),
									label: `${name}: ${sName}`,
									name: sName,
									url: stream.url || '',
									type: stream.type || '',
									group: name,
									group_id: String(group.id ?? ''),
									raw: stream,
								}
								streams.push(entry)
								groupStreams.push({ id: entry.id, label: sName, name: sName, url: entry.url, type: entry.type, group_id: entry.group_id })
							})
						}
						streamsByGroup[String(group.id)] =
							groupStreams.length > 0 ? groupStreams : [{ id: 'null', label: '- No streams in group -' }]
					})

					this.STATE.sources_count = count
					this.STATE.group_list = groupLines.join('\n')
					this.STATE.sources = streams
					this.STATE.source_groups = groupResult.data
					if (streams.length > 0) streamsArray = streams
					if (groups.length > 0) groupsArray = groups
					this.CHOICES_STREAMS_BY_GROUP = streamsByGroup
				}
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'Group list fetch failed: ' + e.message)
			}

			try {
				const layoutResult = await this.DEVICE.getLayoutList()
				if (layoutResult?.data && Array.isArray(layoutResult.data)) {
					this.STATE.layouts_count = layoutResult.data.length
					this.STATE.layouts = layoutResult.data
					layoutsArray = layoutResult.data.map((l) => ({
						id: String(l.layout_id || l.id || ''),
						label: l.name || 'Unknown',
					}))

					const posMap = new Map()
					layoutResult.data.forEach((l) => {
						if (Array.isArray(l.position)) {
							l.position.forEach((p) => {
								const id = p.id !== undefined ? p.id : p.number
								if (id !== undefined && !posMap.has(id)) {
									posMap.set(id, { id: String(id), label: `Position ${p.number || id}` })
								}
							})
						}
					})
					if (posMap.size > 0) {
						positionsArray = Array.from(posMap.values()).sort((a, b) => Number(a.id) - Number(b.id))
					}
				}
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'Layout list fetch failed: ' + e.message)
			}

			try {
				const gatewayResult = await this.DEVICE.getGatewayStreamList()
				if (gatewayResult?.data && Array.isArray(gatewayResult.data)) {
					this.STATE.gateway_streams_count = gatewayResult.data.length
					this.STATE.gateway_streams = gatewayResult.data
					this.STATE.gateway_stream_list = gatewayResult.data
						.map((s) => `- ${s.name || s.stream_name || s.id || 'Unknown'}( ${s.url || ''})`)
						.join('\n')

					gatewayStreamsArray = gatewayResult.data.map((s) => ({
						id: String(s.id || ''),
						label: `${s.name || s.stream_name || s.id || 'Unknown'} — ${s.protocol || ''} | ${s.dest_url || s.src_url || ''}`,
					}))

					gatewayStreamingsArray = gatewayResult.data
						.filter((s) => s.is_enable)
						.map((s) => ({
							id: String(s.id || ''),
							label: `${s.name || s.stream_name || s.id || 'Unknown'} — ${s.protocol || ''} | ${s.dest_url || s.src_url || ''}`,
						}))
					if (gatewayStreamingsArray.length === 0) {
						gatewayStreamingsArray = [{ id: 'null', label: '- No active push streams -' }]
					}
				}
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'Gateway stream list fetch failed: ' + e.message)
			}

			try {
				const outputResult = await this.DEVICE.getOutputList()
				if (outputResult?.data && Array.isArray(outputResult.data)) {
					// Skip placeholder Output0 (id="-1") if present — same as decoder list.
					const outputs = outputResult.data.filter((o) => String(o.id) !== '-1')
					this.STATE.outputs = outputs
					outputsArray = outputs.map((o) => ({
						id: String(o.id || ''),
						label: o.name || `Output ${o.id}`,
					}))

					this.STATE.output_details = this.STATE.output_details || {}
					const positionsByOutput = {}
					for (const output of outputs) {
						try {
							const detail = await this.DEVICE.getOutput(String(output.id))
							if (detail?.data) {
								this.STATE.output_details[String(output.id)] = detail.data
								const posChoices = []
								if (Array.isArray(detail.data.position)) {
									detail.data.position.forEach((p) => {
										posChoices.push({ id: String(p.id), label: `Position ${p.number || p.id}` })
									})
								}
								positionsByOutput[String(output.id)] =
									posChoices.length > 0 ? posChoices : [{ id: '1', label: 'Position 1' }]
							}
						} catch (e) {
							if (this.config.verbose) this.log('debug', `getOutput ${output.id} failed: ` + e.message)
						}
					}
					this.CHOICES_POSITIONS_BY_OUTPUT = positionsByOutput

					// Build resolution choices from output res_id/res_name
					// so the common resolutionMatch feedback works on gateways too.
					const resMap = new Map()
					outputs.forEach((o) => {
						if (o.res_id !== undefined && o.res_id !== null && o.res_id !== '' && !resMap.has(String(o.res_id))) {
							resMap.set(String(o.res_id), {
								id: String(o.res_id),
								label: o.res_name || `Resolution ${o.res_id}`,
							})
						}
					})
					if (resMap.size > 0) resolutionsArray = Array.from(resMap.values())
				}
			} catch (e) {
				if (this.config.verbose) this.log('debug', 'Output list fetch failed: ' + e.message)
			}

			this.checkVariables()

			let changed = false
			if (JSON.stringify(this.CHOICES_STREAMS) !== JSON.stringify(streamsArray)) {
				this.CHOICES_STREAMS = streamsArray
				changed = true
			}
			if (JSON.stringify(this.CHOICES_LAYOUTS) !== JSON.stringify(layoutsArray)) {
				this.CHOICES_LAYOUTS = layoutsArray
				changed = true
			}
			if (JSON.stringify(this.CHOICES_GROUPS) !== JSON.stringify(groupsArray)) {
				this.CHOICES_GROUPS = groupsArray
				changed = true
			}
			if (JSON.stringify(this.CHOICES_POSITIONS) !== JSON.stringify(positionsArray)) {
				this.CHOICES_POSITIONS = positionsArray
				changed = true
			}
			if (JSON.stringify(this.CHOICES_OUTPUTS) !== JSON.stringify(outputsArray)) {
				this.CHOICES_OUTPUTS = outputsArray
				changed = true
			}
			if (JSON.stringify(this.CHOICES_GATEWAY_STREAMS) !== JSON.stringify(gatewayStreamsArray)) {
				this.CHOICES_GATEWAY_STREAMS = gatewayStreamsArray
				changed = true
			}
			if (JSON.stringify(this.CHOICES_GATEWAY_STREAMINGS) !== JSON.stringify(gatewayStreamingsArray)) {
				this.CHOICES_GATEWAY_STREAMINGS = gatewayStreamingsArray
				changed = true
			}
			if (resolutionsArray && JSON.stringify(this.CHOICES_RESOLUTIONS) !== JSON.stringify(resolutionsArray)) {
				this.CHOICES_RESOLUTIONS = resolutionsArray
				changed = true
			}
			if (changed) {
				this.rebuildDefinitions()
			}
		} finally {
			this._sourcesPollInFlight = false
		}
	},
}
