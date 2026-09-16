const {
	buildOutputPositionFields,
	buildGroupStreamFields,
	buildLayoutField,
	buildResolutionField,
	buildOutputField,
	resolveOutputPosition,
	resolveStream,
	findStream,
	getDefaultOutputId,
} = require('../fields/optionFields')
const { isSelectLayoutCrashFirmware } = require('../device/quirks')

/**
 * Decoder Actions (24): registered only for the decoder profile.
 * Migrated from companion-module-kiloview-decoder/src/actions.js, keeping the
 * existing action ids unchanged. Fixes per design doc 06 §7:
 *  - setMute moved to commonActions (works on gateway too, POST /output/mute/set)
 *  - start/stopStreamPlayback moved here from commonActions (404 on MG gateway)
 *  - ptzStorePreset/ptzRecallPreset: drop the undocumented layout_id field
 *  - setResolution: mark the current resolution as (Active)
 */
function buildActions(instance) {
	const actions = {}

	// ── System ───────────────────────────────────────────────────────────
	actions.restore = {
		name: 'Restore Factory Settings',
		options: [],
		callback: async () => {
			await instance.DEVICE.restore()
		},
	}

	// ── Layout ────────────────────────────────────────────────────────────
	actions.selectLayoutAndAssignSource = {
		name: 'Select Layout and Assign Source',
		description: 'Switch layout on an output, then assign a stream to a position',
		options: [
			buildOutputField(instance),
			buildLayoutField(instance, getDefaultOutputId(instance)),
			...buildOutputPositionFields(instance).slice(1),
			...buildGroupStreamFields(instance),
		],
		callback: async (action) => {
			const { output_id, layout_id } = action.options
			const position = resolveOutputPosition(instance, action.options)
			const streamSelection = resolveStream(instance, action.options)
			if (!streamSelection) {
				instance.log('warn', 'No stream selected')
				return
			}
			if (!position) {
				instance.log('warn', 'Invalid output or position selection')
				return
			}
			if (String(position.output_id) !== String(output_id)) {
				instance.log('warn', 'Position must match the selected output')
				return
			}
			if (isSelectLayoutCrashFirmware(instance)) {
				instance.log(
					'warn',
					`Select Layout is blocked: D350 firmware ${instance.STATE.firmware_version} crashes on this request. ` +
						'Please upgrade the device firmware to 2.20.0732.1222 or newer, or switch layouts from the web UI.'
				)
				return
			}
			const { pos_id } = position
			const { stream_id } = streamSelection

			// Guard: re-selecting the already-active layout is a no-op on
			// healthy firmware; the assign-source call still runs below.
			const currentLayoutId = instance.STATE.outputs?.find(
				(o) => String(o.id) === String(output_id)
			)?.layout_id
			if (currentLayoutId === undefined || String(currentLayoutId) !== String(layout_id)) {
				await instance.DEVICE.selectLayout(output_id, layout_id)
				await instance.checkState()
			} else if (instance.config.verbose) {
				instance.log('debug', `Select Layout: layout ${layout_id} is already active on output ${output_id}, skipping`)
			}

			const stream = findStream(instance, stream_id)
			const params = instance.DEVICE.buildAssignSourceParams(
				output_id,
				pos_id,
				{ id: stream_id, name: stream?.name || stream?.label || '', url: stream?.url || '' },
				parseInt(layout_id)
			)
			await instance.DEVICE.setSource(params)
			await instance.checkState()
			await instance.checkSources()
		},
	}

	actions.saveLayout = {
		name: 'Save Layout',
		description: 'Save current output changes to the selected layout preset',
		options: [
			buildOutputField(instance),
			buildLayoutField(instance, getDefaultOutputId(instance)),
		],
		callback: async (action) => {
			const { output_id, layout_id } = action.options
			await instance.DEVICE.saveLayout(output_id, layout_id)
			await instance.checkState()
		},
	}

	actions.reloadLayout = {
		name: 'Reload Layout',
		description: 'Reload layout from saved preset (discards unsaved changes)',
		options: [
			buildOutputField(instance),
			buildLayoutField(instance, getDefaultOutputId(instance)),
		],
		callback: async (action) => {
			const { output_id, layout_id } = action.options
			await instance.DEVICE.reloadLayout(output_id, layout_id)
			await instance.checkState()
		},
	}

	// ── Output & Source ───────────────────────────────────────────────────
	actions.setResolution = {
		name: 'Set Output Resolution',
		description: 'Set output resolution (current marked as Active)',
		options: [
			buildOutputField(instance),
			buildResolutionField(instance, getDefaultOutputId(instance)),
		],
		callback: async (action) => {
			const { output_id, res_id } = action.options
			await instance.DEVICE.setResolution(output_id, res_id)
			await instance.checkState()
		},
	}

	actions.startStreamPlayback = {
		name: 'Start Stream Playback',
		description: 'Start playback of a stream (uses /source/streams/startPlay)',
		options: [...buildGroupStreamFields(instance)],
		callback: async (action) => {
			const streamSelection = resolveStream(instance, action.options)
			if (!streamSelection) return
			await instance.DEVICE.startPlay(streamSelection.stream_id)
			await instance.checkState()
			await instance.checkSources()
		},
	}

	actions.stopStreamPlayback = {
		name: 'Stop Stream Playback',
		description: 'Stop playback of a stream (uses /source/streams/stopPlay)',
		options: [...buildGroupStreamFields(instance, 'Stream', { activeOnly: true })],
		callback: async (action) => {
			const streamSelection = resolveStream(instance, action.options)
			if (!streamSelection) return
			await instance.DEVICE.stopPlay(streamSelection.stream_id)
			await instance.checkState()
			await instance.checkSources()
		},
	}

	actions.modifySourceStream = {
		name: 'Modify Source Stream',
		description: 'Update an existing stream (leave fields blank to keep current values)',
		options: [
			...buildGroupStreamFields(instance),
			{ type: 'textinput', label: 'Name (optional)', id: 'name', default: '', useVariables: true },
			{ type: 'textinput', label: 'URL (optional)', id: 'url', default: '', useVariables: true },
			{ type: 'textinput', label: 'Username (optional)', id: 'user', default: '', useVariables: true },
			{ type: 'textinput', label: 'Password (optional)', id: 'password', default: '', useVariables: true },
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
			const streamSelection = resolveStream(instance, action.options)
			if (!streamSelection) {
				instance.log('warn', 'No stream selected')
				return
			}
			const stream = findStream(instance, streamSelection.stream_id)
			if (!stream) {
				instance.log('warn', 'Stream not found in cached source list; refresh sources first')
				return
			}
			const { name, url, user, password, trans_mode } = action.options
			const params = instance.DEVICE.buildModifyStreamParams(stream, {
				name,
				url,
				user,
				password,
				trans_mode,
			})
			await instance.DEVICE.modifySourceStream(params)
			await instance.checkSources()
		},
	}

	// ── Video Output Interface (HDMI/SDI) ──────────────────────────────────
	const enableChoices = [
		{ id: 'true', label: 'On' },
		{ id: 'false', label: 'Off' },
	]
	const muteChoices = [
		{ id: 'true', label: 'Mute On' },
		{ id: 'false', label: 'Mute Off' },
	]

	actions.setVideoInterfaceEnable = {
		name: 'Set Video Interface Enable',
		description: 'Enable or disable HDMI/SDI video output (HDMI1, HDMI2, SDI)',
		options: [
			buildOutputField(instance),
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'intf_id',
				default: '1',
				choices: instance.CHOICES_VIDEO_INTERFACES,
			},
			{ type: 'dropdown', label: 'Enable', id: 'enable', default: 'true', choices: enableChoices },
		],
		callback: async (action) => {
			const { output_id, intf_id, enable } = action.options
			await instance.DEVICE.setVideoInterface(output_id, intf_id, { enable: enable === 'true' })
			await instance.checkState()
		},
	}

	actions.toggleVideoInterfaceEnable = {
		name: 'Toggle Video Interface',
		description: 'Enable or disable HDMI1, HDMI2, or SDI video output',
		options: [
			buildOutputField(instance),
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'intf_id',
				default: '1',
				choices: instance.CHOICES_VIDEO_INTERFACES,
			},
		],
		callback: async (action) => {
			const { output_id, intf_id } = action.options
			const list = instance.STATE.video_interfaces[String(output_id)]
			const intf = Array.isArray(list) ? list.find((i) => String(i.id) === String(intf_id)) : null
			const enable = !(intf?.enable === true)
			await instance.DEVICE.setVideoInterface(output_id, intf_id, { enable })
			await instance.checkState()
		},
	}

	actions.setVideoInterfaceMode = {
		name: 'Set Video Interface Mode',
		description: 'Set HDMI/DVI mode on HDMI1 or HDMI2',
		options: [
			buildOutputField(instance),
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'intf_id',
				default: '1',
				choices: instance.CHOICES_VIDEO_INTERFACES.filter((i) => i.id !== '3'),
			},
			{
				type: 'dropdown',
				label: 'Mode',
				id: 'mode',
				default: 'HDMI',
				choices: instance.CHOICES_VIDEO_INTERFACE_MODES,
			},
		],
		callback: async (action) => {
			const { output_id, intf_id, mode } = action.options
			await instance.DEVICE.setVideoInterface(output_id, intf_id, { mode })
			await instance.checkState()
		},
	}

	actions.setVideoInterfaceColorspace = {
		name: 'Set Video Interface Colorspace',
		description: 'Set colorspace on HDMI1, HDMI2, or SDI',
		options: [
			buildOutputField(instance),
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'intf_id',
				default: '1',
				choices: instance.CHOICES_VIDEO_INTERFACES,
			},
			{
				type: 'dropdown',
				label: 'Colorspace',
				id: 'colorspace',
				default: 'RGB444',
				choices: instance.CHOICES_VIDEO_COLORSPACES,
			},
		],
		callback: async (action) => {
			const { output_id, intf_id, colorspace } = action.options
			await instance.DEVICE.setVideoInterface(output_id, intf_id, { colorspace })
			await instance.checkState()
		},
	}

	// ── Audio Output Interface (HDMI/SDI/Line Out) ─────────────────────────
	actions.setAudioInterfaceEnable = {
		name: 'Set Audio Interface Enable',
		description: 'Enable or disable HDMI1, HDMI2, SDI, or Line Out audio output',
		options: [
			buildOutputField(instance),
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'intf_id',
				default: '1',
				choices: instance.CHOICES_AUDIO_INTERFACES,
			},
			{ type: 'dropdown', label: 'Enable', id: 'enable', default: 'true', choices: enableChoices },
		],
		callback: async (action) => {
			const { output_id, intf_id, enable } = action.options
			await instance.DEVICE.setAudioInterface(output_id, intf_id, { enable: enable === 'true' })
			await instance.checkState()
		},
	}

	actions.toggleAudioInterfaceEnable = {
		name: 'Toggle Audio Interface',
		description: 'Enable or disable HDMI1, HDMI2, SDI, or Line Out audio output',
		options: [
			buildOutputField(instance),
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'intf_id',
				default: '1',
				choices: instance.CHOICES_AUDIO_INTERFACES,
			},
		],
		callback: async (action) => {
			const { output_id, intf_id } = action.options
			const list = instance.STATE.audio_interfaces[String(output_id)]
			const intf = Array.isArray(list) ? list.find((i) => String(i.id) === String(intf_id)) : null
			const enable = !(intf?.enable === true)
			await instance.DEVICE.setAudioInterface(output_id, intf_id, { enable })
			await instance.checkState()
		},
	}

	actions.setAudioInterfaceMute = {
		name: 'Set Audio Interface Mute',
		description: 'Mute or unmute an audio output interface',
		options: [
			buildOutputField(instance),
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'intf_id',
				default: '1',
				choices: instance.CHOICES_AUDIO_INTERFACES,
			},
			{ type: 'dropdown', label: 'Mute', id: 'mute', default: 'true', choices: muteChoices },
		],
		callback: async (action) => {
			const { output_id, intf_id, mute } = action.options
			await instance.DEVICE.setAudioInterface(output_id, intf_id, { mute: mute === 'true' })
			await instance.checkState()
		},
	}

	actions.toggleAudioInterfaceMute = {
		name: 'Toggle Audio Interface Mute',
		description: 'Toggle mute on HDMI1, HDMI2, SDI, or Line Out audio output',
		options: [
			buildOutputField(instance),
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'intf_id',
				default: '1',
				choices: instance.CHOICES_AUDIO_INTERFACES,
			},
		],
		callback: async (action) => {
			const { output_id, intf_id } = action.options
			const list = instance.STATE.audio_interfaces[String(output_id)]
			const intf = Array.isArray(list) ? list.find((i) => String(i.id) === String(intf_id)) : null
			const mute = !(intf?.mute === true)
			await instance.DEVICE.setAudioInterface(output_id, intf_id, { mute })
			await instance.checkState()
		},
	}

	actions.setAudioInterfaceVolume = {
		name: 'Set Audio Interface Volume',
		description: 'Set audio output volume in dB (-51 to 20)',
		options: [
			buildOutputField(instance),
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'intf_id',
				default: '1',
				choices: instance.CHOICES_AUDIO_INTERFACES,
			},
			{ type: 'number', label: 'Volume (dB)', id: 'volume', default: 0, min: -51, max: 20 },
		],
		callback: async (action) => {
			const { output_id, intf_id, volume } = action.options
			await instance.DEVICE.setAudioInterface(output_id, intf_id, { volume: parseInt(volume) })
			await instance.checkState()
		},
	}

	// ── NDI ───────────────────────────────────────────────────────────────
	actions.addNdiSource = {
		name: 'Add NDI Source',
		description: 'Add an NDI stream to a source group',
		options: [
			{
				type: 'dropdown',
				label: 'Source Group',
				id: 'group_id',
				default: instance.CHOICES_GROUPS[0]?.id || 'null',
				choices: instance.CHOICES_GROUPS,
			},
			{ type: 'textinput', label: 'NDI Name', id: 'ndi_name', default: '', useVariables: true },
			{ type: 'textinput', label: 'URL (ip:port)', id: 'url', default: '', useVariables: true },
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
			{ type: 'textinput', label: 'NDI Group', id: 'group_name', default: 'public', useVariables: true },
		],
		callback: async (action) => {
			const { group_id, ndi_name, url, channel, group_name } = action.options
			if (!group_id || group_id === 'null') {
				instance.log('warn', 'No source group selected')
				return
			}
			if (!ndi_name || !url) {
				instance.log('warn', 'NDI name and URL are required')
				return
			}
			const params = instance.DEVICE.buildAddNdiStreamParams(group_id, {
				ndi_name,
				url,
				channel,
				group_name,
			})
			await instance.DEVICE.addSourceStream(params)
			await instance.checkSources()
		},
	}

	actions.addNdiManualIp = {
		name: 'NDI: Add Manual IP',
		description: 'Add a manual NDI discovery IP and group',
		options: [
			{ type: 'textinput', label: 'IP Address', id: 'ip', default: '', useVariables: true },
			{ type: 'textinput', label: 'Group Name', id: 'group', default: 'public', useVariables: true },
		],
		callback: async (action) => {
			const { ip, group } = action.options
			if (!ip) {
				instance.log('warn', 'NDI manual IP is empty')
				return
			}
			await instance.DEVICE.addNdiManualIp(ip, group || 'public')
			await instance.checkSources()
		},
	}

	actions.addNdiDiscoveryServer = {
		name: 'NDI: Add Discovery Server',
		description: 'Add an NDI discovery server address',
		options: [
			{ type: 'textinput', label: 'Server IP', id: 'server_ip', default: '', useVariables: true },
			{ type: 'textinput', label: 'Group Name', id: 'group', default: 'public', useVariables: true },
		],
		callback: async (action) => {
			const { server_ip, group } = action.options
			if (!server_ip) {
				instance.log('warn', 'NDI discovery server IP is empty')
				return
			}
			await instance.DEVICE.addNdiDiscoveryServer(server_ip, group || 'public')
			await instance.checkSources()
		},
	}

	// ── Audiomix ──────────────────────────────────────────────────────────
	actions.setAudiomixEnable = {
		name: 'Set Audiomix Enable',
		description: 'Enable or disable a stream in the output/preview audiomix',
		options: [
			buildOutputField(instance),
			...buildGroupStreamFields(instance),
			{
				type: 'dropdown',
				label: 'Mix Type',
				id: 'mix_type',
				default: 'output',
				choices: instance.CHOICES_AUDIOMIX_TYPES,
			},
			{ type: 'dropdown', label: 'Enable', id: 'enable', default: 'true', choices: enableChoices },
		],
		callback: async (action) => {
			const streamSelection = resolveStream(instance, action.options)
			if (!streamSelection) {
				return
			}
			const { output_id, mix_type, enable } = action.options
			await instance.DEVICE.setAudiomix({
				output_id,
				stream_id: streamSelection.stream_id,
				type: mix_type,
				enable: enable === 'true',
			})
			await instance.checkState()
		},
	}

	actions.setAudiomixVolume = {
		name: 'Set Audiomix Volume',
		description: 'Set audiomix volume in dB (-51 to 20)',
		options: [
			buildOutputField(instance),
			...buildGroupStreamFields(instance),
			{
				type: 'dropdown',
				label: 'Mix Type',
				id: 'mix_type',
				default: 'output',
				choices: instance.CHOICES_AUDIOMIX_TYPES,
			},
			{ type: 'number', label: 'Volume (dB)', id: 'volume', default: 0, min: -51, max: 20 },
		],
		callback: async (action) => {
			const streamSelection = resolveStream(instance, action.options)
			if (!streamSelection) {
				return
			}
			const { output_id, mix_type, volume } = action.options
			await instance.DEVICE.setAudiomix({
				output_id,
				stream_id: streamSelection.stream_id,
				type: mix_type,
				volume: parseInt(volume),
			})
			await instance.checkState()
		},
	}

	// ── PTZ (NDI sources only) ─────────────────────────────────────────────
	actions.ptzStorePreset = {
		name: 'PTZ: Store Preset',
		description: 'Store current PTZ position to a preset slot (NDI sources only)',
		options: [
			...buildOutputPositionFields(instance),
			{
				type: 'dropdown',
				label: 'Preset',
				id: 'preset_no',
				default: '0',
				choices: instance.CHOICES_PTZ_PRESETS,
			},
		],
		callback: async (action) => {
			const position = resolveOutputPosition(instance, action.options)
			if (!position) {
				instance.log('warn', 'Invalid output or position selection')
				return
			}
			const { output_id, pos_id } = position
			const { preset_no } = action.options
			// Fix: layout_id removed from body (undocumented field, per §7.3)
			await instance.DEVICE.ptzStorePreset(output_id, pos_id, preset_no)
		},
	}

	actions.ptzRecallPreset = {
		name: 'PTZ: Recall Preset',
		description: 'Recall a stored PTZ preset (NDI sources only)',
		options: [
			...buildOutputPositionFields(instance),
			{
				type: 'dropdown',
				label: 'Preset',
				id: 'preset_no',
				default: '0',
				choices: instance.CHOICES_PTZ_PRESETS,
			},
			{ type: 'textinput', label: 'Speed (0.0 - 1.0)', id: 'speed', default: '0.5', useVariables: true },
		],
		callback: async (action) => {
			const position = resolveOutputPosition(instance, action.options)
			if (!position) {
				instance.log('warn', 'Invalid output or position selection')
				return
			}
			const { output_id, pos_id } = position
			const { preset_no, speed } = action.options
			// Fix: layout_id removed from body (undocumented field, per §7.3)
			await instance.DEVICE.ptzRecallPreset(output_id, pos_id, preset_no, speed)
		},
	}

	return actions
}

module.exports = { buildActions }
