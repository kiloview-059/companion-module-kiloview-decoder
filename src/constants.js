module.exports = {
	POLLINGRATE: 1000,
	POLLINGRATE_SOURCES: 10000,
	RECONNECT_TIME: 30000,
	DEVICE: undefined,

	CHOICES_OUTPUTS: [{ id: '1', label: 'Output 1' }],
	CHOICES_POSITIONS: [{ id: 1, label: 'Position 1' }],
	CHOICES_LAYOUTS: [{ id: 1, label: 'Single' }],
	CHOICES_STREAMS: [{ id: 'null', label: '- No streams available -' }],
	CHOICES_RESOLUTIONS: [{ id: '1', label: '1920x1080P60' }],
	CHOICES_PREVIEW_SLOTS: [{ id: 1, label: 'Preview 1' }],
	CHOICES_PTZ_PRESETS: Array.from({ length: 100 }, (_, i) => ({
		id: String(i),
		label: `Preset ${i}`,
	})),

	CHOICES_AUDIOMIX_TYPES: [
		{ id: 'output', label: 'Output Mix' },
		{ id: 'preview', label: 'Preview Mix' },
	],

	STREAM_STATUS_LABELS: {
		0: 'Not Connected',
		1: 'Connecting',
		2: 'Connected',
		3: 'Failed',
		4: 'Performance Limited',
	},

	STATE: {
		device_name: '',
		firmware_version: '',
		hardware_version: '',
		serial_number: '',
		software_version: '',
		outputs: [],
		layouts: [],
		sources: [],
		preview: [],
		audiomix: {},
	},

	INTERVAL: null,
	INTERVAL_SOURCES: null,
	RECONNECT_INTERVAL: null,
}
