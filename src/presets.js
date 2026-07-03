const { combineRgb } = require('@companion-module/base')

module.exports = {
	initPresets() {
		const self = this

		const presets = [
			// === General ===
			{
				category: 'General',
				type: 'button',
				name: 'Refresh Device Status',
				style: {
					text: 'Refresh',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 255),
				},
				steps: [{ down: [{ actionId: 'refreshStatus' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'General',
				type: 'button',
				name: 'Reboot Device',
				style: {
					text: 'Reboot',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(255, 0, 0),
				},
				steps: [{ down: [{ actionId: 'reboot' }], up: [] }],
				feedbacks: [],
			},

			// === Select Layout ===
			{
				category: 'Select Layout',
				type: 'button',
				name: 'Select Layout for Output',
				style: {
					text: 'Select Layout',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 128, 0),
				},
				steps: [{ down: [{ actionId: 'selectLayout' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Select Layout',
				type: 'button',
				name: 'Save Layout',
				style: {
					text: 'Save\\nLayout',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 255),
				},
				steps: [{ down: [{ actionId: 'saveLayout' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Select Layout',
				type: 'button',
				name: 'Reload Layout',
				style: {
					text: 'Reload\\nLayout',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(128, 128, 0),
				},
				steps: [{ down: [{ actionId: 'reloadLayout' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Select Layout',
				type: 'button',
				name: 'Select Layout and Assign Source',
				style: {
					text: 'Layout+\\nSource',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 100, 100),
				},
				steps: [{ down: [{ actionId: 'selectLayoutAndAssignSource' }], up: [] }],
				feedbacks: [],
			},

			// === Video Output ===
			{
				category: 'Video Output',
				type: 'button',
				name: 'Toggle Video Interface',
				style: {
					text: 'Toggle\\nVideo',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 128, 0),
				},
				steps: [{ down: [{ actionId: 'toggleVideoInterfaceEnable' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Video Output',
				type: 'button',
				name: 'Set Video Interface Enable',
				style: {
					text: 'Video\\nOn/Off',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 100, 0),
				},
				steps: [{ down: [{ actionId: 'setVideoInterfaceEnable' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Video Output',
				type: 'button',
				name: 'Set Video Interface Mode',
				style: {
					text: 'Video\\nMode',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 80, 160),
				},
				steps: [{ down: [{ actionId: 'setVideoInterfaceMode' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Video Output',
				type: 'button',
				name: 'Set Video Colorspace',
				style: {
					text: 'Video\\nColor',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(80, 80, 160),
				},
				steps: [{ down: [{ actionId: 'setVideoInterfaceColorspace' }], up: [] }],
				feedbacks: [],
			},

			// === Audio Output ===
			{
				category: 'Audio Output',
				type: 'button',
				name: 'Toggle Audio Interface',
				style: {
					text: 'Toggle\\nAudio',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 128, 0),
				},
				steps: [{ down: [{ actionId: 'toggleAudioInterfaceEnable' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Audio Output',
				type: 'button',
				name: 'Set Audio Interface Enable',
				style: {
					text: 'Audio\\nOn/Off',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 100, 0),
				},
				steps: [{ down: [{ actionId: 'setAudioInterfaceEnable' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Audio Output',
				type: 'button',
				name: 'Set Audio Mute',
				style: {
					text: 'Audio\\nMute',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(128, 128, 0),
				},
				steps: [{ down: [{ actionId: 'setAudioInterfaceMute' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Audio Output',
				type: 'button',
				name: 'Set Audio Volume',
				style: {
					text: 'Audio\\nVolume',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(64, 128, 128),
				},
				steps: [{ down: [{ actionId: 'setAudioInterfaceVolume' }], up: [] }],
				feedbacks: [],
			},

			// === Output Source ===
			{
				category: 'Output Source',
				type: 'button',
				name: 'Assign Source to Position',
				style: {
					text: 'Assign\\nSource',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 200),
				},
				steps: [{ down: [{ actionId: 'assignSource' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Output Source',
				type: 'button',
				name: 'Remove Source from Position',
				style: {
					text: 'Remove\\nSource',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(128, 0, 0),
				},
				steps: [{ down: [{ actionId: 'removeSource' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Output Source',
				type: 'button',
				name: 'Set Position Mute',
				style: {
					text: 'Pos\\nMute',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(100, 100, 100),
				},
				steps: [{ down: [{ actionId: 'setMute' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Output Source',
				type: 'button',
				name: 'Set Output Resolution',
				style: {
					text: 'Set\\nResolution',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 128),
				},
				steps: [{ down: [{ actionId: 'setResolution' }], up: [] }],
				feedbacks: [],
			},

			// === Source Group ===
			{
				category: 'Source Group',
				type: 'button',
				name: 'Refresh Source List',
				style: {
					text: 'Refresh\\nSources',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 255),
				},
				steps: [{ down: [{ actionId: 'refreshSources' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Add RTSP Source',
				style: {
					text: 'Add\\nRTSP',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(138, 43, 226),
				},
				steps: [
					{
						down: [
							{
								actionId: 'addSourceStream',
								options: {
									group_id: self.CHOICES_GROUPS[0]?.id || 'null',
									type: 'rtsp',
									name: '',
									url: 'rtsp://*.*.*.*/live/stream',
									user: '',
									password: '',
									trans_mode: 'tcp',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Add NDI Source',
				style: {
					text: 'Add\\nNDI',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 128, 128),
				},
				steps: [{ down: [{ actionId: 'addNdiSource' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Modify Source Stream',
				style: {
					text: 'Modify\\nStream',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(128, 128, 0),
				},
				steps: [{ down: [{ actionId: 'modifySourceStream' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Remove Source Stream',
				style: {
					text: 'Remove\\nStream',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(128, 0, 0),
				},
				steps: [{ down: [{ actionId: 'removeSourceStream' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Start Stream Playback',
				style: {
					text: 'Start\\nStream',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 128, 0),
				},
				steps: [{ down: [{ actionId: 'startStream' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'Stop Stream Playback',
				style: {
					text: 'Stop\\nStream',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(128, 128, 128),
				},
				steps: [{ down: [{ actionId: 'stopStream' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'NDI: Add Manual IP',
				style: {
					text: 'NDI\\nManual IP',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 100, 200),
				},
				steps: [{ down: [{ actionId: 'addNdiManualIp' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'Source Group',
				type: 'button',
				name: 'NDI: Add Discovery Server',
				style: {
					text: 'NDI\\nDiscovery',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 100, 200),
				},
				steps: [{ down: [{ actionId: 'addNdiDiscoveryServer' }], up: [] }],
				feedbacks: [],
			},

			// === PTZ ===
			{
				category: 'PTZ',
				type: 'button',
				name: 'Recall PTZ Preset',
				style: {
					text: 'PTZ\\nRecall',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [{ down: [{ actionId: 'ptzRecallPreset' }], up: [] }],
				feedbacks: [],
			},
			{
				category: 'PTZ',
				type: 'button',
				name: 'Store PTZ Preset',
				style: {
					text: 'PTZ\\nStore',
					size: '14',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(64, 64, 64),
				},
				steps: [{ down: [{ actionId: 'ptzStorePreset' }], up: [] }],
				feedbacks: [],
			},
		]

		self.setPresetDefinitions(presets)
	},
}
