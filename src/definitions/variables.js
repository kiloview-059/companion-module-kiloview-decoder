/**
 * Variable definitions for the merged module.
 * Merges decoder (dynamic per-output/position/preview) and gateway (static
 * device/output/group/layout/gateway stream/memory/cpu/uptime) variable sets.
 *
 * Exposes buildVariables(instance) / buildVariableValues(instance) factories,
 * plus initVariables()/checkVariables() instance methods (definitions/index.js
 * spreads this module onto the instance and calls them from rebuildDefinitions).
 */

function buildCommonVariables() {
	return [
		{ variableId: 'alias', name: 'Authorized User' },
		{ variableId: 'device_name', name: 'Device Name' },
		{ variableId: 'ip', name: 'Device IP Address' },
		{ variableId: 'firmware_version', name: 'Firmware Version' },
		{ variableId: 'hardware_version', name: 'Hardware Version' },
		{ variableId: 'serial_number', name: 'Serial Number' },
		{ variableId: 'software_version', name: 'Software Version' },
	]
}

function buildDecoderVariables(instance) {
	const variables = []

	if (Array.isArray(instance.STATE.outputs)) {
		instance.STATE.outputs.forEach((output) => {
			const id = String(output.id)
			variables.push({ variableId: `output_${id}_name`, name: `Output ${id} Name` })
			variables.push({ variableId: `output_${id}_layout_id`, name: `Output ${id} Layout ID` })
			variables.push({ variableId: `output_${id}_layout_name`, name: `Output ${id} Layout Name` })
			variables.push({ variableId: `output_${id}_resolution`, name: `Output ${id} Resolution` })
			variables.push({ variableId: `output_${id}_modified`, name: `Output ${id} Layout Modified` })

			const detail = instance.STATE.output_details?.[id]
			if (detail?.position) {
				detail.position.forEach((pos) => {
					const posId = pos.id
					variables.push({
						variableId: `output_${id}_pos_${posId}_stream_name`,
						name: `Output ${id} Pos ${posId} Stream Name`,
					})
					variables.push({
						variableId: `output_${id}_pos_${posId}_stream_status`,
						name: `Output ${id} Pos ${posId} Stream Status`,
					})
					variables.push({
						variableId: `output_${id}_pos_${posId}_resolution`,
						name: `Output ${id} Pos ${posId} Resolution`,
					})
				})
			}
		})
	}

	if (Array.isArray(instance.STATE.preview)) {
		instance.STATE.preview.forEach((slot) => {
			const id = slot.id
			variables.push({ variableId: `preview_${id}_stream_name`, name: `Preview ${id} Stream Name` })
			variables.push({ variableId: `preview_${id}_stream_status`, name: `Preview ${id} Stream Status` })
		})
	}

	return variables
}

function buildGatewayVariables() {
	return [
		{ variableId: 'output_name', name: 'Current Output Name' },
		{ variableId: 'mute_status', name: 'Audio Mute Status' },
		{ variableId: 'output_resolution', name: 'Current Output Resolution' },
		{ variableId: 'background_type', name: 'Background Type' },
		{ variableId: 'guide_status', name: 'Guide Status' },
		{ variableId: 'sources_count', name: 'Number of Sources' },
		{ variableId: 'layouts_count', name: 'Number of Layouts' },
		{ variableId: 'gateway_streams_count', name: 'Number of Gateway Streams' },
		{ variableId: 'group_list', name: 'Source Groups List' },
		{ variableId: 'layout_list', name: 'Layouts List' },
		{ variableId: 'gateway_stream_list', name: 'Gateway Streams List' },
		{ variableId: 'mem_used', name: 'Memory Used' },
		{ variableId: 'mem_total', name: 'Memory Total' },
		{ variableId: 'cpu_usage', name: 'CPU Usage' },
		{ variableId: 'uptime', name: 'Uptime' },
	]
}

