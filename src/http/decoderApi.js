/**
 * Decoder API: endpoint methods for D350/D260/RD350/RD260.
 * Migrated from companion-module-kiloview-decoder/src/kiloview.js.
 * Uses BaseClient.call(routeKey, params) with the decoder profile route table.
 */
const { buildAddStreamParams: sharedBuildAddStreamParams } = require('./paramBuilders')
class DecoderApi {
	constructor(client) {
		this.client = client
	}

	async call(routeKey, params) {
		return this.client.call(routeKey, params)
	}

	// ── Info / maintenance ─────────────────────────────────────────────────

	async getInfo() {
		return this.call('getInfo')
	}

	async getUsage() {
		return this.call('getUsage')
	}

	// ── System ──────────────────────────────────────────────────────────────

	async reboot() {
		return this.call('reboot')
	}

	async restore() {
		return this.call('restore')
	}

	async getDeviceName() {
		return this.call('getDeviceName')
	}

	// ── Output ──────────────────────────────────────────────────────────────

	async getOutputList() {
		return this.call('getOutputList')
	}

	async getOutput(outputId) {
		return this.call('getOutput', { output_id: String(outputId) })
	}

	async getResolutionList() {
		return this.call('getResolutionList')
	}

	async setResolution(outputId, resId) {
		return this.call('setResolution', { output_id: String(outputId), res_id: String(resId) })
	}

	async setSource(params) {
		return this.call('setSource', params)
	}

	async removeSource(outputId, posId) {
		return this.call('removeSource', { output_id: String(outputId), pos_id: parseInt(posId) })
	}

	/**
	 * Position mute — POST /output/mute/set (confirmed present on D260 fw 2.20).
	 * Not audiomix/set, which requires stream_id + type.
	 */
	async setMute(outputId, posId, mute) {
		return this.call('setMute', {
			output_id: String(outputId),
			pos_id: parseInt(posId),
			mute: Boolean(mute),
		})
	}

	async getOutputInterfaces(outputId, type = 'video') {
		return this.call('getOutputInterfaces', { output_id: String(outputId), type })
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
			error.name = 'KiloviewDeviceError'
			throw error
		}
		return this.call('setOutputInterfaces', {
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
			error.name = 'KiloviewDeviceError'
			throw error
		}
		return this.call('setOutputInterfaces', {
			...intf,
			output_id: String(outputId),
			type: 'audio',
			intf_id: parseInt(intfId),
			...changes,
		})
	}

	async getAudiomix(outputId) {
		return this.call('getAudiomix', { output_id: String(outputId) })
	}

	async setAudiomix(params) {
		// D350-api.md: required output_id, stream_id, type; enable/volume/mute optional.
		// Do not invent defaults that overwrite an intentional partial update.
		const body = {
			...params,
			output_id: String(params.output_id),
			stream_id: String(params.stream_id),
			type: params.type || 'output',
		}
		return this.call('setAudiomix', body)
	}

	async addAudiomix(outputId, streamId) {
		return this.call('addAudiomix', {
			output_id: String(outputId),
			stream_id: String(streamId),
		})
	}

	async removeAudiomix(outputId, streamId, type = 'preview') {
		return this.call('removeAudiomix', {
			output_id: String(outputId),
			stream_id: String(streamId),
			type,
		})
	}

	async removePreview(posId) {
		return this.call('removePreviewSource', { pos_id: parseInt(posId) })
	}

	// ── Layout ──────────────────────────────────────────────────────────────

	async getLayoutList() {
		return this.call('getLayoutList')
	}

	async selectLayout(outputId, layoutId) {
		const lid = parseInt(layoutId)
		if (!outputId || Number.isNaN(lid)) {
			const error = new Error('selectLayout: output_id and a numeric layout_id are required')
			error.name = 'KiloviewDeviceError'
			throw error
		}
		return this.call('selectLayout', {
			output_id: String(outputId),
			layout_id: lid,
		})
	}

	async saveLayout(outputId, layoutId) {
		const lid = parseInt(layoutId)
		if (!outputId || Number.isNaN(lid)) {
			const error = new Error('saveLayout: output_id and a numeric layout_id are required')
			error.name = 'KiloviewDeviceError'
			throw error
		}
		return this.call('saveLayout', {
			output_id: String(outputId),
			layout_id: lid,
		})
	}

