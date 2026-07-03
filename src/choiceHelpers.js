module.exports = {
	getDefaultOutputId(instance) {
		return instance.CHOICES_OUTPUTS[0]?.id || '1'
	},

	getDefaultGroupId(instance) {
		const group = instance.CHOICES_GROUPS.find((g) => g.id !== 'null')
		return group?.id || 'null'
	},

	escapeOptionExpression(value) {
		return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
	},

	getPositionChoicesForOutput(instance, outputId) {
		const positions = instance.CHOICES_POSITIONS_BY_OUTPUT?.[String(outputId)]
		if (positions?.length) {
			return positions
		}
		return instance.CHOICES_POSITIONS
	},

	getStreamChoicesForGroup(instance, groupId) {
		const streams = instance.CHOICES_STREAMS_BY_GROUP?.[groupId]
		if (streams?.length) {
			return streams
		}
		return [{ id: 'null', label: '- No streams in group -' }]
	},

	buildOutputPositionFields(instance) {
		const fields = [
			{
				type: 'dropdown',
				label: 'Output',
				id: 'output_id',
				default: this.getDefaultOutputId(instance),
				choices: instance.CHOICES_OUTPUTS,
			},
		]

		instance.CHOICES_OUTPUTS.forEach((output) => {
			const positions = this.getPositionChoicesForOutput(instance, output.id)
			fields.push({
				type: 'dropdown',
				label: 'Position',
				id: String(output.id),
				default: positions[0]?.id ?? 1,
				choices: positions,
				isVisibleExpression: `$(options:output_id) == "${this.escapeOptionExpression(output.id)}"`,
			})
		})

		return fields
	},

	buildGroupStreamFields(instance, streamLabel = 'Stream') {
		const fields = [
			{
				type: 'dropdown',
				label: 'Source Group',
				id: 'group_id',
				default: this.getDefaultGroupId(instance),
				choices: instance.CHOICES_GROUPS,
			},
		]

		instance.CHOICES_GROUPS.forEach((group) => {
			if (group.id === 'null') {
				return
			}
			const streams = this.getStreamChoicesForGroup(instance, group.id)
			const defaultStream = streams.find((s) => s.id !== 'null')?.id || streams[0]?.id || 'null'
			fields.push({
				type: 'dropdown',
				label: streamLabel,
				id: String(group.id),
				default: defaultStream,
				choices: streams,
				minChoicesForSearch: 8,
				isVisibleExpression: `$(options:group_id) == "${this.escapeOptionExpression(group.id)}"`,
			})
		})

		return fields
	},

	resolveOutputPosition(instance, options) {
		const outputId = options.output_id
		if (!outputId) {
			return null
		}

		const posId = options[String(outputId)]
		if (posId === undefined || posId === null || posId === '') {
			return null
		}

		const detail = instance.STATE.output_details?.[String(outputId)]
		if (detail?.position) {
			const pos = detail.position.find((p) => String(p.id) === String(posId))
			if (!pos) {
				instance.log('warn', `Position ${posId} is not available on output ${outputId}`)
				return null
			}
		}

		return { output_id: outputId, pos_id: posId }
	},

	resolveStream(instance, options) {
		const groupId = options.group_id
		if (!groupId || groupId === 'null') {
			return null
		}

		const streamId = options[String(groupId)]
		if (!streamId || streamId === 'null') {
			return null
		}

		const stream = this.findStream(instance, streamId)
		if (!stream) {
			instance.log('warn', 'Stream not found; refresh sources and try again')
			return null
		}
		if (String(stream.group_id) !== String(groupId)) {
			instance.log('warn', 'Selected stream does not belong to the selected source group')
			return null
		}

		return { group_id: groupId, stream_id: streamId }
	},

	findStream(instance, streamId) {
		return (
			instance.CHOICES_STREAMS.find((s) => s.id === streamId) ||
			instance.STATE.sources.find((s) => s.id === streamId)
		)
	},
}
