const http = require('http')
const https = require('https')

const { REQUEST_TIMEOUT, ERR_USER_TOKEN_INVALID } = require('../constants')

/**
 * Node HTTP headers must be Latin-1 / ASCII. Login `alias` (and similar
 * fields) can contain CJK characters which JSON.stringify keeps as raw
 * UTF-8 — that throws "Invalid character in header content". Escape them
 * as \\uXXXX so the header stays ASCII while JSON.parse on the device
 * still restores the original string.
 */
function headerSafeJson(value) {
	return JSON.stringify(value).replace(/[^\x20-\x7E]/g, (ch) => {
		return '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')
	})
}

/**
 * BaseClient: unified HTTP client for both Kiloview decoder and gateway devices.
 *
 * Merges the common parts of KiloviewDecoder and MediaGateway:
 * - keep-alive agent (maxSockets 5)
 * - authorize() via POST /users/login
 * - call(routeKey, params) with token-invalid detection + single replay
 * - real timeout implementation (fixes MG timeout bug)
 */
class BaseClient {
	constructor(owner, ip, username, password, protocol = 'http', port = 80, timeout = REQUEST_TIMEOUT) {
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
		this.httpsAgent = new https.Agent({ ...agentOpts, rejectUnauthorized: false })

		this.session = { token: '', loginData: {} }
		this.authorized = false
		this.alias = username
		this.profile = null
	}

	log(level, message) {
		this.owner.log(level, message)
	}

	setProfile(profile) {
		this.profile = profile
	}

	_isAuthError(result) {
		return result?.result === 'error' && String(result.msg) === ERR_USER_TOKEN_INVALID
	}

	_request(method, path, data, useAuth = true) {
		return new Promise((resolve, reject) => {
			const isHttps = this.connection_info.protocol === 'https'
			const urlObj = new URL(`${this.baseURL}${path}`)
			const headers = {
				'Content-Type': 'application/json',
				Connection: 'keep-alive',
			}

			if (useAuth && this.profile) {
				const authHeaders = this.profile.buildAuthHeaders(this.session) || {}
				if (authHeaders.app != null && typeof authHeaders.app !== 'string') {
					authHeaders.app = headerSafeJson(authHeaders.app)
				} else if (typeof authHeaders.app === 'string') {
					// Profiles usually JSON.stringify already; re-escape non-ASCII.
					authHeaders.app = authHeaders.app.replace(/[^\x20-\x7E]/g, (ch) => {
						return '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')
					})
				}
				Object.assign(headers, authHeaders)
			}

			const options = {
				hostname: urlObj.hostname,
				port: urlObj.port || (isHttps ? 443 : 80),
				path: urlObj.pathname + urlObj.search,
				method,
				rejectUnauthorized: false,
				agent: isHttps ? this.httpsAgent : this.httpAgent,
				timeout: this.timeout,
				headers,
			}

			const req = (isHttps ? https : http).request(options, (res) => {
				let body = ''
				res.on('data', (chunk) => {
					body += chunk
				})
				res.on('end', () => {
					const status = res.statusCode || 0
					let parsed
					try {
						parsed = JSON.parse(body)
					} catch (e) {
						const error = new Error(
							status >= 400
								? `HTTP ${status} (non-JSON response)`
								: `Invalid JSON response (HTTP ${status})`
						)
						error.name = 'KiloviewDeviceError'
						error.statusCode = status
						reject(error)
						return
					}
					if (status >= 400) {
						const error = new Error(parsed?.msg || `HTTP ${status}`)
						error.name = 'KiloviewDeviceError'
						error.statusCode = status
						error.code = parsed?.msg
						reject(error)
						return
					}
					resolve(parsed)
				})
			})

			req.on('error', (err) => {
				const error = new Error(err.message)
				error.name = 'KiloviewDeviceError'
				reject(error)
			})

			req.on('timeout', () => {
				req.destroy()
				const error = new Error('Request timed out')
				error.name = 'KiloviewDeviceError'
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
			const result = await this._request('POST', '/users/login', { username, password }, false)

			if (!result || result.result !== 'ok' || !result.data?.token) {
				const error = new Error(result?.msg || 'Authorization failed')
				error.name = 'KiloviewDeviceError'
				throw error
			}

			// Store full login data — the device requires it in the `app` header
			// for authenticated requests (not just the token).
			this.session.loginData = result.data
			this.session.token = result.data.token
			this.alias = result.data.alias || username
			this.authorized = true
			return true
		} catch (error) {
			if (error.name !== 'KiloviewDeviceError') {
				const newError = new Error('Could not reach device')
				newError.name = 'KiloviewDeviceError'
				throw newError
			}
			throw error
		}
	}

	/**
	 * call(routeKey, params): look up the route in the profile's route table,
	 * encode parameters, send the request, and handle token-invalid replay (max 1).
	 */
	async call(routeKey, params = {}) {
		if (!this.authorized) {
			await this.authorize()
		}

		const route = this.profile.routes[routeKey]
		if (!route) {
			const error = new Error(`Unknown route: ${routeKey}`)
			error.name = 'KiloviewDeviceError'
			throw error
		}

		// ── TEST MODE: verbose success/failure log for every API call ──
		// Toggle via connection config → Verbose Logging. Remove after testing.
		const __verbose = this.owner?.config?.verbose
		const __tag = `[API] ${route.method} ${route.path}`
		if (__verbose) {
			const __params = Object.keys(params).length
				? ` params=${JSON.stringify(params).slice(0, 200)}`
				: ''
			this.log('info', `${__tag} → sending (routeKey=${routeKey})${__params}`)
		}

		let result
		try {
			result = await this._executeRoute(route, params)
		} catch (e) {
			if (__verbose) {
				this.log('warn', `${__tag} → ERROR: ${e.message}`)
			}
			throw e
		}

		if (this._isAuthError(result)) {
			this.authorized = false
			await this.authorize()
			return this._executeRoute(route, params)
		}

		if (result && result.result === 'error') {
			if (__verbose) {
				this.log('warn', `${__tag} → DEVICE ERROR: ${result.msg}`)
			}
			const error = new Error(result.msg || 'API Error')
			error.name = 'KiloviewDeviceError'
			error.code = result.msg
			throw error
		}

		if (__verbose) {
			// Show the device's result field + a trimmed data preview
			const r = result?.result || 'unknown'
			const dataPreview = result?.data !== undefined
				? ` data=${JSON.stringify(result.data).slice(0, 200)}${JSON.stringify(result.data).length > 200 ? '…' : ''}`
				: ''
			this.log('info', `${__tag} → ${r}${dataPreview}`)
		}

		return result
	}

	async _executeRoute(route, params) {
		const { method, path, paramMode = 'query' } = route

		if (method === 'GET') {
			const query = paramMode === 'query' ? params : {}
			const queryString = new URLSearchParams(query).toString()
			const fullPath = path + (queryString ? '?' + queryString : '')
			return this._request('GET', fullPath)
		}

		// POST
		if (paramMode === 'query') {
			const queryString = new URLSearchParams(params).toString()
			const fullPath = path + (queryString ? '?' + queryString : '')
			return this._request('POST', fullPath, {})
		}

		// POST with body (default)
		return this._request('POST', path, params)
	}

	async get(path, query = {}) {
		const queryString = new URLSearchParams(query).toString()
		const fullPath = path + (queryString ? '?' + queryString : '')
		return this._request('GET', fullPath)
	}

	async post(path, data = {}) {
		return this._request('POST', path, data)
	}
}

module.exports = BaseClient
