module.exports = {
	initActions() {
		const self = this
		const actions = {}

		actions.refreshStatus = {
			name: 'Refresh Device Status',
			options: [],
			callback: async () => {
				await self.checkState()
				await self.checkSources()
			},
		}

		actions.reboot = {
			name: 'Reboot Device',
			options: [],
			callback: async () => {
				await self.DEVICE.reboot()
			},
		}

		actions.restore = {
			name: 'Restore Factory Settings',
			options: [],
			callback: async () => {
				await self.DEVICE.restore()
			},
		}

		actions.selectLayout = {
			name: 'Select Layout',
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Layout',
					id: 'layout_id',
					default: self.CHOICES_LAYOUTS[0]?.id || '1',
					choices: self.CHOICES_LAYOUTS,
				},
			],
			callback: async (action) => {
				const { output_id, layout_id } = action.options
				await self.DEVICE.selectLayout(output_id, layout_id)
				await self.checkState()
			},
		}

		actions.assignSource = {
			name: 'Assign Source to Position',
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Position',
					id: 'pos_id',
					default: self.CHOICES_POSITIONS[0]?.id || 1,
					choices: self.CHOICES_POSITIONS,
				},
				{
					type: 'dropdown',
					label: 'Stream',
					id: 'stream_id',
					default: self.CHOICES_STREAMS[0]?.id || 'null',
					choices: self.CHOICES_STREAMS,
				},
			],
			callback: async (action) => {
				const { output_id, pos_id, stream_id } = action.options
				if (!stream_id || stream_id === 'null') {
					self.log('warn', 'No stream selected')
					return
				}

				const stream = self.CHOICES_STREAMS.find((s) => s.id === stream_id)
				const outputDetail = self.STATE.output_details?.[String(output_id)]
				const layoutId = outputDetail?.layout_id || parseInt(self.CHOICES_LAYOUTS[0]?.id || 1)

				const params = self.DEVICE.buildAssignSourceParams(
					output_id,
					pos_id,
					{
						id: stream_id,
						name: stream?.name || stream?.label || '',
						url: stream?.url || '',
					},
					layoutId
				)
				await self.DEVICE.setSource(params)
				await self.checkState()
			},
		}

		actions.removeSource = {
			name: 'Remove Source from Position',
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Position',
					id: 'pos_id',
					default: self.CHOICES_POSITIONS[0]?.id || 1,
					choices: self.CHOICES_POSITIONS,
				},
			],
			callback: async (action) => {
				const { output_id, pos_id } = action.options
				await self.DEVICE.removeSource(output_id, pos_id)
				await self.checkState()
			},
		}

		actions.setResolution = {
			name: 'Set Output Resolution',
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Resolution',
					id: 'res_id',
					default: self.CHOICES_RESOLUTIONS[0]?.id || '5',
					choices: self.CHOICES_RESOLUTIONS,
				},
			],
			callback: async (action) => {
				const { output_id, res_id } = action.options
				await self.DEVICE.setResolution(output_id, res_id)
				await self.checkState()
			},
		}

		actions.startStream = {
			name: 'Start Stream Playback',
			options: [
				{
					type: 'dropdown',
					label: 'Stream',
					id: 'stream_id',
					default: self.CHOICES_STREAMS[0]?.id || 'null',
					choices: self.CHOICES_STREAMS,
				},
			],
			callback: async (action) => {
				const { stream_id } = action.options
				if (!stream_id || stream_id === 'null') {
					return
				}
				await self.DEVICE.startPlay(stream_id)
				await self.checkState()
			},
		}

		actions.stopStream = {
			name: 'Stop Stream Playback',
			options: [
				{
					type: 'dropdown',
					label: 'Stream',
					id: 'stream_id',
					default: self.CHOICES_STREAMS[0]?.id || 'null',
					choices: self.CHOICES_STREAMS,
				},
			],
			callback: async (action) => {
				const { stream_id } = action.options
				if (!stream_id || stream_id === 'null') {
					return
				}
				await self.DEVICE.stopPlay(stream_id)
				await self.checkState()
			},
		}

		actions.setMute = {
			name: 'Set Position Mute',
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Position',
					id: 'pos_id',
					default: self.CHOICES_POSITIONS[0]?.id || 1,
					choices: self.CHOICES_POSITIONS,
				},
				{
					type: 'dropdown',
					label: 'Mute',
					id: 'mute',
					default: 'true',
					choices: [
						{ id: 'true', label: 'Mute On' },
						{ id: 'false', label: 'Mute Off' },
					],
				},
			],
			callback: async (action) => {
				const { output_id, pos_id, mute } = action.options
				await self.DEVICE.setMute(output_id, pos_id, mute === 'true')
				await self.checkState()
			},
		}

		actions.saveLayout = {
			name: 'Save Layout',
			description: 'Save current output changes to the selected layout preset',
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Layout',
					id: 'layout_id',
					default: self.CHOICES_LAYOUTS[0]?.id || '1',
					choices: self.CHOICES_LAYOUTS,
				},
			],
			callback: async (action) => {
				const { output_id, layout_id } = action.options
				await self.DEVICE.saveLayout(output_id, layout_id)
				await self.checkState()
			},
		}

		actions.reloadLayout = {
			name: 'Reload Layout',
			description: 'Reload layout from saved preset (discards unsaved changes)',
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Layout',
					id: 'layout_id',
					default: self.CHOICES_LAYOUTS[0]?.id || '1',
					choices: self.CHOICES_LAYOUTS,
				},
			],
			callback: async (action) => {
				const { output_id, layout_id } = action.options
				await self.DEVICE.reloadLayout(output_id, layout_id)
				await self.checkState()
			},
		}

		actions.refreshSources = {
			name: 'Refresh Source List',
			description: 'Trigger NDI/source discovery refresh on the decoder',
			options: [],
			callback: async () => {
				await self.DEVICE.refreshSources()
				await self.checkSources()
			},
		}

		actions.addSourceStream = {
			name: 'Add Source Stream',
			description: 'Add a manual network stream (RTSP, RTMP, HTTP, etc.) to a source group',
			options: [
				{
					type: 'dropdown',
					label: 'Source Group',
					id: 'group_id',
					default: self.CHOICES_GROUPS[0]?.id || 'null',
					choices: self.CHOICES_GROUPS,
				},
				{
					type: 'dropdown',
					label: 'Stream Type',
					id: 'type',
					default: 'rtsp',
					choices: self.CHOICES_SOURCE_TYPES,
				},
				{
					type: 'textinput',
					label: 'Name',
					id: 'name',
					default: '',
				},
				{
					type: 'textinput',
					label: 'URL',
					id: 'url',
					default: '',
				},
				{
					type: 'textinput',
					label: 'Username (optional)',
					id: 'user',
					default: '',
				},
				{
					type: 'textinput',
					label: 'Password (optional)',
					id: 'password',
					default: '',
				},
				{
					type: 'dropdown',
					label: 'RTSP Transport',
					id: 'trans_mode',
					default: 'tcp',
					choices: [
						{ id: 'tcp', label: 'TCP' },
						{ id: 'udp', label: 'UDP' },
					],
				},
			],
			callback: async (action) => {
				const { group_id, type, name, url, user, password, trans_mode } = action.options
				if (!group_id || group_id === 'null') {
					self.log('warn', 'No source group selected')
					return
				}
				if (!name || !url) {
					self.log('warn', 'Name and URL are required')
					return
				}
				const params = self.DEVICE.buildAddStreamParams(group_id, {
					type,
					name,
					url,
					user,
					password,
					trans_mode,
				})
				await self.DEVICE.addSourceStream(params)
				await self.checkSources()
			},
		}

		actions.addNdiSource = {
			name: 'Add NDI Source',
			description: 'Add an NDI stream to a source group',
			options: [
				{
					type: 'dropdown',
					label: 'Source Group',
					id: 'group_id',
					default: self.CHOICES_GROUPS[0]?.id || 'null',
					choices: self.CHOICES_GROUPS,
				},
				{
					type: 'textinput',
					label: 'NDI Name',
					id: 'ndi_name',
					default: '',
				},
				{
					type: 'textinput',
					label: 'URL (ip:port)',
					id: 'url',
					default: '',
				},
				{
					type: 'dropdown',
					label: 'Channel',
					id: 'channel',
					default: 'HB',
					choices: [
						{ id: 'HB', label: 'HB' },
						{ id: 'HX', label: 'HX' },
					],
				},
				{
					type: 'textinput',
					label: 'NDI Group',
					id: 'group_name',
					default: 'public',
				},
			],
			callback: async (action) => {
				const { group_id, ndi_name, url, channel, group_name } = action.options
				if (!group_id || group_id === 'null') {
					self.log('warn', 'No source group selected')
					return
				}
				if (!ndi_name || !url) {
					self.log('warn', 'NDI name and URL are required')
					return
				}
				const params = self.DEVICE.buildAddNdiStreamParams(group_id, {
					ndi_name,
					url,
					channel,
					group_name,
				})
				await self.DEVICE.addSourceStream(params)
				await self.checkSources()
			},
		}

		actions.modifySourceStream = {
			name: 'Modify Source Stream',
			description: 'Update an existing stream (leave fields blank to keep current values)',
			options: [
				{
					type: 'dropdown',
					label: 'Stream',
					id: 'stream_id',
					default: self.CHOICES_STREAMS[0]?.id || 'null',
					choices: self.CHOICES_STREAMS,
				},
				{
					type: 'textinput',
					label: 'Name (optional)',
					id: 'name',
					default: '',
				},
				{
					type: 'textinput',
					label: 'URL (optional)',
					id: 'url',
					default: '',
				},
				{
					type: 'textinput',
					label: 'Username (optional)',
					id: 'user',
					default: '',
				},
				{
					type: 'textinput',
					label: 'Password (optional)',
					id: 'password',
					default: '',
				},
				{
					type: 'dropdown',
					label: 'RTSP Transport (optional)',
					id: 'trans_mode',
					default: '',
					choices: [
						{ id: '', label: 'Keep current' },
						{ id: 'tcp', label: 'TCP' },
						{ id: 'udp', label: 'UDP' },
					],
				},
			],
			callback: async (action) => {
				const { stream_id, name, url, user, password, trans_mode } = action.options
				if (!stream_id || stream_id === 'null') {
					self.log('warn', 'No stream selected')
					return
				}
				const stream = self.STATE.sources.find((s) => s.id === stream_id)
				if (!stream) {
					self.log('warn', 'Stream not found in cached source list; refresh sources first')
					return
				}
				const params = self.DEVICE.buildModifyStreamParams(stream, {
					name,
					url,
					user,
					password,
					trans_mode,
				})
				await self.DEVICE.modifySourceStream(params)
				await self.checkSources()
			},
		}

		actions.removeSourceStream = {
			name: 'Remove Source Stream',
			description: 'Delete a stream from a source group',
			options: [
				{
					type: 'dropdown',
					label: 'Stream',
					id: 'stream_id',
					default: self.CHOICES_STREAMS[0]?.id || 'null',
					choices: self.CHOICES_STREAMS,
				},
			],
			callback: async (action) => {
				const { stream_id } = action.options
				if (!stream_id || stream_id === 'null') {
					self.log('warn', 'No stream selected')
					return
				}
				const stream = self.STATE.sources.find((s) => s.id === stream_id)
				if (!stream?.group_id) {
					self.log('warn', 'Stream group not found; refresh sources first')
					return
				}
				await self.DEVICE.removeSourceStream({
					group_id: stream.group_id,
					stream_id: stream.id,
				})
				await self.checkSources()
			},
		}

		actions.addNdiManualIp = {
			name: 'NDI: Add Manual IP',
			description: 'Add a manual NDI discovery IP and group',
			options: [
				{
					type: 'textinput',
					label: 'IP Address',
					id: 'ip',
					default: '',
				},
				{
					type: 'textinput',
					label: 'Group Name',
					id: 'group',
					default: 'public',
				},
			],
			callback: async (action) => {
				const { ip, group } = action.options
				if (!ip) {
					self.log('warn', 'NDI manual IP is empty')
					return
				}
				await self.DEVICE.addNdiManualIp(ip, group || 'public')
				await self.checkSources()
			},
		}

		actions.addNdiDiscoveryServer = {
			name: 'NDI: Add Discovery Server',
			description: 'Add an NDI discovery server address',
			options: [
				{
					type: 'textinput',
					label: 'Server IP',
					id: 'server_ip',
					default: '',
				},
				{
					type: 'textinput',
					label: 'Group Name',
					id: 'group',
					default: 'public',
				},
			],
			callback: async (action) => {
				const { server_ip, group } = action.options
				if (!server_ip) {
					self.log('warn', 'NDI discovery server IP is empty')
					return
				}
				await self.DEVICE.addNdiDiscoveryServer(server_ip, group || 'public')
				await self.checkSources()
			},
		}

		actions.assignPreviewSource = {
			name: 'Assign Source to Preview',
			description: 'Add a stream to the preview panel',
			options: [
				{
					type: 'dropdown',
					label: 'Stream',
					id: 'stream_id',
					default: self.CHOICES_STREAMS[0]?.id || 'null',
					choices: self.CHOICES_STREAMS,
				},
				{
					type: 'dropdown',
					label: 'Output Context',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
			],
			callback: async (action) => {
				const { stream_id, output_id } = action.options
				if (!stream_id || stream_id === 'null') {
					return
				}
				const stream = self.CHOICES_STREAMS.find((s) => s.id === stream_id)
				const params = self.DEVICE.buildPreviewAssignParams(
					{
						id: stream_id,
						name: stream?.name || stream?.label || '',
						url: stream?.url || '',
					},
					output_id
				)
				await self.DEVICE.modifyPreviewSource(params)
				await self.checkState()
			},
		}

		actions.removePreviewSource = {
			name: 'Remove Preview Source',
			description: 'Remove a stream from a preview slot',
			options: [
				{
					type: 'dropdown',
					label: 'Preview Slot',
					id: 'pos_id',
					default: self.CHOICES_PREVIEW_SLOTS[0]?.id || 1,
					choices: self.CHOICES_PREVIEW_SLOTS,
				},
			],
			callback: async (action) => {
				await self.DEVICE.removePreview(action.options.pos_id)
				await self.checkState()
			},
		}

		actions.setAudiomixEnable = {
			name: 'Set Audiomix Enable',
			description: 'Enable or disable a stream in the output/preview audiomix',
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Stream',
					id: 'stream_id',
					default: self.CHOICES_STREAMS[0]?.id || 'null',
					choices: self.CHOICES_STREAMS,
				},
				{
					type: 'dropdown',
					label: 'Mix Type',
					id: 'mix_type',
					default: 'output',
					choices: self.CHOICES_AUDIOMIX_TYPES,
				},
				{
					type: 'dropdown',
					label: 'Enable',
					id: 'enable',
					default: 'true',
					choices: [
						{ id: 'true', label: 'On' },
						{ id: 'false', label: 'Off' },
					],
				},
			],
			callback: async (action) => {
				const { output_id, stream_id, mix_type, enable } = action.options
				if (!stream_id || stream_id === 'null') {
					return
				}
				await self.DEVICE.setAudiomix({
					output_id,
					stream_id,
					type: mix_type,
					enable: enable === 'true',
				})
				await self.checkState()
			},
		}

		actions.setAudiomixVolume = {
			name: 'Set Audiomix Volume',
			description: 'Set audiomix volume in dB (-51 to 20)',
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Stream',
					id: 'stream_id',
					default: self.CHOICES_STREAMS[0]?.id || 'null',
					choices: self.CHOICES_STREAMS,
				},
				{
					type: 'dropdown',
					label: 'Mix Type',
					id: 'mix_type',
					default: 'output',
					choices: self.CHOICES_AUDIOMIX_TYPES,
				},
				{
					type: 'number',
					label: 'Volume (dB)',
					id: 'volume',
					default: 0,
					min: -51,
					max: 20,
				},
			],
			callback: async (action) => {
				const { output_id, stream_id, mix_type, volume } = action.options
				if (!stream_id || stream_id === 'null') {
					return
				}
				await self.DEVICE.setAudiomix({
					output_id,
					stream_id,
					type: mix_type,
					volume: parseInt(volume),
				})
				await self.checkState()
			},
		}

		actions.ptzStorePreset = {
			name: 'PTZ: Store Preset',
			description: 'Store current PTZ position to a preset slot (NDI sources only)',
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Position',
					id: 'pos_id',
					default: self.CHOICES_POSITIONS[0]?.id || 1,
					choices: self.CHOICES_POSITIONS,
				},
				{
					type: 'dropdown',
					label: 'Preset',
					id: 'preset_no',
					default: '0',
					choices: self.CHOICES_PTZ_PRESETS,
				},
			],
			callback: async (action) => {
				const { output_id, pos_id, preset_no } = action.options
				const layoutId =
					self.STATE.output_details?.[String(output_id)]?.layout_id ||
					parseInt(self.CHOICES_LAYOUTS[0]?.id || 1)
				await self.DEVICE.ptzStorePreset(output_id, pos_id, preset_no, layoutId)
			},
		}

		actions.ptzRecallPreset = {
			name: 'PTZ: Recall Preset',
			description: 'Recall a stored PTZ preset (NDI sources only)',
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Position',
					id: 'pos_id',
					default: self.CHOICES_POSITIONS[0]?.id || 1,
					choices: self.CHOICES_POSITIONS,
				},
				{
					type: 'dropdown',
					label: 'Preset',
					id: 'preset_no',
					default: '0',
					choices: self.CHOICES_PTZ_PRESETS,
				},
				{
					type: 'textinput',
					label: 'Speed (0.0 - 1.0)',
					id: 'speed',
					default: '0.5',
				},
			],
			callback: async (action) => {
				const { output_id, pos_id, preset_no, speed } = action.options
				const layoutId =
					self.STATE.output_details?.[String(output_id)]?.layout_id ||
					parseInt(self.CHOICES_LAYOUTS[0]?.id || 1)
				await self.DEVICE.ptzRecallPreset(output_id, pos_id, preset_no, speed, layoutId)
			},
		}

		self.setActionDefinitions(actions)
	},
}
