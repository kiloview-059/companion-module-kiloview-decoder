/**
 * Kiloview Dxx decoder HTTP API client.
 *
 * Routes and HTTP methods mirror decoder-hi3536:
 *   multiview/src/interface/RegistHttpsRoute.cpp
 *   multiview/res/static/js/app.js (api section)
 *
 * Base URL: http://<host>:<port>/api  (default port 80)
 */
const http = require('http')
const https = require('https')

/** ERR_USER_TOKEN_INVALID from interface_common.h */
const ERR_USER_TOKEN_INVALID = '2'

class KiloviewDecoder {
	constructor(owner, ip, username, password, protocol = 'http', port = 80, timeout = 5000) {
		this.owner = owner
		this.connection_info = { ip, username, password, protocol, port }
		this.baseURL = `${protocol}://${ip}:${port}/api`
		this.timeout = timeout

		const agentOpts = {
			keepAlive: true,
			keepAliveMsecs: 30000,
			maxSockets: 5,
		}

		this.httpAgent = new http.Agent(agentOpts)
		this.httpsAgent = new https.Agent({
			...agentOpts,
			rejectUnauthorized: false,
		})

		this.session = { token: '' }
		this.authorized = false
		this.alias = username
	}

	log(level, message) {
		this.owner.log(level, message)
	}

	_isAuthError(result) {
		return result?.result === 'error' && String(result.msg) === ERR_USER_TOKEN_INVALID
	}

	_getAppHeader() {
		// Same fields as decoder web store.state.loginInfo (UsersManager + getToken)
		return JSON.stringify({
			user: this.connection_info.username,
			token: this.session.token,
			language: 'en',
		})
	}

	_request(method, path, data) {
		return new Promise((resolve, reject) => {
			const isHttps = this.connection_info.protocol === 'https'
			const urlObj = new URL(`${this.baseURL}${path}`)
			const options = {
				hostname: urlObj.hostname,
				port: urlObj.port || (isHttps ? 443 : 80),
				path: urlObj.pathname + urlObj.search,
				method,
				rejectUnauthorized: false,
				agent: isHttps ? this.httpsAgent : this.httpAgent,
				timeout: this.timeout,
				headers: {
					'Content-Type': 'application/json',
					Connection: 'keep-alive',
					Authorization: `${this.session.token}`,
					app: this._getAppHeader(),
				},
			}

			const req = (isHttps ? https : http).request(options, (res) => {
				let body = ''
				res.on('data', (chunk) => {
					body += chunk
				})
				res.on('end', () => {
					try {
						resolve(JSON.parse(body))
					} catch (e) {
						resolve(body)
					}
				})
			})

			req.on('error', (err) => {
				const error = new Error(err.message)
				error.name = 'KiloviewDecoderError'
				reject(error)
			})

			req.on('timeout', () => {
				req.destroy()
				const error = new Error('Request timed out')
				error.name = 'KiloviewDecoderError'
				reject(error)
			})

			req.setTimeout(this.timeout, () => {
				req.destroy()
			})

			if (data !== undefined && (method === 'POST' || method === 'PUT')) {
				req.write(JSON.stringify(data))
			}

			req.end()
		})
	}

	async authorize() {
		try {
			const { username, password } = this.connection_info
			const result = await this._request('POST', '/users/login', { username, password })

			if (!result || result.result !== 'ok' || !result.data?.token) {
				const error = new Error(result?.msg || 'Authorization failed')
				error.name = 'KiloviewDecoderError'
				throw error
			}

			this.session.token = result.data.token
			this.alias = result.data.alias || username
			this.authorized = true
			return true
		} catch (error) {
			if (error.name !== 'KiloviewDecoderError') {
				const newError = new Error('Could not reach device')
				newError.name = 'KiloviewDecoderError'
				throw newError
			}
			throw error
		}
	}

	async _call(method, path, data, query = {}) {
		if (!this.authorized) {
			await this.authorize()
		}

		const queryString = new URLSearchParams(query).toString()
		const fullPath = path + (queryString ? '?' + queryString : '')

		let result
		if (method === 'GET') {
			result = await this._request('GET', fullPath)
		} else {
			result = await this._request('POST', fullPath, data ?? {})
		}

		if (this._isAuthError(result)) {
			this.authorized = false
			await this.authorize()
			return this._call(method, path, data, query)
		}

		if (result && result.result === 'error') {
			const error = new Error(result.msg || 'API Error')
			error.name = 'KiloviewDecoderError'
			error.code = result.msg
			throw error
		}

		return result
	}

