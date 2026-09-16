const { combineRgb } = require('@companion-module/base')
const {
	buildOutputPositionFields,
	buildGroupStreamFields,
	buildOutputField,
	buildLayoutField,
	buildMatchToggle,
	getDefaultOutputId,
	resolveOutputPosition,
	resolveStream,
} = require('../fields/optionFields')

/**
 * Decoder Feedbacks (10): registered only for the decoder profile.
 * Migrated from companion-module-kiloview-decoder/src/feedbacks.js (excludes
 * resolutionMatch, which was promoted to common). All boolean feedbacks add a
 * matchTrue/matchFalse toggle so users can invert the highlight condition.
 */
function buildFeedbacks(instance) {
	const feedbacks = {}

	const colorWhite = combineRgb(255, 255, 255)
	const colorRed = combineRgb(255, 0, 0)
	const colorGreen = combineRgb(0, 255, 0)
	const colorOrange = combineRgb(255, 165, 0)

	feedbacks.currentLayout = {
		type: 'boolean',
		name: 'Output Layout Active',
		description: 'Highlight when the selected layout is active on the output',
		defaultStyle: { color: colorWhite, bgcolor: colorRed },
		options: [
			buildOutputField(instance),
			buildLayoutField(instance, getDefaultOutputId(instance)),
			buildMatchToggle(),
		],
		callback: (feedback) => {
			const opts = feedback.options
			const output = instance.STATE.outputs?.find((o) => String(o.id) === String(opts.output_id))
			if (!output) return false
			const match = String(output.layout_id) === String(opts.layout_id)
			return opts.match === 'false' ? !match : match
		},
	}

	feedbacks.streamConnected = {
		type: 'boolean',
		name: 'Position Stream Connected',
		description: 'Highlight when the position has an active connected stream',
		defaultStyle: { color: colorWhite, bgcolor: colorGreen },
		options: [...buildOutputPositionFields(instance), buildMatchToggle()],
		callback: (feedback) => {
			const opts = feedback.options
			const position = resolveOutputPosition(instance, opts)
			if (!position) return false
			const detail = instance.STATE.output_details?.[String(position.output_id)]
			if (!detail?.position) return false
			const pos = detail.position.find((p) => String(p.id) === String(position.pos_id))
			const match = !!pos?.stream_id && pos.status === 2
			return opts.match === 'false' ? !match : match
		},
	}

	feedbacks.streamNameMatch = {
		type: 'boolean',
		name: 'Position Stream Name Match',
		description: 'Highlight when the position is playing the selected stream',
		defaultStyle: { color: colorWhite, bgcolor: colorGreen },
		options: [...buildOutputPositionFields(instance), ...buildGroupStreamFields(instance), buildMatchToggle()],
		callback: (feedback) => {
			const opts = feedback.options
			const position = resolveOutputPosition(instance, opts)
			const streamSelection = resolveStream(instance, opts)
			if (!position || !streamSelection) return false
			const detail = instance.STATE.output_details?.[String(position.output_id)]
			if (!detail?.position) return false
			const pos = detail.position.find((p) => String(p.id) === String(position.pos_id))
			const match = pos?.stream_id === streamSelection.stream_id
			return opts.match === 'false' ? !match : match
		},
	}

	feedbacks.layoutModified = {
		type: 'boolean',
		name: 'Output Layout Modified',
		description: 'Highlight when the output layout has unsaved changes',
		defaultStyle: { color: colorWhite, bgcolor: colorOrange },
		options: [buildOutputField(instance), buildMatchToggle()],
		callback: (feedback) => {
			const opts = feedback.options
			const output = instance.STATE.outputs?.find((o) => String(o.id) === String(opts.output_id))
			const match = output?.modified === true
			return opts.match === 'false' ? !match : match
		},
	}

	feedbacks.previewStreamConnected = {
		type: 'boolean',
		name: 'Preview Stream Connected',
		description: 'Highlight when a preview slot has a connected stream',
		defaultStyle: { color: colorWhite, bgcolor: colorGreen },
		options: [
			{
				type: 'dropdown',
				label: 'Preview Slot',
				id: 'pos_id',
				default: instance.CHOICES_PREVIEW_SLOTS.find((s) => s.id !== '')?.id ?? '1',
				choices: instance.CHOICES_PREVIEW_SLOTS,
			},
			buildMatchToggle(),
		],
		callback: (feedback) => {
			const opts = feedback.options
			const slot = instance.STATE.preview?.find((p) => String(p.id) === String(opts.pos_id))
			const match = !!slot?.stream_id && slot.status === 2
			return opts.match === 'false' ? !match : match
		},
	}

	feedbacks.previewStreamMatch = {
		type: 'boolean',
		name: 'Preview Stream Match',
		description: 'Highlight when a preview slot plays the selected stream',
		defaultStyle: { color: colorWhite, bgcolor: colorGreen },
		options: [
			{
				type: 'dropdown',
				label: 'Preview Slot',
				id: 'pos_id',
				default: instance.CHOICES_PREVIEW_SLOTS.find((s) => s.id !== '')?.id ?? '1',
				choices: instance.CHOICES_PREVIEW_SLOTS,
			},
			...buildGroupStreamFields(instance),
			buildMatchToggle(),
		],
		callback: (feedback) => {
			const opts = feedback.options
			const streamSelection = resolveStream(instance, opts)
			if (!streamSelection) return false
			const slot = instance.STATE.preview?.find((p) => String(p.id) === String(opts.pos_id))
			const match = slot?.stream_id === streamSelection.stream_id
			return opts.match === 'false' ? !match : match
		},
	}

	feedbacks.audiomixEnabled = {
		type: 'boolean',
		name: 'Audiomix Stream Enabled',
		description: 'Highlight when a stream is enabled in the audiomix panel',
		defaultStyle: { color: colorWhite, bgcolor: colorGreen },
		options: [
			buildOutputField(instance),
			...buildGroupStreamFields(instance),
			{
				type: 'dropdown',
				label: 'Mix Type',
				id: 'mix_type',
				default: 'output',
				choices: instance.CHOICES_AUDIOMIX_TYPES,
			},
			buildMatchToggle(),
		],
		callback: (feedback) => {
			const opts = feedback.options
			const streamSelection = resolveStream(instance, opts)
			if (!streamSelection) return false
			const mix = instance.STATE.audiomix[String(opts.output_id)]
			if (!mix) return false
			const list = mix[opts.mix_type] || []
			const item = list.find((s) => s.stream_id === streamSelection.stream_id)
			const match = item?.enable === true
			return opts.match === 'false' ? !match : match
		},
	}

	feedbacks.videoInterfaceEnabled = {
		type: 'boolean',
		name: 'Video Interface Enabled',
		description: 'Highlight when HDMI/SDI interface is enabled on an output',
		defaultStyle: { color: colorWhite, bgcolor: colorGreen },
		options: [
			buildOutputField(instance),
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'intf_id',
				default: '1',
				choices: instance.CHOICES_VIDEO_INTERFACES,
			},
			buildMatchToggle(),
		],
		callback: (feedback) => {
			const opts = feedback.options
			const list = instance.STATE.video_interfaces[String(opts.output_id)]
			if (!Array.isArray(list)) return false
			const intf = list.find((i) => String(i.id) === String(opts.intf_id))
			const match = intf?.enable === true
			return opts.match === 'false' ? !match : match
		},
	}

	feedbacks.audioInterfaceEnabled = {
		type: 'boolean',
		name: 'Audio Interface Enabled',
		description: 'Highlight when HDMI/SDI/Line Out audio interface is enabled',
		defaultStyle: { color: colorWhite, bgcolor: colorGreen },
		options: [
			buildOutputField(instance),
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'intf_id',
				default: '1',
				choices: instance.CHOICES_AUDIO_INTERFACES,
			},
			buildMatchToggle(),
		],
		callback: (feedback) => {
			const opts = feedback.options
			const list = instance.STATE.audio_interfaces[String(opts.output_id)]
			if (!Array.isArray(list)) return false
			const intf = list.find((i) => String(i.id) === String(opts.intf_id))
			const match = intf?.enable === true
			return opts.match === 'false' ? !match : match
		},
	}

	feedbacks.audioInterfaceMuted = {
		type: 'boolean',
		name: 'Audio Interface Muted',
		description: 'Highlight when an audio output interface is muted',
		defaultStyle: { color: colorWhite, bgcolor: colorRed },
		options: [
			buildOutputField(instance),
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'intf_id',
				default: '1',
				choices: instance.CHOICES_AUDIO_INTERFACES,
			},
			buildMatchToggle(),
		],
		callback: (feedback) => {
			const opts = feedback.options
			const list = instance.STATE.audio_interfaces[String(opts.output_id)]
			if (!Array.isArray(list)) return false
			const intf = list.find((i) => String(i.id) === String(opts.intf_id))
			const match = intf?.mute === true
			return opts.match === 'false' ? !match : match
		},
	}

	return feedbacks
}

module.exports = { buildFeedbacks }
