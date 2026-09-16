const { InstanceBase, runEntrypoint } = require('@companion-module/base')
const upgrades = require('./src/upgrades')

const config = require('./src/config')
const constants = require('./src/constants')
const state = require('./src/state')
const connection = require('./src/polling/connection')
const definitions = require('./src/definitions')

class KiloviewDecoderInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		Object.assign(this, {
			...config,
			...constants,
			...state,
			...connection,
			...definitions,
		})

		// Initialize STATE and CHOICES_* with defaults (like legacy constants.js did)
		this.resetState()
		this.resetChoices()
	}

	async init(config) {
		this.configUpdated(config)
	}

	async destroy() {
		try {
			this.stopPolling()
		} catch (error) {
			this.log('error', 'destroy error:' + error)
		}
	}

	async configUpdated(config) {
		this.config = config

		this.applyProfileDefaults()

		// Pre-register actions/feedbacks/variables/presets so they are visible
		// even before a successful connection (matches legacy module behavior)
		this.rebuildDefinitions()

		this.initConnection()
	}
}

runEntrypoint(KiloviewDecoderInstance, upgrades)
