/**
 * Gateway API: endpoint methods for MG300V2/RMG300V2.
 * Migrated from companion-module-kiloview-mediagateway/src/mediagateway.js.
 * Uses BaseClient.call(routeKey, params) with the gateway profile route table.
 *
 * Fixes applied (per design doc 06 §7):
 * - /output/get: GET + output_id (was POST without output_id)
 * - /source/groups/list: GET (was POST)
 * - /gate/stream/multi_out_query: GET (was POST)
 * - Device IP: via /network/get (was /sys/ip/get)
 */
const { buildAddStreamParams: sharedBuildAddStreamParams } = require('./paramBuilders')
class GatewayApi {
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

	async removeSource(params) {
		return this.call('removeSource', params)
	}

	async setAudiomix(params) {
		return this.call('setAudiomix', params)
	}

	async getOutputInterfaces(outputId, type = 'video') {
		return this.call('getOutputInterfaces', { output_id: String(outputId), type })
	}

	async setMute(outputId, posId, mute) {
		return this.call('setMute', {
			output_id: String(outputId),
			pos_id: parseInt(posId),
			mute: Boolean(mute),
		})
	}

	async getBackground(outputId) {
		return this.call('getBackground', { output_id: String(outputId) })
	}

	async setBackground(params) {
		return this.call('setBackground', params)
	}

	async getBorder(outputId) {
		return this.call('getBorder', { output_id: String(outputId) })
	}

	// ── Layout ──────────────────────────────────────────────────────────────

	async getLayoutList() {
		return this.call('getLayoutList')
	}

	async selectLayout(params) {
		return this.call('selectLayout', params)
	}

	// ── Source ──────────────────────────────────────────────────────────────

	async getSourceGroups() {
		return this.call('getSourceGroups', { is_need_stream: true, preview: false })
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

	async removePreviewSource(params) {
		return this.call('removePreviewSource', params)
	}

	// ── Gateway (gate) ───────────────────────────────────────────────────────

	async getGatewayStreamList() {
		return this.call('getGatewayStreamList')
	}

	async addGatewayStream(params) {
		return this.call('addGatewayStream', params)
	}

	async deleteGatewayStream(params) {
		return this.call('deleteGatewayStream', params)
	}

	async batchEnableGatewayStream(params) {
		return this.call('batchEnableGatewayStream', params)
	}

	async bindSrcGateway(params) {
		return this.call('bindSrcGateway', params)
	}

	async multiOutQuery() {
		return this.call('multiOutQuery', {})
	}

	async multiOutSwitch(params) {
		return this.call('multiOutSwitch', params)
	}

	// ── Guide (experimental) ────────────────────────────────────────────────

	async getGuideStatus() {
		return this.call('getGuideStatus')
	}

	async setGuideStatus(params) {
		return this.call('setGuideStatus', params)
	}

	// ── Network ──────────────────────────────────────────────────────────────

	async getNetwork() {
		return this.call('getNetwork')
	}

	// ── Param builders ──────────────────────────────────────────────────────

	buildAddStreamParams(groupId, options) {
		return sharedBuildAddStreamParams(groupId, options)
	}

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

	buildPreviewAssignParams(stream, posId) {
		const posIdNum = parseInt(posId)
		const to = {
			type: 'preview',
			stream_id: stream.id,
			stream_name: stream.name || stream.label || '',
			stream_url: stream.url || '',
			output_id: '1',
			layout_id: '',
		}
		if (posIdNum > 0) {
			to.pos_id = posIdNum
		}
		return {
			from: {
				type: 'source',
				stream_id: stream.id,
				stream_name: stream.name || stream.label || '',
				stream_url: stream.url || '',
				pos_id: '',
				output_id: '1',
				layout_id: '',
			},
			to,
		}
	}
}

module.exports = GatewayApi