	async reloadLayout(outputId, layoutId) {
		const oid = parseInt(outputId)
		const lid = parseInt(layoutId)
		if (Number.isNaN(oid) || Number.isNaN(lid)) {
			const error = new Error('reloadLayout: numeric output_id and layout_id are required')
			error.name = 'KiloviewDeviceError'
			throw error
		}
		return this.call('reloadLayout', {
			output_id: oid,
			layout_id: lid,
		})
	}

	// ── Source ──────────────────────────────────────────────────────────────

	async getSourceGroups() {
		// GET /source/groups/list (is_need_stream defaults to true in firmware)
		return this.call('getSourceGroups')
	}

	async addSourceGroup(name) {
		return this.call('addSourceGroup', { name })
	}

	async removeSourceGroup(groupId) {
		return this.call('removeSourceGroup', { group_id: String(groupId) })
	}

	async addSourceStream(params) {
		return this.call('addSourceStream', params)
	}

	async modifySourceStream(params) {
		return this.call('modifySourceStream', params)
	}

	async removeSourceStream(params) {
		return this.call('removeSourceStream', params)
	}

	async startPlay(streamId) {
		return this.call('startPlay', { stream_id: streamId })
	}

	async stopPlay(streamId) {
		return this.call('stopPlay', { stream_id: streamId })
	}

	buildAddStreamParams(groupId, options) {
		return sharedBuildAddStreamParams(groupId, options)
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

		if (overrides.name) params.name = overrides.name
		if (overrides.url) params.url = overrides.url
		if (overrides.user !== undefined && overrides.user !== '') params.user = overrides.user
		if (overrides.password !== undefined && overrides.password !== '') params.password = overrides.password
		if (params.type === 'rtsp' && overrides.trans_mode) params.trans_mode = overrides.trans_mode

		return params
	}

	// ── NDI Discovery ───────────────────────────────────────────────────────

	async getNdiDiscoveryAll() {
		return this.call('getNdiDiscoveryAll')
	}

	async addNdiManualIp(ip, group = 'public') {
		const current = await this.getNdiDiscoveryAll()
		const manuals = Array.isArray(current?.data?.manual) ? [...current.data.manual] : []
		const entry = { dis_d_ip: ip, dis_g_name: group }
		const exists = manuals.some((m) => m.dis_d_ip === ip && m.dis_g_name === group)
		if (!exists) manuals.push(entry)
		return this.call('setNdiManualList', {
			manuals: manuals.map((m) => ({ dis_d_ip: m.dis_d_ip, dis_g_name: m.dis_g_name })),
		})
	}

	async addNdiDiscoveryServer(serverIp, group = 'public') {
		return this.call('addNdiDiscoveryServer', { dis_s_ip: serverIp, dis_g_name: group })
	}

	// ── Preview ──────────────────────────────────────────────────────────────

	async getPreviewList() {
		return this.call('getPreviewList')
	}

	async modifyPreviewSource(params) {
		return this.call('modifyPreviewSource', params)
	}

	// ── PTZ ──────────────────────────────────────────────────────────────────

	ptzStorePreset(outputId, posId, presetNo) {
		return this.call('ptzControl', {
			output_id: String(outputId),
			pos_id: parseInt(posId),
			type: 'ptz_store_preset',
			data: { preset_no: parseInt(presetNo) },
		})
	}

	ptzRecallPreset(outputId, posId, presetNo, speed) {
		return this.call('ptzControl', {
			output_id: String(outputId),
			pos_id: parseInt(posId),
			type: 'ptz_recall_preset',
			data: { preset_no: parseInt(presetNo), speed: parseFloat(speed) },
		})
	}

	// ── Network ──────────────────────────────────────────────────────────────

	async getNetwork() {
		return this.call('getNetwork')
	}

	// ── Param builders ──────────────────────────────────────────────────────

	buildAssignSourceParams(outputId, posId, stream, layoutId) {
		return {
			from: { type: 'source', output_id: String(outputId) },
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

	/**
	 * Preview assign — D350-api.md POST /preview/source/modify.
	 * Server uses to.stream_id and optional to.pos_id; from is only for in-preview moves.
	 * @param {object} stream
	 * @param {string|number} [posId] optional preview slot; omit to let device pick
	 */
	buildPreviewAssignParams(stream, posId) {
		const to = { stream_id: stream.id }
		if (posId !== undefined && posId !== null && posId !== '') {
			to.pos_id = parseInt(posId)
		}
		return { to }
	}
}

module.exports = DecoderApi
