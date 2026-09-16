/**
 * Field constructors for action/feedback options.
 * Migrated from companion-module-kiloview-decoder/src/choiceHelpers.js.
 *
 * Provides dynamic show/hide fields (isVisibleExpression) so that
 * Position dropdowns only show positions for the selected Output,
 * and Stream dropdowns only show streams for the selected Group.
 */

function getDefaultOutputId(instance) {
	return instance.CHOICES_OUTPUTS[0]?.id || '1'
}

function getDefaultGroupId(instance) {
	const group = instance.CHOICES_GROUPS.find((g) => g.id !== 'null')
	return group?.id || 'null'
}

function escapeOptionExpression(value) {
	return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function getPositionChoicesForOutput(instance, outputId) {
	const positions = instance.CHOICES_POSITIONS_BY_OUTPUT?.[String(outputId)]
	if (positions?.length) return positions
	return instance.CHOICES_POSITIONS
}

function getStreamChoicesForGroup(instance, groupId) {
	const streams = instance.CHOICES_STREAMS_BY_GROUP?.[groupId]
	if (streams?.length) return streams
	return [{ id: 'null', label: '- No streams in group -' }]
}

function findStream(instance, streamId) {
	return (
		instance.CHOICES_STREAMS.find((s) => s.id === streamId) ||
		instance.STATE.sources.find((s) => s.id === streamId)
	)
}

/**
 * Build dynamic Output + Position dropdown fields.
 * Position dropdown only shows positions for the selected Output.
 */
function buildOutputPositionFields(instance) {
	const fields = [
		{
			type: 'dropdown',
			label: 'Output',
			id: 'output_id',
			default: getDefaultOutputId(instance),
			choices: instance.CHOICES_OUTPUTS,
		},
	]

	instance.CHOICES_OUTPUTS.forEach((output) => {
		const positions = getPositionChoicesForOutput(instance, output.id)
		fields.push({
			type: 'dropdown',
			label: 'Position',
			id: String(output.id),
			default: positions[0]?.id ?? '1',
			choices: positions,
			isVisibleExpression: `$(options:output_id) == "${escapeOptionExpression(output.id)}"`,
		})
	})

	return fields
}

/**
 * Build dynamic Group + Stream dropdown fields.
 * Stream dropdown only shows streams for the selected Group.
 * minChoicesForSearch: 8 enables search for long lists.
 */
function buildGroupStreamFields(instance, streamLabel = 'Stream', options = {}) {
	const fields = [
		{
			type: 'dropdown',
			label: 'Source Group',
			id: 'group_id',
			default: getDefaultGroupId(instance),
			choices: instance.CHOICES_GROUPS,
		},
	]

	instance.CHOICES_GROUPS.forEach((group) => {
		if (group.id === 'null') return

		let streams = getStreamChoicesForGroup(instance, group.id)

		// Option: only show active/playing streams (for stopStreamPlayback, stopPush)
		if (options.activeOnly && instance.CHOICES_ACTIVE_STREAMS) {
			const activeIds = new Set(instance.CHOICES_ACTIVE_STREAMS.map((s) => s.id))
			streams = streams.filter((s) => activeIds.has(s.id))
			if (streams.length === 0) {
				streams = [{ id: 'null', label: '- No active streams -' }]
			}
		}

		const defaultStream = streams.find((s) => s.id !== 'null')?.id || streams[0]?.id || 'null'
		fields.push({
			type: 'dropdown',
			label: streamLabel,
			id: String(group.id),
			default: defaultStream,
			choices: streams,
			minChoicesForSearch: 8,
			isVisibleExpression: `$(options:group_id) == "${escapeOptionExpression(group.id)}"`,
		})
	})

	return fields
}

function buildOutputField(instance) {
	return {
		type: 'dropdown',
		label: 'Output',
		id: 'output_id',
		default: getDefaultOutputId(instance),
		choices: instance.CHOICES_OUTPUTS,
	}
}

/**
 * Build a Layout dropdown that marks the current layout as (Active).
 */
function buildLayoutField(instance, outputId) {
	const layouts = instance.CHOICES_LAYOUTS.map((l) => {
		const currentLayoutId = instance.STATE.outputs?.find((o) => String(o.id) === String(outputId))?.layout_id
		if (currentLayoutId !== undefined && String(l.id) === String(currentLayoutId)) {
			return { ...l, label: `${l.label} (Active)` }
		}
		return l
	})
	return {
		type: 'dropdown',
		label: 'Layout',
		id: 'layout_id',
		default: instance.CHOICES_LAYOUTS[0]?.id || '1',
		choices: layouts,
	}
}

/**
 * Build a Resolution dropdown that marks the current resolution as (Active).
 */
function buildResolutionField(instance, outputId) {
	const resolutions = instance.CHOICES_RESOLUTIONS.map((r) => {
		const output = instance.STATE.outputs?.find((o) => String(o.id) === String(outputId))
		if (output && String(output.res_id) === String(r.id)) {
			return { ...r, label: `${r.label} (Active)` }
		}
		return r
	})
	return {
		type: 'dropdown',
		label: 'Resolution',
		id: 'res_id',
		default: instance.CHOICES_RESOLUTIONS[0]?.id || '5',
		choices: resolutions,
	}
}

/**
 * Build a matchTrue/matchFalse toggle for boolean feedbacks.
 * Borrowed from MG's muteStatus design — lets user choose
 * "highlight when true" or "highlight when false".
 */
function buildMatchToggle() {
	return {
		type: 'dropdown',
		label: 'Highlight When',
		id: 'match',
		default: 'true',
		choices: [
			{ id: 'true', label: 'Condition is True' },
			{ id: 'false', label: 'Condition is False' },
		],
	}
}

function resolveOutputPosition(instance, options) {
	const outputId = options.output_id
	if (!outputId) return null

	const posId = options[String(outputId)]
	if (posId === undefined || posId === null || posId === '') return null

	const detail = instance.STATE.output_details?.[String(outputId)]
	if (detail?.position) {
		const pos = detail.position.find((p) => String(p.id) === String(posId))
		if (!pos) {
			instance.log('warn', `Position ${posId} is not available on output ${outputId}`)
			return null
		}
	}

	return { output_id: outputId, pos_id: posId }
}

function resolveStream(instance, options) {
	const groupId = options.group_id
	if (!groupId || groupId === 'null') return null

	const streamId = options[String(groupId)]
	if (!streamId || streamId === 'null') return null

	const stream = findStream(instance, streamId)
	if (!stream) {
		instance.log('warn', 'Stream not found; refresh sources and try again')
		return null
	}
	if (String(stream.group_id) !== String(groupId)) {
		instance.log('warn', 'Selected stream does not belong to the selected source group')
		return null
	}

	return { group_id: groupId, stream_id: streamId }
}

module.exports = {
	getDefaultOutputId,
	getDefaultGroupId,
	escapeOptionExpression,
	getPositionChoicesForOutput,
	getStreamChoicesForGroup,
	findStream,
	buildOutputPositionFields,
	buildGroupStreamFields,
	buildOutputField,
	buildLayoutField,
	buildResolutionField,
	buildMatchToggle,
	resolveOutputPosition,
	resolveStream,
}
