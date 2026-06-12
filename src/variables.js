module.exports = {
	initVariables() {
		const self = this
		const variables = []

		variables.push({ variableId: 'alias', name: 'Authorized User' })
		variables.push({ variableId: 'device_name', name: 'Device Name' })
		variables.push({ variableId: 'firmware_version', name: 'Firmware Version' })
		variables.push({ variableId: 'hardware_version', name: 'Hardware Version' })
		variables.push({ variableId: 'serial_number', name: 'Serial Number' })
		variables.push({ variableId: 'software_version', name: 'Software Version' })

		if (Array.isArray(self.STATE.outputs)) {
			self.STATE.outputs.forEach((output) => {
				const id = String(output.id)
				variables.push({ variableId: `output_${id}_name`, name: `Output ${id} Name` })
				variables.push({ variableId: `output_${id}_layout_id`, name: `Output ${id} Layout ID` })
				variables.push({ variableId: `output_${id}_layout_name`, name: `Output ${id} Layout Name` })
				variables.push({ variableId: `output_${id}_resolution`, name: `Output ${id} Resolution` })
				variables.push({ variableId: `output_${id}_modified`, name: `Output ${id} Layout Modified` })

				const detail = self.STATE.output_details?.[id]
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

		if (Array.isArray(self.STATE.preview)) {
			self.STATE.preview.forEach((slot) => {
				const id = slot.id
				variables.push({ variableId: `preview_${id}_stream_name`, name: `Preview ${id} Stream Name` })
				variables.push({ variableId: `preview_${id}_stream_status`, name: `Preview ${id} Stream Status` })
			})
		}

		self.setVariableDefinitions(variables)
	},

	checkVariables() {
		const self = this
		const values = {}

		values.alias = self.alias || ''
		values.device_name = (self.STATE.device_name || '').trim()
		values.firmware_version = self.STATE.firmware_version || ''
		values.hardware_version = self.STATE.hardware_version || ''
		values.serial_number = self.STATE.serial_number || ''
		values.software_version = self.STATE.software_version || ''

		if (Array.isArray(self.STATE.outputs)) {
			self.STATE.outputs.forEach((output) => {
				const id = String(output.id)
				const layout = self.STATE.layouts.find((l) => l.layout_id === output.layout_id)

				values[`output_${id}_name`] = output.name || ''
				values[`output_${id}_layout_id`] = output.layout_id ?? ''
				values[`output_${id}_layout_name`] = layout?.name || ''
				values[`output_${id}_resolution`] = output.res_name || ''
				values[`output_${id}_modified`] = output.modified ? 'Yes' : 'No'

				const detail = self.STATE.output_details?.[id]
				if (detail?.position) {
					detail.position.forEach((pos) => {
						const posId = pos.id
						values[`output_${id}_pos_${posId}_stream_name`] = pos.stream_name || ''
						values[`output_${id}_pos_${posId}_stream_status`] =
							self.STREAM_STATUS_LABELS[pos.status] || String(pos.status ?? '')
						values[`output_${id}_pos_${posId}_resolution`] = pos.resolution || ''
					})
				}
			})
		}

		if (Array.isArray(self.STATE.preview)) {
			self.STATE.preview.forEach((slot) => {
				const id = slot.id
				values[`preview_${id}_stream_name`] = slot.stream_name || ''
				values[`preview_${id}_stream_status`] =
					self.STREAM_STATUS_LABELS[slot.status] || String(slot.status ?? '')
			})
		}

		self.setVariableValues(values)
	},
}