	async get(path, query = {}) {
		return this._call('GET', path, undefined, query)
	}

	async post(path, data = {}) {
		return this._call('POST', path, data)
	}

	// ── User (RegistHttpsRoute::createUserRouters) ──────────────────────────

	async login(username, password) {
		return this.post('/users/login', { username, password })
	}

	async logout() {
		return this.post('/users/logout')
	}

	async checkSession() {
		return this.get('/users/session/check')
	}

	async checkAuth() {
		return this.get('/auth/check')
	}

	// ── Info / maintenance ─────────────────────────────────────────────────

	async getInfo() {
		return this.get('/info/get')
	}

	async getMaintenanceUsage() {
		return this.get('/maintenance/usage_get')
	}

	async getMaintenanceReboot() {
		return this.get('/maintenance/reboot/get')
	}

	async setMaintenanceReboot(params) {
		return this.post('/maintenance/reboot/set', params)
	}

	// ── System (RegistHttpsRoute::createSystemRouters) ───────────────────────

	async reboot() {
		return this.get('/sys/reboot')
	}

	async reset() {
		return this.get('/sys/reset')
	}

	async restore() {
		return this.get('/sys/restore')
	}

	async getDeviceName() {
		return this.get('/sys/device/get')
	}

	async setDeviceName(params) {
		return this.post('/sys/device/set', params)
	}

	// ── Output (RegistHttpsRoute::createOutputRouters) ───────────────────────

	async getOutputList() {
		return this.get('/output/list')
	}

	async getOutput(outputId) {
		return this.get('/output/get', { output_id: String(outputId) })
	}

	async getResolutionList() {
		return this.get('/output/resolution/list')
	}

	async setResolution(outputId, resId) {
		return this.post('/output/resolution/set', {
			output_id: String(outputId),
			res_id: String(resId),
		})
	}

	async setSource(params) {
		return this.post('/output/source/set', params)
	}

	async removeSource(outputId, posId) {
		return this.post('/output/source/remove', {
			output_id: String(outputId),
			pos_id: parseInt(posId),
		})
	}

	async setMute(outputId, posId, mute) {
		return this.post('/output/mute/set', {
			output_id: String(outputId),
			pos_id: parseInt(posId),
			mute: !!mute,
		})
	}

	async setVumeter(params) {
		return this.post('/output/vumeter/set', params)
	}

	async getOutputInterfaces(outputId, type = 'video') {
		return this.get('/output/interfaces/get', {
			output_id: String(outputId),
			type,
		})
	}

	async getVideoInterfaces(outputId) {
		return this.getOutputInterfaces(outputId, 'video')
	}

	async getAudioInterfaces(outputId) {
		return this.getOutputInterfaces(outputId, 'audio')
	}

	async setVideoInterface(outputId, intfId, changes) {
		const response = await this.getVideoInterfaces(outputId)
		const intf = (response?.data || []).find((i) => String(i.id) === String(intfId))
		if (!intf) {
			const error = new Error(`Video interface ${intfId} not found on output ${outputId}`)
			error.name = 'KiloviewDecoderError'
			throw error
		}
		return this.post('/output/interfaces/set', {
			...intf,
			output_id: String(outputId),
			type: 'video',
			intf_id: parseInt(intfId),
			...changes,
		})
	}

	async setAudioInterface(outputId, intfId, changes) {
		const response = await this.getAudioInterfaces(outputId)
		const intf = (response?.data || []).find((i) => String(i.id) === String(intfId))
		if (!intf) {
			const error = new Error(`Audio interface ${intfId} not found on output ${outputId}`)
			error.name = 'KiloviewDecoderError'
			throw error
		}
		return this.post('/output/interfaces/set', {
			...intf,
			output_id: String(outputId),
			type: 'audio',
			intf_id: parseInt(intfId),
			...changes,
		})
	}

	async setOutputInterfaces(params) {
		return this.post('/output/interfaces/set', params)
	}

	async getAudiomix(outputId) {
		return this.get('/output/audiomix/get', { output_id: String(outputId) })
	}

