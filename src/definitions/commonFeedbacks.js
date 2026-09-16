const { combineRgb } = require('@companion-module/base')
const { buildMatchToggle, buildResolutionField } = require('../fields/optionFields')

/**
 * Common Feedbacks (1): registered for both decoder and gateway profiles.
 */
function buildFeedbacks(instance) {
	const feedbacks = {}

	feedbacks.resolutionMatch = {
		type: 'boolean',
		name: 'Output Resolution Match',
		description: 'Highlight when the output resolution matches the selected value (current marked as Active)',
		defaultStyle: { color: combineRgb(255, 255, 255), bgcolor: combineRgb(0, 255, 0) },
		options: [
			{
				type: 'dropdown',
				label: 'Output',
				id: 'output_id',
				default: instance.CHOICES_OUTPUTS[0]?.id || '1',
				choices: instance.CHOICES_OUTPUTS,
			},
			buildResolutionField(instance, instance.CHOICES_OUTPUTS[0]?.id || '1'),
			buildMatchToggle(),
		],
		callback: (feedback) => {
			const opts = feedback.options
			const output = instance.STATE.outputs?.find((o) => String(o.id) === String(opts.output_id))
			if (!output) return false

			const match = String(output.res_id) === String(opts.res_id)
			return opts.match === 'false' ? !match : match
		},
	}

	return feedbacks
}

module.exports = { buildFeedbacks }
