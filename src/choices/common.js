/**
 * Common dynamic choices update logic.
 * Migrated from companion-module-kiloview-decoder/src/api.js updateDynamicChoices.
 * Shared by both decoder and gateway profiles.
 */
const { CHOICES_VIDEO_INTERFACES, CHOICES_AUDIO_INTERFACES } = require('../constants')

function buildOutputInterfaceChoices(outputs, interfacesState, fallbackInterfaces) {
	const choices = []
	outputs.forEach((output) => {
		const list = interfacesState?.[output.id]
		const intfs =
			Array.isArray(list) && list.length > 0
				? list.filter((intf) => intf.visible !== false)
				: fallbackInterfaces.map((intf) => ({ id: intf.id, label: intf.label }))

		intfs.forEach((intf) => {
			choices.push({
				id: `${output.id}:${intf.id}`,
				label: `${output.label} - ${intf.label}`,
				output_id: output.id,
				intf_id: String(intf.id),
			})
		})
	})
	return choices
}

function updateDecoderChoices(instance) {
	const outputs = []
	if (Array.isArray(instance.STATE.outputs)) {
		instance.STATE.outputs.forEach((output) => {
			outputs.push({ id: String(output.id), label: output.name || `Output ${output.id}` })
		})
	}
	if (outputs.length === 0) outputs.push({ id: '1', label: 'Output 1' })

	const layouts = []
	if (Array.isArray(instance.STATE.layouts)) {
		instance.STATE.layouts.forEach((layout) => {
			layouts.push({ id: String(layout.layout_id), label: layout.name || `Layout ${layout.layout_id}` })
		})
	}
	if (layouts.length === 0) layouts.push({ id: '1', label: 'Single' })

	const outputLayouts = []
	outputs.forEach((output) => {
		layouts.forEach((layout) => {
			outputLayouts.push({
				id: `${output.id}:${layout.id}`,
				label: `${output.label} - ${layout.label}`,
				output_id: output.id,
				layout_id: layout.id,
			})
		})
	})
	if (outputLayouts.length === 0) outputLayouts.push({ id: '1:1', label: 'Output 1 - Single' })

	const positionsByOutput = {}
	const outputPositions = []
	if (Array.isArray(instance.STATE.outputs)) {
		instance.STATE.outputs.forEach((output) => {
			const outputId = String(output.id)
			const outputLabel = output.name || `Output ${output.id}`
			const detail = instance.STATE.output_details?.[outputId]
			const outputPosChoices = []
			if (detail?.position) {
				detail.position.forEach((pos) => {
					outputPosChoices.push({ id: String(pos.id), label: `Position ${pos.number || pos.id}` })
					outputPositions.push({
						id: `${outputId}:${pos.id}`,
						label: `${outputLabel} - Position ${pos.number || pos.id}`,
						output_id: outputId,
						pos_id: pos.id,
					})
				})
			}
			if (outputPosChoices.length === 0) {
				for (let i = 1; i <= 4; i++) {
					outputPosChoices.push({ id: String(i), label: `Position ${i}` })
					outputPositions.push({ id: `${outputId}:${i}`, label: `${outputLabel} - Position ${i}` })
				}
			}
			positionsByOutput[outputId] = outputPosChoices
		})
	}

	const positions = []
	const defaultOutput = instance.STATE.output_details?.['1']
	if (defaultOutput?.position) {
		defaultOutput.position.forEach((pos) => {
			positions.push({ id: String(pos.id), label: `Position ${pos.number || pos.id}` })
		})
	}
	if (positions.length === 0) {
		for (let i = 1; i <= 9; i++) positions.push({ id: String(i), label: `Position ${i}` })
	}
	if (Object.keys(positionsByOutput).length === 0) {
		positionsByOutput['1'] = positions.slice(0, 4)
		positionsByOutput['2'] = positions.slice(0, 4)
	}
	if (outputPositions.length === 0) {
		for (let i = 1; i <= 4; i++) {
			outputPositions.push({ id: `1:${i}`, label: `Output 1 - Position ${i}` })
			outputPositions.push({ id: `2:${i}`, label: `Output 2 - Position ${i}` })
		}
	}

	const resolutions = []
	if (Array.isArray(instance.STATE.resolutions)) {
		instance.STATE.resolutions.forEach((res) => {
			resolutions.push({ id: String(res.id), label: res.name || res.value })
		})
	}
	if (resolutions.length === 0) resolutions.push({ id: '5', label: '1920x1080P60' })

	const previewSlots = [{ id: '', label: 'Auto (append)' }]
	if (Array.isArray(instance.STATE.preview)) {
		instance.STATE.preview.forEach((slot) => {
			previewSlots.push({
				id: String(slot.id),
				label: slot.stream_name ? `Preview ${slot.id}: ${slot.stream_name}` : `Preview ${slot.id}`,
			})
		})
	}

	const outputVideoInterfaces = buildOutputInterfaceChoices(
		outputs,
		instance.STATE.video_interfaces,
		CHOICES_VIDEO_INTERFACES
	)
	const outputAudioInterfaces = buildOutputInterfaceChoices(
		outputs,
		instance.STATE.audio_interfaces,
		CHOICES_AUDIO_INTERFACES
	)

	const changed =
		JSON.stringify(instance.CHOICES_OUTPUTS) !== JSON.stringify(outputs) ||
		JSON.stringify(instance.CHOICES_LAYOUTS) !== JSON.stringify(layouts) ||
		JSON.stringify(instance.CHOICES_OUTPUT_LAYOUTS) !== JSON.stringify(outputLayouts) ||
		JSON.stringify(instance.CHOICES_POSITIONS) !== JSON.stringify(positions) ||
		JSON.stringify(instance.CHOICES_POSITIONS_BY_OUTPUT) !== JSON.stringify(positionsByOutput) ||
		JSON.stringify(instance.CHOICES_OUTPUT_POSITIONS) !== JSON.stringify(outputPositions) ||
		JSON.stringify(instance.CHOICES_RESOLUTIONS) !== JSON.stringify(resolutions) ||
		JSON.stringify(instance.CHOICES_PREVIEW_SLOTS) !== JSON.stringify(previewSlots) ||
		JSON.stringify(instance.CHOICES_OUTPUT_VIDEO_INTERFACES) !== JSON.stringify(outputVideoInterfaces) ||
		JSON.stringify(instance.CHOICES_OUTPUT_AUDIO_INTERFACES) !== JSON.stringify(outputAudioInterfaces)

	instance.CHOICES_OUTPUTS = outputs
	instance.CHOICES_LAYOUTS = layouts
	instance.CHOICES_OUTPUT_LAYOUTS = outputLayouts
	instance.CHOICES_POSITIONS = positions
	instance.CHOICES_POSITIONS_BY_OUTPUT = positionsByOutput
	instance.CHOICES_OUTPUT_POSITIONS = outputPositions
	instance.CHOICES_RESOLUTIONS = resolutions
	instance.CHOICES_PREVIEW_SLOTS = previewSlots
	instance.CHOICES_OUTPUT_VIDEO_INTERFACES =
		outputVideoInterfaces.length > 0 ? outputVideoInterfaces : [{ id: '1:1', label: 'Output 1 - HDMI 1' }]
	instance.CHOICES_OUTPUT_AUDIO_INTERFACES =
		outputAudioInterfaces.length > 0 ? outputAudioInterfaces : [{ id: '1:1', label: 'Output 1 - HDMI 1' }]

	return changed
}

function updateSourceChoices(instance, streamsArray, groupsArray, streamsByGroup) {
	const changed =
		JSON.stringify(instance.CHOICES_STREAMS) !== JSON.stringify(streamsArray) ||
		JSON.stringify(instance.CHOICES_GROUPS) !== JSON.stringify(groupsArray) ||
		JSON.stringify(instance.CHOICES_STREAMS_BY_GROUP) !== JSON.stringify(streamsByGroup)

	if (changed) {
		instance.CHOICES_STREAMS = streamsArray
		instance.CHOICES_GROUPS = groupsArray
		instance.CHOICES_STREAMS_BY_GROUP = streamsByGroup
	}

	return changed
}

module.exports = { updateDecoderChoices, updateSourceChoices, buildOutputInterfaceChoices }