function buildVariables(instance) {
	const variables = buildCommonVariables()
	if (instance.isDecoder()) {
		variables.push(...buildDecoderVariables(instance))
	} else if (instance.isGateway()) {
		variables.push(...buildGatewayVariables())
	}
	return variables
}

function buildCommonValues(instance) {
	return {
		alias: instance.alias || '',
		device_name: (instance.STATE.device_name || '').trim(),
		ip: instance.STATE.ip || instance.config?.host || '',
		firmware_version: (instance.STATE.firmware_version || '').trim(),
		hardware_version: (instance.STATE.hardware_version || '').trim(),
		serial_number: (instance.STATE.serial_number || '').trim(),
		software_version: (instance.STATE.software_version || '').trim(),
	}
}

function buildDecoderValues(instance) {
	const values = {}
	const labels = instance.STREAM_STATUS_LABELS || {}

	if (Array.isArray(instance.STATE.outputs)) {
		instance.STATE.outputs.forEach((output) => {
			const id = String(output.id)
			const layout = instance.STATE.layouts?.find((l) => l.layout_id === output.layout_id)

			values[`output_${id}_name`] = output.name || ''
			values[`output_${id}_layout_id`] = output.layout_id ?? ''
			values[`output_${id}_layout_name`] = layout?.name || ''
			values[`output_${id}_resolution`] = output.res_name || ''
			values[`output_${id}_modified`] = output.modified ? 'Yes' : 'No'

			const detail = instance.STATE.output_details?.[id]
			if (detail?.position) {
				detail.position.forEach((pos) => {
					const posId = pos.id
					values[`output_${id}_pos_${posId}_stream_name`] = pos.stream_name || ''
					values[`output_${id}_pos_${posId}_stream_status`] =
						labels[pos.status] || String(pos.status ?? '')
					values[`output_${id}_pos_${posId}_resolution`] = pos.resolution || ''
				})
			}
		})
	}

	if (Array.isArray(instance.STATE.preview)) {
		instance.STATE.preview.forEach((slot) => {
			const id = slot.id
			values[`preview_${id}_stream_name`] = slot.stream_name || ''
			values[`preview_${id}_stream_status`] = labels[slot.status] || String(slot.status ?? '')
		})
	}

	return values
}

function buildGatewayValues(instance) {
	const state = instance.STATE
	return {
		output_name: state.output_name || '',
		mute_status: state.mute_status === '1' ? 'Muted' : state.mute_status === '0' ? 'Unmuted' : '',
		output_resolution: state.output_resolution || '',
		background_type: state.background_type || '',
		guide_status: state.guide_status || '',
		sources_count: state.sources_count || 0,
		layouts_count: state.layouts_count || 0,
		gateway_streams_count: state.gateway_streams_count || 0,
		group_list: state.group_list || '',
		layout_list: state.layout_list || '',
		gateway_stream_list: state.gateway_stream_list || '',
		mem_used:
			state.mem_total !== undefined && state.mem_total !== ''
				? state.mem_used + 'KB'
				: state.mem_used !== undefined && state.mem_used !== ''
					? String(state.mem_used) + '%'
					: '',
		mem_total: state.mem_total !== undefined && state.mem_total !== '' ? state.mem_total + 'KB' : '',
		cpu_usage: state.cpu_usage !== undefined ? state.cpu_usage + '%' : '',
		uptime: state.uptime !== undefined ? String(state.uptime) : '',
	}
}

function buildVariableValues(instance) {
	const values = buildCommonValues(instance)
	if (instance.isDecoder()) {
		Object.assign(values, buildDecoderValues(instance))
	} else if (instance.isGateway()) {
		Object.assign(values, buildGatewayValues(instance))
	}
	return values
}

module.exports = {
	buildVariables,
	buildVariableValues,

	initVariables() {
		this.setVariableDefinitions(buildVariables(this))
	},

	checkVariables() {
		try {
			this.setVariableValues(buildVariableValues(this))
		} catch (error) {
			this.log('error', 'Error setting Variables: ' + String(error))
		}
	},
}
