const pollDecoder = require('../polling/pollDecoder')
const pollGateway = require('../polling/pollGateway')

const commonActions = require('./commonActions')
const decoderActions = require('./decoderActions')
const gatewayActions = require('./gatewayActions')

const commonFeedbacks = require('./commonFeedbacks')
const decoderFeedbacks = require('./decoderFeedbacks')
const gatewayFeedbacks = require('./gatewayFeedbacks')

const variables = require('./variables')
const presets = require('./presets')

const fields = require('../fields/optionFields')

module.exports = {
	...pollDecoder,
	...pollGateway,
	...variables,
	...presets,
	...fields,

	/**
	 * Rebuild action/feedback/variable/preset definitions based on current profile.
	 * Called on configUpdated, device type detection, and choices changes.
	 */
	rebuildDefinitions() {
		const profileType = this.currentProfileType()

		// Merge poll methods: use the right profile's checkState/checkSources.
		// 'auto' (undetected) defaults to the decoder pollers, matching isDecoder().
		if (profileType === 'decoder' || profileType === 'auto') {
			Object.assign(this, pollDecoder)
		} else if (profileType === 'gateway') {
			Object.assign(this, pollGateway)
		}

		this.initActions()
		this.initFeedbacks()
		this.initVariables()
		this.initPresets()
	},

	initActions() {
		const actions = {}

		Object.assign(actions, commonActions.buildActions(this))

		if (this.isDecoder()) {
			Object.assign(actions, decoderActions.buildActions(this))
		} else if (this.isGateway()) {
			// Gateway profile: gateway-specific actions + decoder actions (except
			// start/stopStreamPlayback which 404 on MG300) since MG300 firmware
			// supports layout/save-reload, video/audio interfaces, audiomix, NDI
			// discovery, and source/streams/modify on the same endpoints.
			Object.assign(actions, gatewayActions.buildActions(this))
			const decActions = decoderActions.buildActions(this)
			const { startStreamPlayback, stopStreamPlayback, ...sharedDecActions } = decActions
			Object.assign(actions, sharedDecActions)
		}

		this.setActionDefinitions(actions)
	},

	initFeedbacks() {
		const feedbacks = {}

		Object.assign(feedbacks, commonFeedbacks.buildFeedbacks(this))

		if (this.isDecoder()) {
			Object.assign(feedbacks, decoderFeedbacks.buildFeedbacks(this))
		} else if (this.isGateway()) {
			Object.assign(feedbacks, gatewayFeedbacks.buildFeedbacks(this))
		}

		this.setFeedbackDefinitions(feedbacks)
	},
}
