const ERR_USER_TOKEN_INVALID = '2'

const POLLINGRATE = 1000
const POLLINGRATE_SOURCES = 10000
const RECONNECT_TIME = 30000
const REQUEST_TIMEOUT = 5000

const STREAM_STATUS_LABELS = {
	0: 'Not Connected',
	1: 'Connecting',
	2: 'Connected',
	3: 'Failed',
	4: 'Performance Limited',
}

const CHOICES_SOURCE_TYPES = [
	{ id: 'rtsp', label: 'RTSP' },
	{ id: 'rtmp', label: 'RTMP' },
	{ id: 'rtmps', label: 'RTMPS' },
	{ id: 'http', label: 'HTTP' },
	{ id: 'https', label: 'HTTPS' },
	{ id: 'udp', label: 'UDP' },
]

const CHOICES_VIDEO_INTERFACES = [
	{ id: '1', label: 'HDMI 1' },
	{ id: '2', label: 'HDMI 2' },
	{ id: '3', label: 'SDI' },
]

const CHOICES_AUDIO_INTERFACES = [
	{ id: '1', label: 'HDMI 1' },
	{ id: '2', label: 'HDMI 2' },
	{ id: '3', label: 'SDI' },
	{ id: '4', label: 'Line Out' },
]

const CHOICES_VIDEO_INTERFACE_MODES = [
	{ id: 'HDMI', label: 'HDMI' },
	{ id: 'DVI', label: 'DVI' },
]

const CHOICES_VIDEO_COLORSPACES = [
	{ id: 'RGB444', label: 'RGB444' },
	{ id: 'YCBCR444', label: 'YCBCR444' },
	{ id: 'YCBCR422', label: 'YCBCR422' },
	{ id: 'YCBCR420', label: 'YCBCR420' },
]

const CHOICES_PTZ_PRESETS = Array.from({ length: 100 }, (_, i) => ({
	id: String(i),
	label: `Preset ${i}`,
}))

const CHOICES_AUDIOMIX_TYPES = [
	{ id: 'output', label: 'Output Mix' },
	{ id: 'preview', label: 'Preview Mix' },
]

const CHOICES_BACKGROUND_TYPE = [
	{ id: 'black', label: 'Black' },
	{ id: 'image', label: 'Image' },
	{ id: 'color', label: 'Color' },
]

const CHOICES_MUTE = [
	{ id: '0', label: 'Unmute' },
	{ id: '1', label: 'Mute' },
]

const CHOICES_GUIDE_STATUS = [
	{ id: 'on', label: 'On' },
	{ id: 'off', label: 'Off' },
]

const CHOICES_MULTI_OUT = [
	{ id: '1', label: 'Output 1', enable: true },
	{ id: '2', label: 'Output 2', enable: false },
]

const CHOICES_GATEWAY_PROTOCOLS = [
	{ id: 'rtmp', label: 'RTMP' },
	{ id: 'srt', label: 'SRT' },
	{ id: 'rtsp', label: 'RTSP' },
	{ id: 'ndi_hx', label: 'NDI HX' },
	{ id: 'hls', label: 'HLS' },
	{ id: 'ts', label: 'TS' },
	{ id: 'rtp', label: 'RTP' },
]

const CHOICES_DECODE_PROTOCOLS = [
	{ id: 'rtmp', label: 'RTMP' },
	{ id: 'rtsp', label: 'RTSP' },
	{ id: 'udp', label: 'UDP' },
	{ id: 'srt', label: 'SRT' },
	{ id: 'http', label: 'HLS' },
	{ id: 'zixi', label: 'Zixi' },
	{ id: 'rtp', label: 'RTP' },
]

module.exports = {
	ERR_USER_TOKEN_INVALID,
	POLLINGRATE,
	POLLINGRATE_SOURCES,
	RECONNECT_TIME,
	REQUEST_TIMEOUT,
	STREAM_STATUS_LABELS,
	CHOICES_SOURCE_TYPES,
	CHOICES_VIDEO_INTERFACES,
	CHOICES_AUDIO_INTERFACES,
	CHOICES_VIDEO_INTERFACE_MODES,
	CHOICES_VIDEO_COLORSPACES,
	CHOICES_PTZ_PRESETS,
	CHOICES_AUDIOMIX_TYPES,
	CHOICES_BACKGROUND_TYPE,
	CHOICES_MUTE,
	CHOICES_GUIDE_STATUS,
	CHOICES_MULTI_OUT,
	CHOICES_GATEWAY_PROTOCOLS,
	CHOICES_DECODE_PROTOCOLS,
}
