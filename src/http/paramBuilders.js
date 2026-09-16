/**
 * Shared request-body builders for decoder and gateway APIs.
 * Both device families accept the same flat add-stream shape
 * (verified on D260 fw 2.20.0732 and MG300V2 fw 2.20.0132).
 */
function buildAddStreamParams(groupId, options = {}) {
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

module.exports = { buildAddStreamParams }
