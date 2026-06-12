const { combineRgb } = require('@companion-module/base')

module.exports = {
	initFeedbacks() {
		const self = this
		const feedbacks = {}

		const colorWhite = combineRgb(255, 255, 255)
		const colorRed = combineRgb(255, 0, 0)
		const colorGreen = combineRgb(0, 255, 0)

		feedbacks.currentLayout = {
			type: 'boolean',
			name: 'Output Layout Active',
			description: 'Highlight when the selected layout is active on the output',
			defaultStyle: {
				color: colorWhite,
				bgcolor: colorRed,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Layout',
					id: 'layout_id',
					default: self.CHOICES_LAYOUTS[0]?.id || '1',
					choices: self.CHOICES_LAYOUTS,
				},
			],
			callback: (feedback) => {
				const output = self.STATE.outputs.find((o) => String(o.id) === String(feedback.options.output_id))
				if (!output) {
					return false
				}
				return String(output.layout_id) === String(feedback.options.layout_id)
			},
		}

		feedbacks.streamConnected = {
			type: 'boolean',
			name: 'Position Stream Connected',
			description: 'Highlight when the position has an active connected stream',
			defaultStyle: {
				color: colorWhite,
				bgcolor: colorGreen,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Position',
					id: 'pos_id',
					default: self.CHOICES_POSITIONS[0]?.id || 1,
					choices: self.CHOICES_POSITIONS,
				},
			],
			callback: (feedback) => {
				const detail = self.STATE.output_details?.[String(feedback.options.output_id)]
				if (!detail?.position) {
					return false
				}
				const pos = detail.position.find((p) => String(p.id) === String(feedback.options.pos_id))
				return !!pos?.stream_id && pos.status === 2
			},
		}

		feedbacks.streamNameMatch = {
			type: 'boolean',
			name: 'Position Stream Name Match',
			description: 'Highlight when the position is playing the selected stream',
			defaultStyle: {
				color: colorWhite,
				bgcolor: colorGreen,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Position',
					id: 'pos_id',
					default: self.CHOICES_POSITIONS[0]?.id || 1,
					choices: self.CHOICES_POSITIONS,
				},
				{
					type: 'dropdown',
					label: 'Stream',
					id: 'stream_id',
					default: self.CHOICES_STREAMS[0]?.id || 'null',
					choices: self.CHOICES_STREAMS,
				},
			],
			callback: (feedback) => {
				const detail = self.STATE.output_details?.[String(feedback.options.output_id)]
				if (!detail?.position) {
					return false
				}
				const pos = detail.position.find((p) => String(p.id) === String(feedback.options.pos_id))
				return pos?.stream_id === feedback.options.stream_id
			},
		}

		feedbacks.resolutionMatch = {
			type: 'boolean',
			name: 'Output Resolution Match',
			description: 'Highlight when the output resolution matches the selected value',
			defaultStyle: {
				color: colorWhite,
				bgcolor: colorGreen,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Resolution',
					id: 'res_id',
					default: self.CHOICES_RESOLUTIONS[0]?.id || '5',
					choices: self.CHOICES_RESOLUTIONS,
				},
			],
			callback: (feedback) => {
				const output = self.STATE.outputs.find((o) => String(o.id) === String(feedback.options.output_id))
				if (!output) {
					return false
				}
				return String(output.res_id) === String(feedback.options.res_id)
			},
		}

		feedbacks.layoutModified = {
			type: 'boolean',
			name: 'Output Layout Modified',
			description: 'Highlight when the output layout has unsaved changes',
			defaultStyle: {
				color: colorWhite,
				bgcolor: combineRgb(255, 165, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
			],
			callback: (feedback) => {
				const output = self.STATE.outputs.find((o) => String(o.id) === String(feedback.options.output_id))
				return output?.modified === true
			},
		}

		feedbacks.previewStreamConnected = {
			type: 'boolean',
			name: 'Preview Stream Connected',
			description: 'Highlight when a preview slot has a connected stream',
			defaultStyle: {
				color: colorWhite,
				bgcolor: colorGreen,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Preview Slot',
					id: 'pos_id',
					default: self.CHOICES_PREVIEW_SLOTS[0]?.id || 1,
					choices: self.CHOICES_PREVIEW_SLOTS,
				},
			],
			callback: (feedback) => {
				const slot = self.STATE.preview.find((p) => String(p.id) === String(feedback.options.pos_id))
				return !!slot?.stream_id && slot.status === 2
			},
		}

		feedbacks.previewStreamMatch = {
			type: 'boolean',
			name: 'Preview Stream Match',
			description: 'Highlight when a preview slot plays the selected stream',
			defaultStyle: {
				color: colorWhite,
				bgcolor: colorGreen,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Preview Slot',
					id: 'pos_id',
					default: self.CHOICES_PREVIEW_SLOTS[0]?.id || 1,
					choices: self.CHOICES_PREVIEW_SLOTS,
				},
				{
					type: 'dropdown',
					label: 'Stream',
					id: 'stream_id',
					default: self.CHOICES_STREAMS[0]?.id || 'null',
					choices: self.CHOICES_STREAMS,
				},
			],
			callback: (feedback) => {
				const slot = self.STATE.preview.find((p) => String(p.id) === String(feedback.options.pos_id))
				return slot?.stream_id === feedback.options.stream_id
			},
		}

		feedbacks.audiomixEnabled = {
			type: 'boolean',
			name: 'Audiomix Stream Enabled',
			description: 'Highlight when a stream is enabled in the audiomix panel',
			defaultStyle: {
				color: colorWhite,
				bgcolor: colorGreen,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output_id',
					default: self.CHOICES_OUTPUTS[0]?.id || '1',
					choices: self.CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Stream',
					id: 'stream_id',
					default: self.CHOICES_STREAMS[0]?.id || 'null',
					choices: self.CHOICES_STREAMS,
				},
				{
					type: 'dropdown',
					label: 'Mix Type',
					id: 'mix_type',
					default: 'output',
					choices: self.CHOICES_AUDIOMIX_TYPES,
				},
			],
			callback: (feedback) => {
				const mix = self.STATE.audiomix[String(feedback.options.output_id)]
				if (!mix) {
					return false
				}
				const list = mix[feedback.options.mix_type] || []
				const item = list.find((s) => s.stream_id === feedback.options.stream_id)
				return item?.enable === true
			},
		}

		self.setFeedbackDefinitions(feedbacks)
	},
}
