const { combineRgb } = require('@companion-module/base')

/**
 * Presets for the merged module.
 * Merges decoder and gateway preset categories, branching by profile.
 * Action ids reference the new merged ids (startStreamPlayback, previewAssign,
 * gatewayStartPush, gatewayAddService, addDecodeSourceJson, ...).
 * Variable prefix is `$(KV-Decoder:...)` (the default connection label).
 */
function text(t, bg, fg) {
	return { text: t, size: '14', color: fg != null ? fg : combineRgb(255, 255, 255), bgcolor: bg }
}

function step(actionId, options) {
	const down = options ? [{ actionId, options }] : [{ actionId }]
	return [{ down, up: [] }]
}

const white = combineRgb(255, 255, 255)
const red = combineRgb(255, 0, 0)
const blue = combineRgb(0, 0, 255)
const green = combineRgb(0, 128, 0)
const darkGreen = combineRgb(0, 100, 0)
const darkBlue = combineRgb(0, 0, 128)
const purple = combineRgb(138, 43, 226)
const teal = combineRgb(0, 128, 128)
const olive = combineRgb(128, 128, 0)
const gray = combineRgb(128, 128, 128)
const darkGray = combineRgb(64, 64, 64)
const black = combineRgb(0, 0, 0)
const marine = combineRgb(0, 100, 200)