	async setAudiomix(params) {
		return this.post('/output/audiomix/set', {
			type: 'output',
			mute: false,
			volume: 0,
			enable: true,
			...params,
			output_id: String(params.output_id),
		})
	}

	async removePreview(posId) {
		return this.post('/preview/source/remove', { pos_id: parseInt(posId) })
	}

	async getBorder(params) {
		return this.post('/output/border/get', params)
	}

	async setBorder(params) {
		return this.post('/output/border/set', params)
	}

	async getBackground(outputId) {
		return this.get('/output/background/get', { output_id: String(outputId) })
	}

	async setBackground(params) {
		return this.post('/output/background/set', params)
	}

	// ── Layout (RegistHttpsRoute::createLayoutRouters) ───────────────────────

	async getLayoutList() {
		return this.get('/layout/list')
	}

	async getLayoutTemplateList() {
		return this.get('/layout/template/list')
	}

	async selectLayout(outputId, layoutId) {
		return this.post('/layout/select', {
			output_id: String(outputId),
			layout_id: parseInt(layoutId),
		})
	}

	async modifyLayout(params) {
		return this.post('/layout/modify', params)
	}

	async saveLayout(outputId, layoutId) {
		return this.post('/layout/save', {
			output_id: String(outputId),
			layout_id: parseInt(layoutId),
		})
	}

	async reloadLayout(outputId, layoutId) {
		return this.post('/layout/reload', {
			output_id: parseInt(outputId),
			layout_id: parseInt(layoutId),
		})
	}

	// ── Source (RegistHttpsRoute::createSourceRouters) ───────────────────────

	async getSourceGroups() {
		// Web UI: GET source/groups/list (is_need_stream defaults true in C++)
		return this.get('/source/groups/list')
	}

	async refreshSources() {
		return this.get('/source/refresh')
	}

	async startPlay(streamId) {
		return this.post('/source/streams/startPlay', { stream_id: streamId })
	}

	async stopPlay(streamId) {
		return this.post('/source/streams/stopPlay', { stream_id: streamId })
	}

	async addSourceStream(params) {
		return this.post('/source/groups/streams/add', params)
	}

	async modifySourceStream(params) {
		return this.post('/source/groups/streams/modify', params)
	}

	async removeSourceStream(params) {
		return this.post('/source/groups/streams/remove', params)
	}

	buildAddStreamParams(groupId, options) {
		const { type, name, url, user, password, trans_mode } = options
		const params = {
			group_id: String(groupId),
			name,
			type,
			url,
			buffer: 'live:0:0:0:0:0',
			connect_speed: 5000,
			audio_sync_compst: 0,
			user: user || '',
			password: password || '',
		}
		if (type === 'rtsp') {
			params.trans_mode = trans_mode || 'tcp'
		}
		return params
	}

	buildAddNdiStreamParams(groupId, options) {
		const { ndi_name, url, channel, group_name } = options
		const [ip, portStr] = String(url || '').split(':')
		return {
			group_id: String(groupId),
			type: 'ndi',
			data: [
				{
					name: ndi_name,
					ndi_name,
					url,
					ip: ip || url,
					port: parseInt(portStr) || 5965,
					channel: channel || 'HB',
					group_name: group_name || 'public',
					connect_speed: 5000,
					audio_sync_compst: 0,
				},
			],
		}
	}

	buildModifyStreamParams(existingStream, overrides = {}) {
		if (!existingStream?.id) {
			throw new Error('Stream not found in cached source list')
		}

		const params = { ...existingStream.raw, stream_id: existingStream.id }
		delete params.id
		delete params.status

		if (overrides.name) {
			params.name = overrides.name
		}
		if (overrides.url) {
			params.url = overrides.url
		}
		if (overrides.user !== undefined && overrides.user !== '') {
			params.user = overrides.user
		}
		if (overrides.password !== undefined && overrides.password !== '') {
			params.password = overrides.password
		}
		if (params.type === 'rtsp' && overrides.trans_mode) {
			params.trans_mode = overrides.trans_mode
		}

		return params
	}

	// ── NDI Discovery (RegistHttpsRoute::createNdiDiscoveryRouters) ──────────

	async getNdiDiscoveryAll() {
		return this.get('/ndi/discovery/all')
	}

	async getNdiDiscoverySources(params) {
		return this.get('/ndi/discovery/sources', params)
	}

