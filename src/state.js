function createInitialState() {
	return {
		// 通用设备信息
		device_name: '',
		firmware_version: '',
		hardware_version: '',
		serial_number: '',
		software_version: '',
		alias: '',
		ip: '',

		// decoder 区
		outputs: [],
		output_details: {},
		layouts: [],
		resolutions: [],
		preview: [],
		audiomix: {},
		video_interfaces: {},
		audio_interfaces: {},

		// gateway 区
		output_name: '',
		output_resolution: '',
		mute_status: '0',
		background_type: '',
		guide_status: '',
		cpu_usage: '',
		uptime: '',
		mem_used: '',
		mem_total: '',
		groups: [],
		gateway_streams: [],
		preview_sources: [],
		sources_count: 0,
		layouts_count: 0,
		gateway_streams_count: 0,
		group_list: '',
		layout_list: '',
		gateway_stream_list: '',

		// 共用源区
		sources: [],
		source_groups: [],
	}
}

const INITIAL_CHOICES = {
	CHOICES_OUTPUTS: [{ id: '1', label: 'Output 1' }],
	CHOICES_POSITIONS: [{ id: '1', label: 'Position 1' }],
	CHOICES_POSITIONS_BY_OUTPUT: {},
	CHOICES_OUTPUT_POSITIONS: [{ id: '1:1', label: 'Output 1 - Position 1' }],
	CHOICES_STREAMS_BY_GROUP: {},
	CHOICES_OUTPUT_LAYOUTS: [{ id: '1:1', label: 'Output 1 - Single' }],
	CHOICES_LAYOUTS: [{ id: '1', label: 'Single' }],
	CHOICES_STREAMS: [{ id: 'null', label: '- No streams available -' }],
	CHOICES_GROUPS: [{ id: 'null', label: '- No groups available -' }],
	CHOICES_RESOLUTIONS: [{ id: '5', label: '1920x1080P60' }],
	CHOICES_PREVIEW_SLOTS: [
		{ id: '', label: 'Auto (append)' },
		{ id: '1', label: 'Preview 1' },
	],
	CHOICES_OUTPUT_VIDEO_INTERFACES: [{ id: '1:1', label: 'Output 1 - HDMI 1' }],
	CHOICES_OUTPUT_AUDIO_INTERFACES: [{ id: '1:1', label: 'Output 1 - HDMI 1' }],
	CHOICES_GATEWAY_STREAMS: [{ id: 'null', label: '- No gateway streams available -' }],
	CHOICES_GATEWAY_STREAMINGS: [{ id: 'null', label: '- No active push streams -' }],
	CHOICES_MULTI_OUT: [
		{ id: '1', label: 'Output 1 (Active)', enable: true },
		{ id: '2', label: 'Output 2', enable: false },
	],
}

module.exports = {
	createInitialState,
	INITIAL_CHOICES,

	resetState() {
		this.STATE = createInitialState()
	},

	resetChoices() {
		Object.assign(this, INITIAL_CHOICES)
	},
}
