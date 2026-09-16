/**
 * Gateway Actions (7): registered only for the gateway profile.
 * Migrated from companion-module-kiloview-mediagateway/src/actions.js with a
 * unified `gateway*` verb prefix. The deprecated `previewSources` no-op action
 * is dropped (not registered, not migrated). Per design doc 06 §5:
 *  - gatewayStopPush lists only active push streams (CHOICES_GATEWAY_STREAMINGS)
 *  - multiOutSwitch choices mark the current output as (Active)
 *  - gatewayAddService / addDecodeSourceJson add a protocol dropdown helper
 */
function buildActions(instance) {
	const actions = {}

	// ── Gateway Push ─────────────────────────────────────────────────────
	actions.gatewayStartPush = {
		name: 'Start Gateway Push',
		description: 'Bind a source to a gateway stream then enable it',
		options: [
			{
				type: 'dropdown',
				label: 'Gateway Stream',
				id: 'gateway_id',
				default: instance.CHOICES_GATEWAY_STREAMS[0]?.id || 'null',
				choices: instance.CHOICES_GATEWAY_STREAMS,
			},
			{
				type: 'dropdown',
				label: 'Source',
				id: 'stream_id',
				default: instance.CHOICES_STREAMS[0]?.id || 'null',
				choices: instance.CHOICES_STREAMS,
			},
		],
		callback: async (action) => {
			const { gateway_id, stream_id } = action.options
			if (!stream_id || stream_id === 'null') {
				instance.log('warn', 'No source stream selected')
				return
			}
			if (!gateway_id || gateway_id === 'null') {
				instance.log('warn', 'No gateway stream selected')
				return
			}
			await instance.DEVICE.bindSrcGateway({ id: gateway_id, stream_id: stream_id })
			await instance.DEVICE.batchEnableGatewayStream({
				enable: true,
				ids: [{ id: gateway_id }],
			})
			await instance.checkSources()
		},
	}

	actions.gatewayStopPush = {
		name: 'Stop Gateway Push',
		description: 'Disable an active push stream (only active streams are listed)',
		options: [
			{
				type: 'dropdown',
				label: 'Gateway Stream',
				id: 'gateway_id',
				default: instance.CHOICES_GATEWAY_STREAMINGS[0]?.id || 'null',
				choices: instance.CHOICES_GATEWAY_STREAMINGS,
			},
		],
		callback: async (action) => {
			const { gateway_id } = action.options
			if (!gateway_id || gateway_id === 'null') {
				instance.log('warn', 'No gateway stream selected')
				return
			}
			await instance.DEVICE.batchEnableGatewayStream({
				enable: false,
				ids: [{ id: gateway_id }],
			})
			await instance.checkSources()
		},
	}

	actions.gatewayAddService = {
		name: 'Add Gateway Stream Service',
		description: 'Add a gateway push service from a JSON body (protocol dropdown helps pick a template)',
		options: [
			{
				type: 'dropdown',
				label: 'Protocol',
				id: 'protocol',
				default: 'rtmp',
				choices: instance.CHOICES_GATEWAY_PROTOCOLS,
			},
			{
				type: 'textinput',
				label: 'JSON Body',
				id: 'body',
				default:
					'{\n  "protocol": "rtmp",\n  "name": "rtmp1",\n  "address": "rtmp://*.*.*.*/live/stream",\n  "user": "",\n  "password": "",\n  "conn_timeout": 15,\n  "conn_intv": 3,\n  "old_rtmp": false,\n  "is_enable": true,\n  "stream_id": "MultiViewMixer"\n}',
				useVariables: true,
				multiline: true,
			},
		],
		callback: async (action) => {
			const { body } = action.options
			if (!body) {
				instance.log('warn', 'Add Gateway Stream Service: body is empty')
				return
			}
			try {
				const params = JSON.parse(body)
				await instance.DEVICE.addGatewayStream(params)
				await instance.checkSources()
			} catch (e) {
				instance.log('error', 'Add Gateway Stream Service: ' + e.message)
			}
		},
	}

	actions.gatewayRemoveService = {
		name: 'Remove Gateway Stream Service',
		description: 'Delete a gateway push stream',
		options: [
			{
				type: 'dropdown',
				label: 'Gateway Stream',
				id: 'gateway_id',
				default: instance.CHOICES_GATEWAY_STREAMS[0]?.id || 'null',
				choices: instance.CHOICES_GATEWAY_STREAMS,
			},
		],
		callback: async (action) => {
			const { gateway_id } = action.options
			if (!gateway_id || gateway_id === 'null') {
				instance.log('warn', 'Remove Gateway Stream Service: no stream selected')
				return
			}
			await instance.DEVICE.deleteGatewayStream({ ids: [{ id: gateway_id }] })
			await instance.checkSources()
		},
	}

	// ── Multi Out ───────────────────────────────────────────────────────
	actions.multiOutSwitch = {
		name: 'Multi Out Switch',
		description: 'Switch active multi-output (current marked as Active)',
		options: [
			{
				type: 'dropdown',
				label: 'Output',
				id: 'enable',
				default: instance.CHOICES_MULTI_OUT.find((c) => c.enable)?.id || '1',
				choices: instance.CHOICES_MULTI_OUT,
			},
		],
		callback: async (action) => {
			const enable = parseInt(action.options.enable)
			await instance.DEVICE.multiOutSwitch({
				enable: enable,
				skip_switch_confirm: true,
			})
			await instance.checkState()
		},
	}

	// ── Decode Source (JSON advanced) ────────────────────────────────────
	actions.addDecodeSourceJson = {
		name: 'Add Decode Source (JSON)',
		description: 'Add a decode source from a JSON body (protocol dropdown helps pick a template)',
		options: [
			{
				type: 'dropdown',
				label: 'Protocol',
				id: 'protocol',
				default: 'rtsp',
				choices: instance.CHOICES_DECODE_PROTOCOLS,
			},
			{
				type: 'textinput',
				label: 'JSON Body',
				id: 'body',
				default:
					'{\n  "type": "rtsp",\n  "url": "rtsp://*.*.*.*/live/stream",\n  "name": "",\n  "group_id": "",\n  "user": "",\n  "password": "",\n  "trans_mode": "tcp"\n}',
				useVariables: true,
				multiline: true,
			},
		],
		callback: async (action) => {
			const { body } = action.options
			if (!body) {
				instance.log('warn', 'Add Decode Source: body is empty')
				return
			}
			try {
				const params = JSON.parse(body)
				await instance.DEVICE.addSourceStream(params)
				await instance.checkSources()
			} catch (e) {
				instance.log('error', 'Add Decode Source: ' + e.message)
			}
		},
	}

	actions.removeDecodeSource = {
		name: 'Remove Decode Source',
		description: 'Remove a decode source stream',
		options: [
			{
				type: 'dropdown',
				label: 'Source',
				id: 'stream_id',
				default: instance.CHOICES_STREAMS[0]?.id || 'null',
				choices: instance.CHOICES_STREAMS,
			},
		],
		callback: async (action) => {
			const { stream_id } = action.options
			if (!stream_id || stream_id === 'null') {
				instance.log('warn', 'Remove Decode Source: no source selected')
				return
			}
			const stream = instance.CHOICES_STREAMS.find((s) => s.id === stream_id)
			if (!stream) {
				instance.log('warn', 'Remove Decode Source: source not found')
				return
			}
			await instance.DEVICE.removeSourceStream({
				group_id: stream.group_id,
				stream_id: stream_id,
			})
			await instance.checkSources()
		},
	}

	// ── Output Border (gateway supports /output/border/set) ─────────────
	// Per MG300V2_API.md §7.15: only output_id, enable, color are accepted.
	// The width fields (top/bottom/left/right) are silently ignored by the
	// device — verified on RMG300 fw 2.20.0132.0959.
	actions.setBorder = {
		name: 'Set Output Border',
		description: 'Configure output border (enable, color)',
		options: [
			{
				type: 'checkbox',
				label: 'Enable Border',
				id: 'enable',
				default: false,
			},
			{
				type: 'colorpicker',
				label: 'Border Color',
				id: 'color',
				default: 16711680,
			},
		],
		callback: async (action) => {
			const { enable, color } = action.options
			const hex = '#' + Number(color).toString(16).padStart(6, '0')
			await instance.DEVICE.call('setBorder', {
				output_id: '1',
				enable: Boolean(enable),
				color: hex,
			})
			await instance.checkState()
		},
	}

	// ── Output Background (gateway supports /output/background/set) ─────
	// Per MG300V2_API.md §7.17: body is { output_id, enable, background }
	// where `background` is a color string like "#000000". The previous
	// implementation used `background_type` + `color` field names which the
	// device silently ignores — fixed after write-and-restore testing.
	actions.setBackground = {
		name: 'Set Output Background',
		description: 'Set output background color',
		options: [
			{
				type: 'checkbox',
				label: 'Enable Background',
				id: 'enable',
				default: true,
			},
			{
				type: 'colorpicker',
				label: 'Background Color',
				id: 'background',
				default: 0,
			},
		],
		callback: async (action) => {
			const { enable, background } = action.options
			const hex = '#' + Number(background).toString(16).padStart(6, '0')
			await instance.DEVICE.call('setBackground', {
				output_id: '1',
				enable: Boolean(enable),
				background: hex,
			})
			await instance.checkState()
		},
	}

	// ── Gateway Stream Enable/Disable (/gate/stream/batch_enable) ────────
	actions.setGatewayStreamEnable = {
		name: 'Set Gateway Stream Enable',
		description: 'Enable or disable a gateway push stream',
		options: [
			{
				type: 'dropdown',
				label: 'Gateway Stream',
				id: 'gateway_id',
				default: instance.CHOICES_GATEWAY_STREAMS[0]?.id || 'null',
				choices: instance.CHOICES_GATEWAY_STREAMS,
			},
			{
				type: 'checkbox',
				label: 'Enable',
				id: 'enable',
				default: true,
			},
		],
		callback: async (action) => {
			const { gateway_id, enable } = action.options
			if (!gateway_id || gateway_id === 'null') {
				instance.log('warn', 'Set Gateway Stream Enable: no stream selected')
				return
			}
			await instance.DEVICE.batchEnableGatewayStream({
				enable: Boolean(enable),
				ids: [{ id: gateway_id }],
			})
			await instance.checkSources()
		},
	}

	// ── Gateway Stream Update (/gate/stream/update) ─────────────────────
	actions.updateGatewayStream = {
		name: 'Update Gateway Stream',
		description: 'Update fields of an existing gateway stream (JSON body)',
		options: [
			{
				type: 'dropdown',
				label: 'Gateway Stream',
				id: 'gateway_id',
				default: instance.CHOICES_GATEWAY_STREAMS[0]?.id || 'null',
				choices: instance.CHOICES_GATEWAY_STREAMS,
			},
			{
				type: 'textinput',
				label: 'JSON Body (merge fields to update)',
				id: 'body',
				default: '{\n  "name": "updated"\n}',
				useVariables: true,
				multiline: true,
			},
		],
		callback: async (action) => {
			const { gateway_id, body } = action.options
			if (!gateway_id || gateway_id === 'null') {
				instance.log('warn', 'Update Gateway Stream: no stream selected')
				return
			}
			if (!body) {
				instance.log('warn', 'Update Gateway Stream: body is empty')
				return
			}
			try {
				const params = JSON.parse(body)
				params.id = gateway_id
				await instance.DEVICE.call('updateGatewayStream', params)
				await instance.checkSources()
			} catch (e) {
				instance.log('error', 'Update Gateway Stream: ' + e.message)
			}
		},
	}

	// ── Guide Status (/guide/set) ───────────────────────────────────────
	actions.setGuideStatus = {
		name: 'Set Guide Status',
		description: 'Show or hide the device setup guide',
		options: [
			{
				type: 'checkbox',
				label: 'Show Guide',
				id: 'show_guide',
				default: false,
			},
		],
		callback: async (action) => {
			const { show_guide } = action.options
			await instance.DEVICE.call('setGuideStatus', { show_guide: Boolean(show_guide) })
			await instance.checkState()
		},
	}

	return actions
}

module.exports = { buildActions }
