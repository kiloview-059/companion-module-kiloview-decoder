/**
 * Decoder profile: auth headers and route table for D350/D260/RD350/RD260.
 *
 * Per D350 API doc (decoder-hi3536, feature/feature_dxx branch):
 * - Auth: app header = JSON string {"user","token","language":"en"}
 * - Token invalid code: msg === '2'
 * - /source/groups/list: POST (body {is_need_stream: true})
 * - /output/interfaces/get: POST (body)
 */
const decoderProfile = {
	type: 'decoder',
	defaultPort: 80,
	protocols: ['http'],
	timeoutMs: 5000,

	/**
	 * Build the `app` header. The device frontend stores the full login
	 * response data and sends it as the `app` header on every request,
	 * plus language and software fields.
	 *
	 * `alias` (user display name) may contain non-ASCII chars (e.g.
	 * "超级管理员"); HTTP headers are latin1-only, so we keep it but
	 * escape non-ASCII as \uXXXX. The device's JSON.parse restores the
	 * original string. Stripping alias entirely breaks /layout/select on
	 * D350 firmware — see TEST_CHECKLIST.md.
	 */
	buildAuthHeaders(session) {
		const loginData = session?.loginData || {}
		const appJson = JSON.stringify({ ...loginData, language: 'en', software: '' })
		return { app: appJson.replace(/[^\x20-\x7E]/g, (ch) => {
			return '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')
		}) }
	},

	routes: {
		// User
		login: { method: 'POST', path: '/users/login', paramMode: 'body' },
		logout: { method: 'POST', path: '/users/logout', paramMode: 'body' },
		sessionCheck: { method: 'GET', path: '/users/session/check', paramMode: 'query' },

		// Info / maintenance
		getInfo: { method: 'GET', path: '/info/get', paramMode: 'query' },
		getUsage: { method: 'GET', path: '/maintenance/usage_get', paramMode: 'query' },
		getRebootStatus: { method: 'GET', path: '/maintenance/reboot/get', paramMode: 'query' },
		setReboot: { method: 'POST', path: '/maintenance/reboot/set', paramMode: 'body' },

		// System
		reboot: { method: 'GET', path: '/sys/reboot', paramMode: 'query' },
		reset: { method: 'GET', path: '/sys/reset', paramMode: 'query' },
		restore: { method: 'GET', path: '/sys/restore', paramMode: 'query' },
		getDeviceName: { method: 'GET', path: '/sys/device/get', paramMode: 'query' },
		setDeviceName: { method: 'POST', path: '/sys/device/set', paramMode: 'body' },

		// Output
		getOutputList: { method: 'GET', path: '/output/list', paramMode: 'query' },
		getOutput: { method: 'GET', path: '/output/get', paramMode: 'query' },
		getResolutionList: { method: 'GET', path: '/output/resolution/list', paramMode: 'query' },
		setResolution: { method: 'POST', path: '/output/resolution/set', paramMode: 'body' },
		setSource: { method: 'POST', path: '/output/source/set', paramMode: 'body' },
		removeSource: { method: 'POST', path: '/output/source/remove', paramMode: 'body' },
		setMute: { method: 'POST', path: '/output/mute/set', paramMode: 'body' },
		setVumeter: { method: 'POST', path: '/output/vumeter/set', paramMode: 'body' },
		getOutputInterfaces: { method: 'GET', path: '/output/interfaces/get', paramMode: 'query' },
		setOutputInterfaces: { method: 'POST', path: '/output/interfaces/set', paramMode: 'body' },
		getAudiomix: { method: 'GET', path: '/output/audiomix/get', paramMode: 'query' },
		setAudiomix: { method: 'POST', path: '/output/audiomix/set', paramMode: 'body' },
		addAudiomix: { method: 'POST', path: '/output/audiomix/add', paramMode: 'body' },
		removeAudiomix: { method: 'POST', path: '/output/audiomix/remove', paramMode: 'body' },
		getBorder: { method: 'POST', path: '/output/border/get', paramMode: 'body' },
		setBorder: { method: 'POST', path: '/output/border/set', paramMode: 'body' },
		getBackground: { method: 'GET', path: '/output/background/get', paramMode: 'query' },
		setBackground: { method: 'POST', path: '/output/background/set', paramMode: 'body' },

		// Layout
		getLayoutList: { method: 'GET', path: '/layout/list', paramMode: 'query' },
		getLayoutTemplateList: { method: 'GET', path: '/layout/template/list', paramMode: 'query' },
		selectLayout: { method: 'POST', path: '/layout/select', paramMode: 'body' },
		modifyLayout: { method: 'POST', path: '/layout/modify', paramMode: 'body' },
		saveLayout: { method: 'POST', path: '/layout/save', paramMode: 'body' },
		reloadLayout: { method: 'POST', path: '/layout/reload', paramMode: 'body' },

	// Source
		getSourceGroups: { method: 'GET', path: '/source/groups/list', paramMode: 'query' },
		addSourceGroup: { method: 'POST', path: '/source/groups/add', paramMode: 'body' },
		removeSourceGroup: { method: 'POST', path: '/source/groups/remove', paramMode: 'body' },
		addSourceStream: { method: 'POST', path: '/source/groups/streams/add', paramMode: 'body' },
		modifySourceStream: { method: 'POST', path: '/source/groups/streams/modify', paramMode: 'body' },
		removeSourceStream: { method: 'POST', path: '/source/groups/streams/remove', paramMode: 'body' },
		startPlay: { method: 'POST', path: '/source/streams/startPlay', paramMode: 'body' },
		stopPlay: { method: 'POST', path: '/source/streams/stopPlay', paramMode: 'body' },

		// NDI Discovery
		getNdiDiscoveryAll: { method: 'GET', path: '/ndi/discovery/all', paramMode: 'query' },
		getNdiDiscoverySources: { method: 'GET', path: '/ndi/discovery/sources', paramMode: 'query' },
		setNdiManualList: { method: 'POST', path: '/ndi/discovery/manual/add', paramMode: 'body' },
		addNdiDiscoveryServer: { method: 'POST', path: '/ndi/discovery/server/add', paramMode: 'body' },

		// Preview
		getPreviewList: { method: 'GET', path: '/preview/get', paramMode: 'query' },
		modifyPreviewSource: { method: 'POST', path: '/preview/source/modify', paramMode: 'body' },
		removePreviewSource: { method: 'POST', path: '/preview/source/remove', paramMode: 'body' },

		// PTZ
		ptzControl: { method: 'POST', path: '/ptz/set', paramMode: 'body' },

		// Network
		getNetwork: { method: 'GET', path: '/network/get', paramMode: 'query' },
		pingNetwork: { method: 'POST', path: '/network/ping', paramMode: 'body' },

		// Report
		getReportCodecInfo: { method: 'GET', path: '/report/codec_info', paramMode: 'query' },
		getReportSystemInfo: { method: 'GET', path: '/report/system_info', paramMode: 'query' },
	},
}

module.exports = decoderProfile
