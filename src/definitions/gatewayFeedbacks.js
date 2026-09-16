const { combineRgb } = require('@companion-module/base')
const { buildMatchToggle } = require('../fields/optionFields')

/**
 * Gateway Feedbacks (3): registered only for the gateway profile.
 * Migrated from companion-module-kiloview-mediagateway/src/feedbacks.js
 * (excludes outputResolution, which was merged into the common resolutionMatch).
 * All boolean feedbacks add a matchTrue/matchFalse toggle.
 *
 * Note: guideStatus depends on /guide/get which may not exist on the device
 * (see design doc 06 §7.1) — treated as experimental.
 */
function buildFeedbacks(instance) {
	const feedbacks = {}

	const colorWhite = combineRgb(255, 255, 255)
	const colorRed = combineRgb(255, 0, 0)
	const colorGreen = combineRgb(0, 255, 0)

	feedbacks.gatewayMuteStatus = {
		type: 'boolean',
		name: 'Audio Mute Status',
		description: 'Highlight based on the device audio mute status',
		defaultStyle: { color: colorWhite, bgcolor: colorRed },
		options: [
			{
				type: 'dropdown',
				label: 'Mute Status',
				id: 'mute',
				default: '1',
				choices: instance.CHOICES_MUTE,
			},
			buildMatchToggle(),
		],
		callback: (feedback) => {
			const opts = feedback.options
			const match = String(instance.STATE.mute_status) === String(opts.mute)
			return opts.match === 'false' ? !match : match
		},
	}

	feedbacks.backgroundType = {
		type: 'boolean',
		name: 'Background Type',
		description: 'Highlight when the background type matches',
		defaultStyle: { color: colorWhite, bgcolor: colorGreen },
		options: [
			{
				type: 'dropdown',
				label: 'Background Type',
				id: 'type',
				default: 'black',
				choices: instance.CHOICES_BACKGROUND_TYPE,
			},
			buildMatchToggle(),
		],
		callback: (feedback) => {
			const opts = feedback.options
			const match = instance.STATE.background_type === opts.type
			return opts.match === 'false' ? !match : match
		},
	}

	feedbacks.guideStatus = {
		type: 'boolean',
		name: 'Guide Status (experimental)',
		description:
			'Highlight when the guide status matches. The /guide/get endpoint may not exist on all devices.',
		defaultStyle: { color: colorWhite, bgcolor: colorGreen },
		options: [
			{
				type: 'dropdown',
				label: 'Guide Status',
				id: 'status',
				default: 'on',
				choices: instance.CHOICES_GUIDE_STATUS,
			},
			buildMatchToggle(),
		],
		callback: (feedback) => {
			const opts = feedback.options
			const match = instance.STATE.guide_status === opts.status
			return opts.match === 'false' ? !match : match
		},
	}

	return feedbacks
}

module.exports = { buildFeedbacks }
