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
				const output = self.STATE.outputs.find(
					(o) => String(o.id) === String(feedback.options.output_id)
				)
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
			options: [...self.buildOutputPositionFields(self)],
			callback: (feedback) => {
				const position = self.resolveOutputPosition(self, feedback.options)
				if (!position) {
					return false
				}
				const detail = self.STATE.output_details?.[String(position.output_id)]
				if (!detail?.position) {
					return false
				}
				const pos = detail.position.find((p) => String(p.id) === String(position.pos_id))
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
				...self.buildOutputPositionFields(self),
				...self.buildGroupStreamFields(self),
			],
			callback: (feedback) => {
				const position = self.resolveOutputPosition(self, feedback.options)
				const streamSelection = self.resolveStream(self, feedback.options)
				if (!position || !streamSelection) {
					return false
				}
				const detail = self.STATE.output_details?.[String(position.output_id)]
				if (!detail?.position) {
					return false
				}
				const pos = detail.position.find((p) => String(p.id) === String(position.pos_id))
				return pos?.stream_id === streamSelection.stream_id
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
				...self.buildGroupStreamFields(self),
			],
			callback: (feedback) => {
				const streamSelection = self.resolveStream(self, feedback.options)
				if (!streamSelection) {
					return false
				}
				const slot = self.STATE.preview.find((p) => String(p.id) === String(feedback.options.pos_id))
				return slot?.stream_id === streamSelection.stream_id
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
					default: self.getDefaultOutputId(self),
					choices: self.CHOICES_OUTPUTS,
				},
				...self.buildGroupStreamFields(self),
				{
					type: 'dropdown',
					label: 'Mix Type',
					id: 'mix_type',
					default: 'output',
					choices: self.CHOICES_AUDIOMIX_TYPES,
				},
			],
			callback: (feedback) => {
				const streamSelection = self.resolveStream(self, feedback.options)
				if (!streamSelection) {
					return false
				}
				const mix = self.STATE.audiomix[String(feedback.options.output_id)]
				if (!mix) {
					return false
				}
				const list = mix[feedback.options.mix_type] || []
				const item = list.find((s) => s.stream_id === streamSelection.stream_id)
				return item?.enable === true
			},
		}

		feedbacks.videoInterfaceEnabled = {
			type: 'boolean',
			name: 'Video Interface Enabled',
			description: 'Highlight when HDMI/SDI interface is enabled on an output',
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
					label: 'Interface',
					id: 'intf_id',
					default: '1',
					choices: self.CHOICES_VIDEO_INTERFACES,
				},
			],
			callback: (feedback) => {
				const list = self.STATE.video_interfaces[String(feedback.options.output_id)]
				if (!Array.isArray(list)) {
					return false
				}
				const intf = list.find((i) => String(i.id) === String(feedback.options.intf_id))
				return intf?.enable === true
			},
		}

		feedbacks.audioInterfaceEnabled = {
			type: 'boolean',
			name: 'Audio Interface Enabled',
			description: 'Highlight when HDMI/SDI/Line Out audio interface is enabled',
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
					label: 'Interface',
					id: 'intf_id',
					default: '1',
					choices: self.CHOICES_AUDIO_INTERFACES,
				},
			],
			callback: (feedback) => {
				const list = self.STATE.audio_interfaces[String(feedback.options.output_id)]
				if (!Array.isArray(list)) {
					return false
				}
				const intf = list.find((i) => String(i.id) === String(feedback.options.intf_id))
				return intf?.enable === true
			},
		}

		feedbacks.audioInterfaceMuted = {
			type: 'boolean',
			name: 'Audio Interface Muted',
			description: 'Highlight when an audio output interface is muted',
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
					label: 'Interface',
					id: 'intf_id',
					default: '1',
					choices: self.CHOICES_AUDIO_INTERFACES,
				},
			],
			callback: (feedback) => {
				const list = self.STATE.audio_interfaces[String(feedback.options.output_id)]
				if (!Array.isArray(list)) {
					return false
				}
				const intf = list.find((i) => String(i.id) === String(feedback.options.intf_id))
				return intf?.mute === true
			},
		}

		self.setFeedbackDefinitions(feedbacks)
	},
}