	async setNdiManualList(manuals) {
		return this.post('/ndi/discovery/manual/add', { manuals })
	}

	async addNdiManualIp(ip, group = 'public') {
		const current = await this.getNdiDiscoveryAll()
		const manuals = Array.isArray(current?.data?.manual) ? [...current.data.manual] : []
		const entry = { dis_d_ip: ip, dis_g_name: group }
		const exists = manuals.some((m) => m.dis_d_ip === ip && m.dis_g_name === group)
		if (!exists) {
			manuals.push(entry)
		}
		return this.setNdiManualList(
			manuals.map((m) => ({ dis_d_ip: m.dis_d_ip, dis_g_name: m.dis_g_name }))
		)
	}

	async addNdiDiscoveryServer(serverIp, group = 'public') {
		return this.post('/ndi/discovery/server/add', {
			dis_s_ip: serverIp,
			dis_g_name: group,
		})
	}

	// ── Preview (RegistHttpsRoute::createPreviewRouters) ─────────────────────

	async getPreviewList() {
		return this.get('/preview/get')
	}

	async modifyPreviewSource(params) {
		return this.post('/preview/source/modify', params)
	}

	async removePreviewSource(params) {
		return this.post('/preview/source/remove', params)
	}

	// ── PTZ ──────────────────────────────────────────────────────────────────

	async ptzControl(params) {
		return this.post('/ptz/set', params)
	}

	// ── Network ──────────────────────────────────────────────────────────────

	async getNetwork() {
		return this.get('/network/get')
	}

	async pingNetwork(params) {
		return this.post('/network/ping', params)
	}

	// ── Report ───────────────────────────────────────────────────────────────

	async getReportCodecInfo(params) {
		return this.get('/report/codec_info', params)
	}

	async getReportSystemInfo() {
		return this.get('/report/system_info')
	}

	/**
	 * Assign a stream to an output position.
	 * Payload matches decoder web UI (dragsMixins.setOutputSource / setLayoutGridHttp).
	 */
	buildAssignSourceParams(outputId, posId, stream, layoutId) {
		return {
			from: {
				type: 'source',
				output_id: String(outputId),
			},
			to: {
				type: 'output',
				output_id: String(outputId),
				pos_id: parseInt(posId),
				stream_id: stream.id,
				stream_name: stream.name || stream.label || '',
				stream_url: stream.url || '',
				layout_id: layoutId,
			},
		}
	}

	buildPreviewAssignParams(stream, outputId = '1') {
		const from = {
			type: 'source',
			stream_id: stream.id,
			stream_name: stream.name || stream.label || '',
			stream_url: stream.url || '',
			output_id: String(outputId),
			layout_id: '',
			pos_id: '',
		}
		return {
			from,
			to: {
				type: 'preview',
				stream_id: stream.id,
				stream_name: stream.name || stream.label || '',
				stream_url: stream.url || '',
				output_id: String(outputId),
				layout_id: '',
			},
		}
	}

	ptzStorePreset(outputId, posId, presetNo, layoutId) {
		return this.post('/ptz/set', {
			output_id: String(outputId),
			pos_id: parseInt(posId),
			layout_id: parseInt(layoutId),
			type: 'ptz_store_preset',
			data: { preset_no: parseInt(presetNo) },
		})
	}

	ptzRecallPreset(outputId, posId, presetNo, speed, layoutId) {
		return this.post('/ptz/set', {
			output_id: String(outputId),
			pos_id: parseInt(posId),
			layout_id: parseInt(layoutId),
			type: 'ptz_recall_preset',
			data: {
				preset_no: parseInt(presetNo),
				speed: parseFloat(speed),
			},
		})
	}

	parseOutputPosition(compositeId) {
		const parts = String(compositeId).split(':')
		if (parts.length !== 2) {
			return null
		}
		return {
			output_id: parts[0],
			pos_id: parseInt(parts[1]),
		}
	}

	parseOutputLayout(compositeId) {
		const parts = String(compositeId).split(':')
		if (parts.length !== 2) {
			return null
		}
		return {
			output_id: parts[0],
			layout_id: parts[1],
		}
	}

	parseOutputInterface(compositeId) {
		const parts = String(compositeId).split(':')
		if (parts.length !== 2) {
			return null
		}
		return {
			output_id: parts[0],
			intf_id: parts[1],
		}
	}
}

module.exports = KiloviewDecoder
