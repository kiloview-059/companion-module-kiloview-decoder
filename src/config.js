const { Regex } = require('@companion-module/base')

const CHOICES_DEVICE_TYPE = [
	{ id: 'auto', label: 'Auto detect' },
	{ id: 'decoder', label: 'Dxx Decoder (D350/D260/RD)' },
	{ id: 'gateway', label: 'Media Gateway (MG300/RMG300)' },
]

const CHOICES_PROTOCOL_HTTP = [{ id: 'http', label: 'HTTP' }]
const CHOICES_PROTOCOL_BOTH = [
	{ id: 'http', label: 'HTTP' },
	{ id: 'https', label: 'HTTPS' },
]

module.exports = {
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value:
					'Controls Kiloview Dxx decoders (D350/D260/RD350/RD260) and MG300V2 Media Gateway. Select the device type or use auto-detect.',
			},
			{
				type: 'dropdown',
				id: 'deviceType',
				label: 'Device Type',
				width: 6,
				default: 'auto',
				choices: CHOICES_DEVICE_TYPE,
			},
			{
				type: 'static-text',
				id: 'hr0',
				width: 12,
				label: ' ',
				value: '<hr />',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Device IP / Host',
				width: 6,
				default: '',
				regex: Regex.HOSTNAME,
			},
			{
				type: 'dropdown',
				id: 'protocol',
				label: 'Protocol',
				width: 3,
				default: 'http',
				choices: CHOICES_PROTOCOL_BOTH,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Port',
				width: 3,
				default: '80',
				regex: Regex.PORT,
			},
			{
				type: 'static-text',
				id: 'hr1',
				width: 12,
				label: ' ',
				value: '<hr />',
			},
			{
				type: 'checkbox',
				id: 'useAuth',
				label: 'Use Authentication',
				width: 6,
				default: true,
			},
			{
				type: 'textinput',
				label: 'Username',
				id: 'username',
				width: 3,
				default: 'admin',
				isVisible: (configValues) => configValues.useAuth === true,
			},
			{
				type: 'textinput',
				label: 'Password',
				id: 'password',
				width: 3,
				default: 'admin',
				isVisible: (configValues) => configValues.useAuth === true,
			},
			{
				type: 'static-text',
				id: 'hr2',
				width: 12,
				label: ' ',
				value: '<hr />',
			},
			{
				type: 'checkbox',
				id: 'polling',
				label: 'Enable Polling (necessary for feedbacks and variables)',
				default: true,
				width: 3,
			},
			{
				type: 'textinput',
				id: 'pollingrate',
				label: 'Polling Rate for Device State (in ms)',
				default: '1000',
				width: 3,
				isVisible: (configValues) => configValues.polling === true,
			},
			{
				type: 'textinput',
				id: 'pollingrate_sources',
				label: 'Polling Rate for Source List (in ms)',
				default: '10000',
				width: 3,
				isVisible: (configValues) => configValues.polling === true,
			},
			{
				type: 'static-text',
				id: 'hr3',
				width: 12,
				label: ' ',
				value: '<hr />',
			},
			{
				type: 'checkbox',
				id: 'verbose',
				label: 'Enable Verbose Logging',
				default: false,
				width: 3,
			},
			{
				type: 'static-text',
				id: 'verboseInfo',
				width: 9,
				label: ' ',
				value: 'Enabling Verbose Logging will push additional debug data to the log.',
			},
		]
	},

	applyProfileDefaults() {
		const dt = this.config.deviceType || 'auto'

		if (dt === 'decoder') {
			if (this.config.port === '99' || this.config.port === undefined || this.config.port === '') {
				this.config.port = '80'
			}
			if (this.config.protocol === undefined || this.config.protocol === '') {
				this.config.protocol = 'http'
			}
		} else if (dt === 'gateway') {
			if (this.config.port === '80' || this.config.port === undefined || this.config.port === '') {
				this.config.port = '99'
			}
			if (this.config.protocol === undefined || this.config.protocol === '') {
				this.config.protocol = 'http'
			}
		}
	},
}
