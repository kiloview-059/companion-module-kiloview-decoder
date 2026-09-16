/**
 * Upgrade scripts for the merged kiloview-decoder module (v2.x).
 *
 * Two scripts:
 *  1. v0_placeholder  — equivalent to the legacy no-op placeholder.
 *  2. v1_merge_2026_09 — core migration that:
 *      - adds `deviceType` to config (port '99' → gateway, otherwise decoder)
 *        and fills in any missing config fields with defaults
 *      - renames action ids per the migration map (startStream →
 *        startStreamPlayback, startPush → gatewayStartPush, addStreamService
 *        → gatewayAddService, addDecodeSource → addDecodeSourceJson, ...)
 *      - renames feedback ids (muteStatus → gatewayMuteStatus,
 *        outputResolution → resolutionMatch — the latter cannot be mapped
 *        losslessly from free text to a res_id dropdown, so it is flagged
 *        for manual reselection)
 *      - drops the deprecated `previewSources` no-op action and counts it
 *
 * Migration map source: design doc 06 §11.
 */

const ACTION_ID_MAP = {
	startStream: 'startStreamPlayback',
	stopStream: 'stopStreamPlayback',
	assignPreviewSource: 'previewAssign',
	removePreviewSource: 'previewRemove',
	startPush: 'gatewayStartPush',
	stopPush: 'gatewayStopPush',
	addStreamService: 'gatewayAddService',
	removeStreamService: 'gatewayRemoveService',
	addDecodeSource: 'addDecodeSourceJson',
}

const FEEDBACK_ID_MAP = {
	muteStatus: 'gatewayMuteStatus',
	outputResolution: 'resolutionMatch',
}

// Config fields the merged module expects, with their defaults.
const CONFIG_DEFAULTS = {
	deviceType: 'auto',
	host: '',
	protocol: 'http',
	port: '80',
	useAuth: true,
	username: 'admin',
	password: 'admin',
	polling: true,
	pollingrate: '1000',
	pollingrate_sources: '10000',
	verbose: false,
}

function inferDeviceType(config) {
	// Legacy decoder modules defaulted to port 80; gateway (MG) to port 99.
	const port = String(config?.port || '')
	if (port === '99') return 'gateway'
	return 'decoder'
}

function logInfo(context, message) {
	try {
		if (context && typeof context.log === 'function') {
			context.log('info', message)
		} else {
			// eslint-disable-next-line no-console
			console.log('[kiloview-decoder upgrade] ' + message)
		}
	} catch (e) {
		// best-effort logging
	}
}

module.exports = [
	// 1. Legacy placeholder (no-op, equivalent to the old shipped scripts).
	function v0_placeholder(_context, _props) {
		return {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}
	},

	// 2. Core merge migration.
	function v1_merge_2026_09(context, props) {
		const config = (props && props.config) || {}
		const actions = Array.isArray(props && props.actions) ? props.actions : []
		const feedbacks = Array.isArray(props && props.feedbacks) ? props.feedbacks : []

		// ── Config migration ───────────────────────────────────────────
		let updatedConfig = null
		const migratedConfig = { ...config }

		if (migratedConfig.deviceType === undefined || migratedConfig.deviceType === '') {
			migratedConfig.deviceType = inferDeviceType(migratedConfig)
		}

		let configChanged = migratedConfig.deviceType !== config.deviceType
		for (const key of Object.keys(CONFIG_DEFAULTS)) {
			if (migratedConfig[key] === undefined) {
				migratedConfig[key] = CONFIG_DEFAULTS[key]
				configChanged = true
			}
		}

		if (configChanged) {
			updatedConfig = migratedConfig
		}

		// ── Actions migration ───────────────────────────────────────────
		let droppedPreviewSources = 0
		const updatedActions = []

		for (const action of actions) {
			const oldId = action && action.id
			// Drop the deprecated no-op previewSources action.
			if (oldId === 'previewSources') {
				droppedPreviewSources++
				continue
			}
			const newId = ACTION_ID_MAP[oldId] || oldId
			if (newId !== oldId) {
				updatedActions.push({ ...action, id: newId })
			} else {
				updatedActions.push(action)
			}
		}

		// ── Feedbacks migration ─────────────────────────────────────────
		let reselectResolution = 0
		const updatedFeedbacks = []

		for (const feedback of feedbacks) {
			const oldId = feedback && feedback.id
			const newId = FEEDBACK_ID_MAP[oldId] || oldId

			if (oldId === 'outputResolution') {
				// Cannot map free-text resolution to a res_id dropdown
				// choice reliably — flag for manual reselection.
				reselectResolution++
				updatedFeedbacks.push({
					...feedback,
					id: newId,
					options: {
						output_id: '1',
						res_id: '',
						match: 'true',
					},
				})
			} else if (newId !== oldId) {
				updatedFeedbacks.push({ ...feedback, id: newId })
			} else {
				updatedFeedbacks.push(feedback)
			}
		}

		// ── Summary ─────────────────────────────────────────────────────
		const notes = []
		if (droppedPreviewSources > 0) {
			notes.push(`${droppedPreviewSources} deprecated previewSources action(s) removed`)
		}
		if (reselectResolution > 0) {
			notes.push(`${reselectResolution} outputResolution feedback(s) converted to resolutionMatch — reselect the resolution`)
		}
		if (notes.length > 0) {
			logInfo(context, 'Migration complete. ' + notes.join('; '))
		}

		return {
			updatedConfig,
			updatedActions,
			updatedFeedbacks,
		}
	},
]
