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
			name: 'Select Layout for Output',
			description: 'Apply a layout template to Output 1 or Output 2',
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
				if (!output_id || !layout_id) {
					self.log('warn', 'Select Layout: missing output or layout')
					return
				}
				await self.DEVICE.selectLayout(output_id, layout_id)
				await self.checkState()
			},
		}

		actions.assignSource = {
			name: 'Assign Source to Position',
			description: 'Assign a stream to a window position on Output 1 or Output 2',
			options: [
				...self.buildOutputPositionFields(self),
				...self.buildGroupStreamFields(self),
			],
			callback: async (action) => {
				const position = self.resolveOutputPosition(self, action.options)
				const streamSelection = self.resolveStream(self, action.options)
				if (!streamSelection) {
					self.log('warn', 'No stream selected')
					return
				}
				if (!position) {
					self.log('warn', 'Invalid output or position selection')
					return
				}

				const { output_id, pos_id } = position
				const { stream_id } = streamSelection

				const stream = self.findStream(self, stream_id)
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

		actions.selectLayoutAndAssignSource = {
			name: 'Select Layout and Assign Source',
			description: 'Switch layout on an output, then assign a stream to a position',
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.getDefaultOutputId(self),
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Layout',
					id: 'layout_id',
					default: self.CHOICES_LAYOUTS[0]?.id || '1',
					choices: self.CHOICES_LAYOUTS,
				},
				...self.buildOutputPositionFields(self).slice(1),
				...self.buildGroupStreamFields(self),
			],
			callback: async (action) => {
				const { output_id, layout_id } = action.options
				const position = self.resolveOutputPosition(self, action.options)
				const streamSelection = self.resolveStream(self, action.options)
				if (!streamSelection) {
					self.log('warn', 'No stream selected')
					return
				}
				if (!position) {
					self.log('warn', 'Invalid output or position selection')
					return
				}
				if (String(position.output_id) !== String(output_id)) {
					self.log('warn', 'Position must match the selected output')
					return
				}
				const { pos_id } = position
				const { stream_id } = streamSelection

				await self.DEVICE.selectLayout(output_id, layout_id)
				await self.checkState()

				const stream = self.findStream(self, stream_id)
				const params = self.DEVICE.buildAssignSourceParams(
					output_id,
					pos_id,
					{
						id: stream_id,
						name: stream?.name || stream?.label || '',
						url: stream?.url || '',
					},
					parseInt(layout_id)
				)
				await self.DEVICE.setSource(params)
				await self.checkState()
			},
		}

		actions.removeSource = {
			name: 'Remove Source from Position',
			options: [...self.buildOutputPositionFields(self)],
			callback: async (action) => {
				const position = self.resolveOutputPosition(self, action.options)
				if (!position) {
					self.log('warn', 'Invalid output or position selection')
					return
				}
				const { output_id, pos_id } = position
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

		actions.setVideoInterfaceEnable = {
			name: 'Set Video Interface Enable',
			description: 'Enable or disable HDMI/SDI video output (HDMI1, HDMI2, SDI)',
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
					label: 'Interface',
					id: 'intf_id',
					default: '1',
					choices: self.CHOICES_VIDEO_INTERFACES,
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
				const { output_id, intf_id, enable } = action.options
				await self.DEVICE.setVideoInterface(output_id, intf_id, {
					enable: enable === 'true',
				})
				await self.checkState()
			},
		}

		actions.setVideoInterfaceMode = {
			name: 'Set Video Interface Mode',
			description: 'Set HDMI/DVI mode on HDMI1 or HDMI2',
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
					label: 'Interface',
					id: 'intf_id',
					default: '1',
					choices: self.CHOICES_VIDEO_INTERFACES.filter((i) => i.id !== '3'),
				},
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'mode',
					default: 'HDMI',
					choices: self.CHOICES_VIDEO_INTERFACE_MODES,
				},
			],
			callback: async (action) => {
				const { output_id, intf_id, mode } = action.options
				await self.DEVICE.setVideoInterface(output_id, intf_id, { mode })
				await self.checkState()
			},
		}

		actions.setVideoInterfaceColorspace = {
			name: 'Set Video Interface Colorspace',
			description: 'Set colorspace on HDMI1, HDMI2, or SDI',
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
					label: 'Interface',
					id: 'intf_id',
					default: '1',
					choices: self.CHOICES_VIDEO_INTERFACES,
				},
				{
					type: 'dropdown',
					label: 'Colorspace',
					id: 'colorspace',
					default: 'RGB444',
					choices: self.CHOICES_VIDEO_COLORSPACES,
				},
			],
			callback: async (action) => {
				const { output_id, intf_id, colorspace } = action.options
				await self.DEVICE.setVideoInterface(output_id, intf_id, { colorspace })
				await self.checkState()
			},
		}

		actions.toggleVideoInterfaceEnable = {
			name: 'Toggle Video Interface',
			description: 'Enable or disable HDMI1, HDMI2, or SDI video output',
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
					label: 'Interface',
					id: 'intf_id',
					default: '1',
					choices: self.CHOICES_VIDEO_INTERFACES,
				},
			],
			callback: async (action) => {
				const { output_id, intf_id } = action.options
				const list = self.STATE.video_interfaces[String(output_id)]
				const intf = Array.isArray(list) ? list.find((i) => String(i.id) === String(intf_id)) : null
				const enable = !(intf?.enable === true)
				await self.DEVICE.setVideoInterface(output_id, intf_id, { enable })
				await self.checkState()
			},
		}

		actions.setAudioInterfaceEnable = {
			name: 'Set Audio Interface Enable',
			description: 'Enable or disable HDMI1, HDMI2, SDI, or Line Out audio output',
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
					label: 'Interface',
					id: 'intf_id',
					default: '1',
					choices: self.CHOICES_AUDIO_INTERFACES,
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
				const { output_id, intf_id, enable } = action.options
				await self.DEVICE.setAudioInterface(output_id, intf_id, {
					enable: enable === 'true',
				})
				await self.checkState()
			},
		}

		actions.toggleAudioInterfaceEnable = {
			name: 'Toggle Audio Interface',
			description: 'Enable or disable HDMI1, HDMI2, SDI, or Line Out audio output',
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
					label: 'Interface',
					id: 'intf_id',
					default: '1',
					choices: self.CHOICES_AUDIO_INTERFACES,
				},
			],
			callback: async (action) => {
				const { output_id, intf_id } = action.options
				const list = self.STATE.audio_interfaces[String(output_id)]
				const intf = Array.isArray(list) ? list.find((i) => String(i.id) === String(intf_id)) : null
				const enable = !(intf?.enable === true)
				await self.DEVICE.setAudioInterface(output_id, intf_id, { enable })
				await self.checkState()
			},
		}

		actions.setAudioInterfaceMute = {
			name: 'Set Audio Interface Mute',
			description: 'Mute or unmute an audio output interface',
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
					label: 'Interface',
					id: 'intf_id',
					default: '1',
					choices: self.CHOICES_AUDIO_INTERFACES,
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
				const { output_id, intf_id, mute } = action.options
				await self.DEVICE.setAudioInterface(output_id, intf_id, {
					mute: mute === 'true',
				})
				await self.checkState()
			},
		}

		actions.toggleAudioInterfaceMute = {
			name: 'Toggle Audio Interface Mute',
			description: 'Toggle mute on HDMI1, HDMI2, SDI, or Line Out audio output',
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
					label: 'Interface',
					id: 'intf_id',
					default: '1',
					choices: self.CHOICES_AUDIO_INTERFACES,
				},
			],
			callback: async (action) => {
				const { output_id, intf_id } = action.options
				const list = self.STATE.audio_interfaces[String(output_id)]
				const intf = Array.isArray(list) ? list.find((i) => String(i.id) === String(intf_id)) : null
				const mute = !(intf?.mute === true)
				await self.DEVICE.setAudioInterface(output_id, intf_id, { mute })
				await self.checkState()
			},
		}

		actions.setAudioInterfaceVolume = {
			name: 'Set Audio Interface Volume',
			description: 'Set audio output volume in dB (-51 to 20)',
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
					label: 'Interface',
					id: 'intf_id',
					default: '1',
					choices: self.CHOICES_AUDIO_INTERFACES,
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
				const { output_id, intf_id, volume } = action.options
				await self.DEVICE.setAudioInterface(output_id, intf_id, {
					volume: parseInt(volume),
				})
				await self.checkState()
			},
		}

		actions.startStream = {
			name: 'Start Stream Playback',
			options: [...self.buildGroupStreamFields(self)],
			callback: async (action) => {
				const streamSelection = self.resolveStream(self, action.options)
				if (!streamSelection) {
					return
				}
				await self.DEVICE.startPlay(streamSelection.stream_id)
				await self.checkState()
			},
		}

		actions.stopStream = {
			name: 'Stop Stream Playback',
			options: [...self.buildGroupStreamFields(self)],
			callback: async (action) => {
				const streamSelection = self.resolveStream(self, action.options)
				if (!streamSelection) {
					return
				}
				await self.DEVICE.stopPlay(streamSelection.stream_id)
				await self.checkState()
			},
		}

		actions.setMute = {
			name: 'Set Position Mute',
			options: [
				...self.buildOutputPositionFields(self),
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
				const position = self.resolveOutputPosition(self, action.options)
				if (!position) {
					self.log('warn', 'Invalid output or position selection')
					return
				}
				const { output_id, pos_id } = position
				await self.DEVICE.setMute(output_id, pos_id, action.options.mute === 'true')
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
				...self.buildGroupStreamFields(self),
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
				const streamSelection = self.resolveStream(self, action.options)
				if (!streamSelection) {
					self.log('warn', 'No stream selected')
					return
				}
				const stream = self.findStream(self, streamSelection.stream_id)
				if (!stream) {
					self.log('warn', 'Stream not found in cached source list; refresh sources first')
					return
				}
				const { name, url, user, password, trans_mode } = action.options
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
			options: [...self.buildGroupStreamFields(self)],
			callback: async (action) => {
				const streamSelection = self.resolveStream(self, action.options)
				if (!streamSelection) {
					self.log('warn', 'No stream selected')
					return
				}
				await self.DEVICE.removeSourceStream({
					group_id: streamSelection.group_id,
					stream_id: streamSelection.stream_id,
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
				...self.buildGroupStreamFields(self),
				{
					type: 'dropdown',
					label: 'Output Context',
					id: 'output_id',
					default: self.getDefaultOutputId(self),
					choices: self.CHOICES_OUTPUTS,
				},
			],
			callback: async (action) => {
				const streamSelection = self.resolveStream(self, action.options)
				if (!streamSelection) {
					return
				}
				const { output_id } = action.options
				const stream = self.findStream(self, streamSelection.stream_id)
				const params = self.DEVICE.buildPreviewAssignParams(
					{
						id: streamSelection.stream_id,
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
					default: self.getDefaultOutputId(self),
					choices: self.CHOICES_OUTPUTS,
				},
				...self.buildGroupStreamFields(self),
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
				const streamSelection = self.resolveStream(self, action.options)
				if (!streamSelection) {
					return
				}
				const { output_id, mix_type, enable } = action.options
				await self.DEVICE.setAudiomix({
					output_id,
					stream_id: streamSelection.stream_id,
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
					default: self.getDefaultOutputId(self),
					choices: self.CHOICES_OUTPUTS,
				},
				...self.buildGroupStreamFields(self),
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
				const streamSelection = self.resolveStream(self, action.options)
				if (!streamSelection) {
					return
				}
				const { output_id, mix_type, volume } = action.options
				await self.DEVICE.setAudiomix({
					output_id,
					stream_id: streamSelection.stream_id,
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
				...self.buildOutputPositionFields(self),
				{
					type: 'dropdown',
					label: 'Preset',
					id: 'preset_no',
					default: '0',
					choices: self.CHOICES_PTZ_PRESETS,
				},
			],
			callback: async (action) => {
				const position = self.resolveOutputPosition(self, action.options)
				if (!position) {
					self.log('warn', 'Invalid output or position selection')
					return
				}
				const { output_id, pos_id } = position
				const { preset_no } = action.options
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
				...self.buildOutputPositionFields(self),
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
				const position = self.resolveOutputPosition(self, action.options)
				if (!position) {
					self.log('warn', 'Invalid output or position selection')
					return
				}
				const { output_id, pos_id } = position
				const { preset_no, speed } = action.options
				const layoutId =
					self.STATE.output_details?.[String(output_id)]?.layout_id ||
					parseInt(self.CHOICES_LAYOUTS[0]?.id || 1)
				await self.DEVICE.ptzRecallPreset(output_id, pos_id, preset_no, speed, layoutId)
			},
		}

		self.setActionDefinitions(actions)
	},
}
