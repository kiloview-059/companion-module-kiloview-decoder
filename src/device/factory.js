const BaseClient = require('../http/BaseClient')
const decoderProfile = require('../http/decoderProfile')
const gatewayProfile = require('../http/gatewayProfile')
const DecoderApi = require('../http/decoderApi')
const GatewayApi = require('../http/gatewayApi')

/**
 * Create the appropriate API client based on the device type.
 * Returns the API wrapper instance (DecoderApi or GatewayApi).
 */
function createDevice(owner, config) {
	const client = new BaseClient(
		owner,
		config.host,
		config.username,
		config.password,
		config.protocol || 'http',
		parseInt(config.port) || 80
	)

	const api = createApiForType(client, config.deviceType || 'auto')
	return { client, api }
}

function createApiForType(client, deviceType) {
	if (deviceType === 'decoder') {
		client.setProfile(decoderProfile)
		return new DecoderApi(client)
	}

	if (deviceType === 'gateway') {
		client.setProfile(gatewayProfile)
		return new GatewayApi(client)
	}

	// auto: profile set later by detect.js
	return null
}

function setApiProfile(client, api, detectedType) {
	if (detectedType === 'decoder') {
		client.setProfile(decoderProfile)
	} else if (detectedType === 'gateway') {
		client.setProfile(gatewayProfile)
	}
}

module.exports = { createDevice, createApiForType, setApiProfile }
