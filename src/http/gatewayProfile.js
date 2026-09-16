/**
 * Gateway profile: auth headers and route table for MG300V2/RMG300V2.
 *
 * Per MG300V2 API doc (firmware 2.20.0132, feature/feature_fmg300-perm branch):
 * - Auth: app header = JSON string {"token":"xxx"} (fixes MG bug of sending bare token)
 * - Token invalid code: msg === '2' (fixes MG bug of checking '301')
 * - /source/groups/list: GET (per MG doc; D doc says POST — configured per-profile)
 * - /output/get: GET + query output_id (fixes MG bug of POST without output_id)
 * - /gate/stream/multi_out_query: GET (fixes MG POST)
 */
const gatewayProfile = {
	type: 'gateway',
	defaultPort: 99,
	protocols: ['http', 'https'],
	timeoutMs: 5000,

	/**
	 * Same as decoder: full login data in the `app` header. `alias`
	 * (display name, possibly non-ASCII) is stripped — see decoderProfile.
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
		sessionCheck: { method: 'POST', path: '/users/session/check', paramMode: 'body' },

		// Info / maintenance
		getInfo: { method: 'GET', path: '/info/get', paramMode: 'query' },
		getUsage: { method: 'GET', path: '/maintenance/usage_get', paramMode: 'query' },
		getRebootStatus: { method: 'GET', path: '/maintenance/reboot/get', paramMode: 'query' },
		setReboot: { method: 'POST', path: '/maintenance/reboot/set', paramMode: 'body' },
		getScreenSettings: { method: 'GET', path: '/maintenance/screen/settings', paramMode: 'query' },
		setScreen: { method: 'POST', path: '/maintenance/screen/set', paramMode: 'body' },

		// System
		reboot: { method: 'GET', path: '/sys/reboot', paramMode: 'query' },
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
		setVumeter: { method: 'POST', path: '/output/vumeter/set', paramMode: 'body' },
		setMute: { method: 'POST', path: '/output/mute/set', paramMode: 'body' },
		getOutputInterfaces: { method: 'GET', path: '/output/interfaces/get', paramMode: 'query' },
		setOutputInterfaces: { method: 'POST', path: '/output/interfaces/set', paramMode: 'body' },
		getAudiomix: { method: 'GET', path: '/output/audiomix/get', paramMode: 'query' },
		setAudiomix: { method: 'POST', path: '/output/audiomix/set', paramMode: 'body' },
		addAudiomix: { method: 'POST', path: '/output/audiomix/add', paramMode: 'body' },
		removeAudiomix: { method: 'POST', path: '/output/audiomix/remove', paramMode: 'body' },
		ptzControl: { method: 'POST', path: '/ptz/set', paramMode: 'body' },
		getAudioSound: { method: 'GET', path: '/output/audio/sound', paramMode: 'query' },
		audioCheck: { method: 'POST', path: '/output/audio/check', paramMode: 'body' },
		getTsProgram: { method: 'GET', path: '/output/ts/program/get', paramMode: 'query' },
		setTsProgram: { method: 'POST', path: '/output/ts/program/set', paramMode: 'body' },
		getOutputEncode: { method: 'GET', path: '/output/encode/get', paramMode: 'query' },
		setOutputEncode: { method: 'POST', path: '/output/encode/set', paramMode: 'body' },
		getBorder: { method: 'GET', path: '/output/border/get', paramMode: 'query' },
		setBorder: { method: 'POST', path: '/output/border/set', paramMode: 'body' },
		getBackground: { method: 'GET', path: '/output/background/get', paramMode: 'query' },
		setBackground: { method: 'POST', path: '/output/background/set', paramMode: 'body' },

		// Layout
		getLayoutList: { method: 'GET', path: '/layout/list', paramMode: 'query' },
		selectLayout: { method: 'POST', path: '/layout/select', paramMode: 'body' },
		getTemplateList: { method: 'GET', path: '/layout/template/list', paramMode: 'query' },
		modifyLayout: { method: 'POST', path: '/layout/modify', paramMode: 'body' },
		saveLayout: { method: 'POST', path: '/layout/save', paramMode: 'body' },
		reloadLayout: { method: 'POST', path: '/layout/reload', paramMode: 'body' },
		addLayout: { method: 'POST', path: '/layout/add', paramMode: 'body' },
		removeLayout: { method: 'POST', path: '/layout/remove', paramMode: 'body' },
		resaveLayout: { method: 'POST', path: '/layout/resave', paramMode: 'body' },
		renameLayout: { method: 'POST', path: '/layout/rename', paramMode: 'body' },

		// Source (MG doc: GET for /source/groups/list)
		getSourceGroups: { method: 'GET', path: '/source/groups/list', paramMode: 'query' },
		addSourceGroup: { method: 'POST', path: '/source/groups/add', paramMode: 'body' },
		removeSourceGroup: { method: 'POST', path: '/source/groups/remove', paramMode: 'body' },
		addSourceStream: { method: 'POST', path: '/source/groups/streams/add', paramMode: 'body' },
		modifySourceStream: { method: 'POST', path: '/source/groups/streams/modify', paramMode: 'body' },
		removeSourceStream: { method: 'POST', path: '/source/groups/streams/remove', paramMode: 'body' },

		// NDI Discovery
		getNdiDiscoveryAll: { method: 'GET', path: '/ndi/discovery/all', paramMode: 'query' },
		setNdiManualList: { method: 'POST', path: '/ndi/discovery/manual/add', paramMode: 'body' },
		addNdiDiscoveryServer: { method: 'POST', path: '/ndi/discovery/server/add', paramMode: 'body' },

		// Preview
		getPreviewList: { method: 'GET', path: '/preview/get', paramMode: 'query' },
		modifyPreviewSource: { method: 'POST', path: '/preview/source/modify', paramMode: 'body' },
		removePreviewSource: { method: 'POST', path: '/preview/source/remove', paramMode: 'body' },

		// Network
		getNetwork: { method: 'GET', path: '/network/get', paramMode: 'query' },

		// Gateway (gate)
		getGatewayStreamList: { method: 'GET', path: '/gate/stream/list', paramMode: 'query' },
		addGatewayStream: { method: 'POST', path: '/gate/stream/add', paramMode: 'body' },
		deleteGatewayStream: { method: 'POST', path: '/gate/stream/delete', paramMode: 'body' },
		updateGatewayStream: { method: 'POST', path: '/gate/stream/update', paramMode: 'body' },
		batchEnableGatewayStream: { method: 'POST', path: '/gate/stream/batch_enable', paramMode: 'body' },
		bindSrcGateway: { method: 'POST', path: '/gate/stream/bind_src', paramMode: 'body' },
		multiOutQuery: { method: 'GET', path: '/gate/stream/multi_out_query', paramMode: 'query' },
		multiOutSwitch: { method: 'POST', path: '/gate/stream/multi_out_enable', paramMode: 'body' },

		// Guide (experimental — endpoint may not exist per doc)
		getGuideStatus: { method: 'GET', path: '/guide/get', paramMode: 'query' },
		setGuideStatus: { method: 'POST', path: '/guide/set', paramMode: 'body' },

		// Report
		getReportSystemInfo: { method: 'GET', path: '/report/system_info', paramMode: 'query' },
	},
}

module.exports = gatewayProfile