module.exports = {
	initPresets() {
		// Variable prefix = connection label, which defaults to the manifest
		// shortname ("KV-Decoder"). Renaming the connection breaks these.
		const VAR = 'KV-Decoder'
		const presets = []

		// === General (both profiles) ===
		presets.push({
			category: 'General',
			type: 'button',
			name: 'Refresh Device Status',
			style: text('Refresh', blue),
			steps: step('refreshStatus'),
			feedbacks: [],
		})
		presets.push({
			category: 'General',
			type: 'button',
			name: 'Reboot Device',
			style: text('Reboot', red),
			steps: step('reboot'),
			feedbacks: [],
		})

		// === Info (both profiles) ===
		presets.push({
			category: 'Info',
			type: 'button',
			name: 'Display Device Info',
			style: {
				text: `Name:$(${VAR}:device_name)\nFW:$(${VAR}:firmware_version)\nSW:$(${VAR}:software_version)\nSN:$(${VAR}:serial_number)\nHW:$(${VAR}:hardware_version)`,
				size: 'auto',
				color: white,
				bgcolor: black,
			},
			steps: [],
			feedbacks: [],
		})
		presets.push({
			category: 'Info',
			type: 'button',
			name: 'Display IP Address',
			style: {
				text: `IP:\n$(${VAR}:ip)`,
				size: 'auto',
				color: white,
				bgcolor: black,
			},
			steps: [],
			feedbacks: [],
		})

		if (this.isDecoder()) {
			this._pushDecoderPresets(presets, text)
		} else if (this.isGateway()) {
			this._pushGatewayPresets(presets, text)
		}

		this.setPresetDefinitions(presets)
	},

	// ── Decoder presets ────────────────────────────────────────────────────
	_pushDecoderPresets(presets, text) {
		// Select Layout
		presets.push(
			{
				category: 'Select Layout',
				type: 'button',
				name: 'Select Layout for Output',
				style: text('Select Layout', green),
				steps: step('selectLayout'),
				feedbacks: [],
			},
			{
				category: 'Select Layout',
				type: 'button',
				name: 'Save Layout',
				style: text('Save\\nLayout', blue),
				steps: step('saveLayout'),
				feedbacks: [],
			},
			{
				category: 'Select Layout',
				type: 'button',
				name: 'Reload Layout',
				style: text('Reload\\nLayout', olive),
				steps: step('reloadLayout'),
				feedbacks: [],
			},
			{
				category: 'Select Layout',
				type: 'button',
				name: 'Select Layout and Assign Source',
				style: text('Layout+\\nSource', combineRgb(0, 100, 100)),
				steps: step('selectLayoutAndAssignSource'),
				feedbacks: [],
			}
		)

		// Video Output
		presets.push(
			{
				category: 'Video Output',
				type: 'button',
				name: 'Toggle Video Interface',
				style: text('Toggle\\nVideo', green),
				steps: step('toggleVideoInterfaceEnable'),
				feedbacks: [],
			},
			{
				category: 'Video Output',
				type: 'button',
				name: 'Set Video Interface Enable',
				style: text('Video\\nOn/Off', darkGreen),
				steps: step('setVideoInterfaceEnable'),
				feedbacks: [],
			},
			{
				category: 'Video Output',
				type: 'button',
				name: 'Set Video Interface Mode',
				style: text('Video\\nMode', combineRgb(0, 80, 160)),
				steps: step('setVideoInterfaceMode'),
				feedbacks: [],
			},
			{
				category: 'Video Output',
				type: 'button',
				name: 'Set Video Colorspace',
				style: text('Video\\nColor', combineRgb(80, 80, 160)),
				steps: step('setVideoInterfaceColorspace'),
				feedbacks: [],
			}
		)

		// Audio Output
		presets.push(
			{
				category: 'Audio Output',
				type: 'button',
				name: 'Toggle Audio Interface',
				style: text('Toggle\\nAudio', green),
				steps: step('toggleAudioInterfaceEnable'),
				feedbacks: [],
			},
			{
				category: 'Audio Output',
				type: 'button',
				name: 'Set Audio Interface Enable',
				style: text('Audio\\nOn/Off', darkGreen),
				steps: step('setAudioInterfaceEnable'),
				feedbacks: [],
			},
			{
				category: 'Audio Output',
				type: 'button',
				name: 'Set Audio Mute',
				style: text('Audio\\nMute', olive),
				steps: step('setAudioInterfaceMute'),
				feedbacks: [],
			},
			{
				category: 'Audio Output',
				type: 'button',
				name: 'Set Audio Volume',
				style: text('Audio\\nVolume', combineRgb(64, 128, 128)),
				steps: step('setAudioInterfaceVolume'),
				feedbacks: [],
			}
		)

		// Output Source
		presets.push(
			{
				category: 'Output Source',
				type: 'button',
				name: 'Assign Source to Position',
				style: text('Assign\\nSource', combineRgb(0, 0, 200)),
				steps: step('assignSource'),
				feedbacks: [],
			},
			{
				category: 'Output Source',
				type: 'button',
				name: 'Remove Source from Position',
				style: text('Remove\\nSource', combineRgb(128, 0, 0)),
				steps: step('removeSource'),
				feedbacks: [],
			},
			{
				category: 'Output Source',
				type: 'button',
				name: 'Set Position Mute',
				style: text('Pos\\nMute', gray),
				steps: step('setMute'),
				feedbacks: [],
			},
			{
				category: 'Output Source',
				type: 'button',
				name: 'Set Output Resolution',
				style: text('Set\\nResolution', darkBlue),
				steps: step('setResolution'),
				feedbacks: [],
			}
		)

		// Source Group
		presets.push(
			{
				category: 'Source Group',
				type: 'button',
				name: 'Refresh Source List',
				style: text('Refresh\\nSources', blue),
				steps: step('refreshSources'),
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Add RTSP Source',
				style: text('Add\\nRTSP', purple),
				steps: step('addSourceStream', {
					group_id: this.CHOICES_GROUPS[0]?.id || 'null',
					type: 'rtsp',
					name: '',
					url: 'rtsp://*.*.*.*/live/stream',
					user: '',
					password: '',
					trans_mode: 'tcp',
				}),
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Add NDI Source',
				style: text('Add\\nNDI', teal),
				steps: step('addNdiSource'),
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Modify Source Stream',
				style: text('Modify\\nStream', olive),
				steps: step('modifySourceStream'),
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Remove Source Stream',
				style: text('Remove\\nStream', combineRgb(128, 0, 0)),
				steps: step('removeSourceStream'),
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Start Stream Playback',
				style: text('Start\\nStream', green),
				steps: step('startStreamPlayback'),
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Stop Stream Playback',
				style: text('Stop\\nStream', gray),
				steps: step('stopStreamPlayback'),
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'NDI: Add Manual IP',
				style: text('NDI\\nManual IP', marine),
				steps: step('addNdiManualIp'),
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'NDI: Add Discovery Server',
				style: text('NDI\\nDiscovery', marine),
				steps: step('addNdiDiscoveryServer'),
				feedbacks: [],
			}
		)

		// PTZ
		presets.push(
			{
				category: 'PTZ',
				type: 'button',
				name: 'Recall PTZ Preset',
				style: text('PTZ\\nRecall', black),
				steps: step('ptzRecallPreset'),
				feedbacks: [],
			},
			{
				category: 'PTZ',
				type: 'button',
				name: 'Store PTZ Preset',
				style: text('PTZ\\nStore', darkGray),
				steps: step('ptzStorePreset'),
				feedbacks: [],
			}
		)

		// System (decoder-only)
		presets.push({
			category: 'System',
			type: 'button',
			name: 'Restore Factory Settings',
			style: text('Restore\\nFactory', red),
			steps: step('restore'),
			feedbacks: [],
		})

		// Audio Output — additional toggle mute
		presets.push({
			category: 'Audio Output',
			type: 'button',
			name: 'Toggle Audio Interface Mute',
			style: text('Toggle\\nAudio Mute', darkGreen),
			steps: step('toggleAudioInterfaceMute'),
			feedbacks: [],
		})

		// Audiomix (decoder-only)
		presets.push(
			{
				category: 'Audiomix',
				type: 'button',
				name: 'Set Audiomix Enable',
				style: text('Mix\\nEnable', teal),
				steps: step('setAudiomixEnable'),
				feedbacks: [],
			},
			{
				category: 'Audiomix',
				type: 'button',
				name: 'Set Audiomix Volume',
				style: text('Mix\\nVolume', marine),
				steps: step('setAudiomixVolume'),
				feedbacks: [],
			}
		)

		// Preview (decoder)
		presets.push(
			{
				category: 'Preview',
				type: 'button',
				name: 'Assign Source to Preview',
				style: text('Preview\\nAssign', marine),
				steps: step('previewAssign'),
				feedbacks: [],
			},
			{
				category: 'Preview',
				type: 'button',
				name: 'Remove Preview Source',
				style: text('Preview\\nRemove', darkGray),
				steps: step('previewRemove'),
				feedbacks: [],
			}
		)
	},

	// ── Gateway presets ───────────────────────────────────────────────────
	_pushGatewayPresets(presets, text) {
		// Gateway Stream push templates
		const addPush = (name, label, protocol, body) =>
			presets.push({
				category: 'Gateway Stream',
				type: 'button',
				name: name,
				style: text(label, green),
				steps: step('gatewayAddService', { protocol, body }),
				feedbacks: [],
			})

		addPush('Add RTMP Push', 'Add\\nRTMP\\nPush', 'rtmp', '{\n  "protocol": "rtmp",\n  "name": "rtmp1",\n  "address": "rtmp://*.*.*.*/live/stream",\n  "user": "",\n  "password": "",\n  "conn_timeout": 15,\n  "conn_intv": 3,\n  "old_rtmp": false,\n  "is_enable": true,\n  "stream_id": "MultiViewMixer"\n}')
		addPush('Add SRT Push', 'Add\\nSRT\\nPush', 'srt', '{\n  "protocol": "srt",\n  "name": "srt1",\n  "connection_mode": "Listener",\n  "address": "",\n  "listener_port": 1025,\n  "latency": 125,\n  "encryption": "0",\n  "passphrase": "",\n  "bandwidth": 25,\n  "payload_size": 1316,\n  "srt_stream_id": "",\n  "advanced": "0",\n  "ts_null_multiple": 0,\n  "ts_service_name": "Encoder",\n  "ts_service_provider": "Encoder device",\n  "ts_transport_stream_id": 101,\n  "ts_pts_pcr_delay": 200,\n  "ts_pmt_start_pid": 480,\n  "ts_start_pid": 481,\n  "ts_tables_version": 6,\n  "ts_pcr_period": 20,\n  "is_enable": true,\n  "stream_id": "MultiViewMixer"\n}')
		addPush('Add RTSP Push', 'Add\\nRTSP\\nPush', 'rtsp', '{\n  "protocol": "rtsp",\n  "name": "rtsp1",\n  "port": 554,\n  "http_tunnel_port": 8554,\n  "session": "ch01",\n  "auth": false,\n  "user": "",\n  "pwd": "",\n  "multicast_enable": false,\n  "multicast_addr": "224.0.1.0",\n  "multicast_ttl": 127,\n  "multicast_port_min": 31000,\n  "multicast_port_max": 31004,\n  "is_enable": true,\n  "stream_id": "MultiViewMixer"\n}')
		addPush('Add NDI HX Push', 'Add\\nNDI\\nHX', 'ndi_hx', '{\n  "protocol": "ndi_hx",\n  "name": "ndi1",\n  "group": "",\n  "channel_name": "",\n  "connection": "disable_rudp",\n  "netprefix": "",\n  "netmask": "",\n  "ttl": 128,\n  "discovery_server": "",\n  "is_enable": true,\n  "stream_id": "MultiViewMixer"\n}')
		addPush('Add HLS Push', 'Add\\nHLS\\nPush', 'hls', '{\n  "protocol": "hls",\n  "name": "hls1",\n  "mode": "server",\n  "session": "ch1",\n  "segment_time": 5,\n  "max_segments": 5,\n  "media_playlist_url": "",\n  "is_enable": true,\n  "stream_id": "MultiViewMixer"\n}')
		addPush('Add TS Push', 'Add\\nTS\\nPush', 'ts', '{\n  "protocol": "ts",\n  "name": "ts1",\n  "address": "*.*.*.*",\n  "port": 2224,\n  "bind_port": 0,\n  "ttl": 127,\n  "ts_pts_pcr_delay": 200,\n  "ts_service_name": "Encoder",\n  "ts_service_provider": "Encoder device",\n  "ts_transport_stream_id": 101,\n  "ts_pmt_start_pid": 480,\n  "ts_start_pid": 481,\n  "ts_tables_version": 6,\n  "ts_pcr_period": 20,\n  "is_enable": true,\n  "stream_id": "MultiViewMixer"\n}')
		addPush('Add RTP Push', 'Add\\nRTP\\nPush', 'rtp', '{\n  "protocol": "rtp",\n  "name": "rtp1",\n  "address": "*.*.*.*",\n  "port": 2026,\n  "ttl": 127,\n  "load_type": "ts",\n  "ts_service_name": "Encoder",\n  "ts_service_provider": "Encoder device",\n  "ts_transport_stream_id": 101,\n  "ts_pmt_start_pid": 480,\n  "ts_start_pid": 481,\n  "ts_tables_version": 6,\n  "ts_pcr_period": 20,\n  "is_enable": true,\n  "stream_id": "MultiViewMixer"\n}')

		presets.push(
			{
				category: 'Gateway Stream',
				type: 'button',
				name: 'Start Gateway Push',
				style: text('Start\\nPush', green),
				steps: step('gatewayStartPush'),
				feedbacks: [],
			},
			{
				category: 'Gateway Stream',
				type: 'button',
				name: 'Stop Gateway Push',
				style: text('Stop\\nPush', gray),
				steps: step('gatewayStopPush'),
				feedbacks: [],
			},
			{
				category: 'Gateway Stream',
				type: 'button',
				name: 'Remove Gateway Stream Service',
				style: text('Remove\\nService', combineRgb(128, 0, 0)),
				steps: step('gatewayRemoveService'),
				feedbacks: [],
			}
		)

		// Decode Source templates
		const addDec = (name, label, protocol, body) =>
			presets.push({
				category: 'Decode Source',
				type: 'button',
				name: name,
				style: text(label, blue),
				steps: step('addDecodeSourceJson', { protocol, body }),
				feedbacks: [],
			})

		addDec('Add RTMP Source', 'Add\\nRTMP\\nSource', 'rtmp', '{\n  "type": "rtmp",\n  "url": "rtmp://*.*.*.*/live/stream",\n  "name": "",\n  "group_id": "",\n  "user": "",\n  "password": ""\n}')
		addDec('Add RTSP Source', 'Add\\nRTSP\\nSource', 'rtsp', '{\n  "type": "rtsp",\n  "url": "rtsp://*.*.*.*/live/stream",\n  "name": "",\n  "group_id": "",\n  "trans_mode": "tcp",\n  "user": "",\n  "password": ""\n}')
		addDec('Add UDP Source', 'Add\\nUDP\\nSource', 'udp', '{\n  "type": "udp",\n  "url": "udp://*.*.*.*:6555",\n  "name": "",\n  "group_id": ""\n}')
		addDec('Add SRT Source', 'Add\\nSRT\\nSource', 'srt', '{\n  "type": "srt",\n  "url": "srt://*.*.*.*:9000",\n  "name": "",\n  "group_id": "",\n  "latency": 125,\n  "connection_mode": "Listener"\n}')
		addDec('Add HLS Source', 'Add\\nHLS\\nSource', 'http', '{\n  "type": "http",\n  "url": "http://*.*.*.*/hls/main/playlist.m3u8",\n  "name": "",\n  "group_id": ""\n}')
		addDec('Add RTP Source', 'Add\\nRTP\\nSource', 'rtp', '{\n  "type": "rtp",\n  "url": "rtp://*.*.*.*:1026",\n  "name": "",\n  "group_id": ""\n}')

		presets.push({
			category: 'Decode Source',
			type: 'button',
			name: 'Remove Decode Source',
			style: text('Remove\\nDecode', combineRgb(128, 0, 0)),
			steps: step('removeDecodeSource'),
			feedbacks: [],
		})

		// Select Layout + Output Source + Source Group (gateway shares
		// these common actions with the decoder; verified via route table
		// in gatewayProfile.js — setSource/removeSource/preview/* all exist)
		presets.push(
			{
				category: 'Select Layout',
				type: 'button',
				name: 'Select Layout for Output',
				style: text('Select Layout', green),
				steps: step('selectLayout'),
				feedbacks: [],
			},
			{
				category: 'Output Source',
				type: 'button',
				name: 'Assign Source to Position',
				style: text('Assign\\nSource', combineRgb(0, 0, 200)),
				steps: step('assignSource'),
				feedbacks: [],
			},
			{
				category: 'Output Source',
				type: 'button',
				name: 'Remove Source from Position',
				style: text('Remove\\nSource', combineRgb(128, 0, 0)),
				steps: step('removeSource'),
				feedbacks: [],
			},
			{
				category: 'Output Source',
				type: 'button',
				name: 'Set Position Mute',
				style: text('Pos\\nMute', combineRgb(128, 128, 128)),
				steps: step('setMute'),
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Refresh Source List',
				style: text('Refresh\\nSources', blue),
				steps: step('refreshSources'),
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Add RTSP Source',
				style: text('Add\\nRTSP', purple),
				steps: step('addSourceStream', {
					group_id: this.CHOICES_GROUPS[0]?.id || 'null',
					type: 'rtsp',
					name: '',
					url: 'rtsp://*.*.*.*/live/stream',
					user: '',
					password: '',
					trans_mode: 'tcp',
				}),
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Modify Source Stream',
				style: text('Modify\\nStream', olive),
				steps: step('modifySourceStream'),
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Remove Source Stream',
				style: text('Remove\\nStream', combineRgb(128, 0, 0)),
				steps: step('removeSourceStream'),
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Add Source Group',
				style: text('Add\\nSource\\nGroup', darkGreen),
				steps: step('addSourceGroup', { name: '' }),
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Remove Source Group',
				style: text('Remove\\nSource\\nGroup', combineRgb(139, 0, 0)),
				steps: step('removeSourceGroup'),
				feedbacks: [],
			},
			{
				category: 'Preview',
				type: 'button',
				name: 'Assign Source to Preview',
				style: text('Preview\\nAssign', marine),
				steps: step('previewAssign'),
				feedbacks: [],
			},
			{
				category: 'Preview',
				type: 'button',
				name: 'Remove Preview Source',
				style: text('Preview\\nRemove', darkGray),
				steps: step('previewRemove'),
				feedbacks: [],
			}
		)

		// Multi Out (gateway-only)
	presets.push({
		category: 'Multi Out',
		type: 'button',
		name: 'Multi Out Switch',
		style: text('Multi\\nOut\\nSwitch', teal),
		steps: step('multiOutSwitch'),
		feedbacks: [],
	})

		// Layout (gateway supports layout/save-reload, same as decoder)
		presets.push(
			{
				category: 'Select Layout',
				type: 'button',
				name: 'Select Layout and Assign Source',
				style: text('Layout\\n+Source', purple),
				steps: step('selectLayoutAndAssignSource'),
				feedbacks: [],
			},
			{
				category: 'Select Layout',
				type: 'button',
				name: 'Save Layout',
				style: text('Save\\nLayout', darkGreen),
				steps: step('saveLayout'),
				feedbacks: [],
			},
			{
				category: 'Select Layout',
				type: 'button',
				name: 'Reload Layout',
				style: text('Reload\\nLayout', darkGray),
				steps: step('reloadLayout'),
				feedbacks: [],
			}
		)

		// System (gateway supports /sys/restore)
		presets.push({
			category: 'System',
			type: 'button',
			name: 'Restore Factory Settings',
			style: text('Restore\\nFactory', red),
			steps: step('restore'),
			feedbacks: [],
		})

		// Output Resolution
		presets.push({
			category: 'Output Source',
			type: 'button',
			name: 'Set Output Resolution',
			style: text('Set\\nResolution', marine),
			steps: step('setResolution'),
			feedbacks: [],
		})

		// Video Output Interface
		presets.push(
			{
				category: 'Video Output',
				type: 'button',
				name: 'Set Video Interface Enable',
				style: text('Video\\nEnable', teal),
				steps: step('setVideoInterfaceEnable'),
				feedbacks: [],
			},
			{
				category: 'Video Output',
				type: 'button',
				name: 'Toggle Video Interface Enable',
				style: text('Video\\nToggle', darkGreen),
				steps: step('toggleVideoInterfaceEnable'),
				feedbacks: [],
			},
			{
				category: 'Video Output',
				type: 'button',
				name: 'Set Video Interface Mode',
				style: text('Video\\nMode', marine),
				steps: step('setVideoInterfaceMode'),
				feedbacks: [],
			},
			{
				category: 'Video Output',
				type: 'button',
				name: 'Set Video Interface Colorspace',
				style: text('Video\\nColor', darkGray),
				steps: step('setVideoInterfaceColorspace'),
				feedbacks: [],
			}
		)

		// Audio Output Interface
		presets.push(
			{
				category: 'Audio Output',
				type: 'button',
				name: 'Set Audio Interface Enable',
				style: text('Audio\\nEnable', teal),
				steps: step('setAudioInterfaceEnable'),
				feedbacks: [],
			},
			{
				category: 'Audio Output',
				type: 'button',
				name: 'Toggle Audio Interface Enable',
				style: text('Audio\\nToggle', darkGreen),
				steps: step('toggleAudioInterfaceEnable'),
				feedbacks: [],
			},
			{
				category: 'Audio Output',
				type: 'button',
				name: 'Set Audio Interface Mute',
				style: text('Audio\\nMute', red),
				steps: step('setAudioInterfaceMute'),
				feedbacks: [],
			},
			{
				category: 'Audio Output',
				type: 'button',
				name: 'Toggle Audio Interface Mute',
				style: text('Audio\\nToggle\\nMute', darkGreen),
				steps: step('toggleAudioInterfaceMute'),
				feedbacks: [],
			},
			{
				category: 'Audio Output',
				type: 'button',
				name: 'Set Audio Interface Volume',
				style: text('Audio\\nVolume', marine),
				steps: step('setAudioInterfaceVolume'),
				feedbacks: [],
			}
		)

		// Audiomix
		presets.push(
			{
				category: 'Audiomix',
				type: 'button',
				name: 'Set Audiomix Enable',
				style: text('Mix\\nEnable', teal),
				steps: step('setAudiomixEnable'),
				feedbacks: [],
			},
			{
				category: 'Audiomix',
				type: 'button',
				name: 'Set Audiomix Volume',
				style: text('Mix\\nVolume', marine),
				steps: step('setAudiomixVolume'),
				feedbacks: [],
			}
		)

		// Source Group (modify source stream)
		presets.push({
			category: 'Source Group',
			type: 'button',
			name: 'Modify Source Stream',
			style: text('Modify\\nStream', darkGray),
			steps: step('modifySourceStream'),
			feedbacks: [],
		})

		// NDI Discovery
		presets.push(
			{
				category: 'NDI',
				type: 'button',
				name: 'Add NDI Source',
				style: text('Add\\nNDI', teal),
				steps: step('addNdiSource'),
				feedbacks: [],
			},
			{
				category: 'NDI',
				type: 'button',
				name: 'NDI: Add Manual IP',
				style: text('NDI\\nManual IP', marine),
				steps: step('addNdiManualIp'),
				feedbacks: [],
			},
			{
				category: 'NDI',
				type: 'button',
				name: 'NDI: Add Discovery Server',
				style: text('NDI\\nDiscovery', marine),
				steps: step('addNdiDiscoveryServer'),
				feedbacks: [],
			}
		)

		// Border & Background
		presets.push(
			{
				category: 'Output Border',
				type: 'button',
				name: 'Set Output Border',
				style: text('Set\\nBorder', darkGray),
				steps: step('setBorder'),
				feedbacks: [],
			},
			{
				category: 'Output Background',
				type: 'button',
				name: 'Set Output Background',
				style: text('Set\\nBg', darkGray),
				steps: step('setBackground'),
				feedbacks: [],
			}
		)

		// Gateway Stream Management (new actions)
		presets.push(
			{
				category: 'Gateway Stream',
				type: 'button',
				name: 'Set Gateway Stream Enable',
				style: text('Stream\\nEnable', darkGreen),
				steps: step('setGatewayStreamEnable'),
				feedbacks: [],
			},
			{
				category: 'Gateway Stream',
				type: 'button',
				name: 'Update Gateway Stream',
				style: text('Update\\nStream', marine),
				steps: step('updateGatewayStream'),
				feedbacks: [],
			}
		)

		// Guide
		presets.push({
			category: 'System',
			type: 'button',
			name: 'Set Guide Status',
			style: text('Set\\nGuide', darkGray),
			steps: step('setGuideStatus'),
			feedbacks: [],
		})
	},
}
