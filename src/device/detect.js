/**
 * Device type auto-detection via /info/get.
 *
 * Uses the decoder profile's route table temporarily so the `app` header
 * (with full login data) is applied. Both profiles share the same
 * /info/get route, so either works.
 *
 * 1. device_name / hardware_version prefix: MG300/RMG300 → gateway;
 *    D350/D260/RD350/RD260 → decoder
 * 2. device_name starts with DECODER- → decoder
 * 3. Fallback: probe /gate/stream/list (exists on MG, 404 on D)
 * 4. Still unknown → 'unknown'
 */
const decoderProfile = require('../http/decoderProfile')

async function detectDeviceType(client) {
	// Set a temporary profile so call() injects the auth header.
	// Both profiles share /info/get and /gate/stream/list routes.
	const prevProfile = client.profile
	if (!client.profile) {
		client.setProfile(decoderProfile)
	}

	let info
	try {
		const result = await client.call('getInfo')
		info = result
	} catch (e) {
		// Restore profile before returning
		if (!prevProfile) client.profile = null
		return 'unknown'
	}

	if (info?.data) {
		const d = info.data
		const haystack = [
			String(d.device_name || ''),
			String(d.hardware_version || ''),
			String(d.model || ''),
			String(d.product || ''),
			String(d.type || ''),
		].join(' ').toUpperCase()

		if (haystack.includes('MG300') || haystack.includes('RMG300')) {
			if (!prevProfile) client.profile = null
			return 'gateway'
		}

		if (haystack.includes('D350') || haystack.includes('D260') || haystack.includes('RD350') || haystack.includes('RD260')) {
			if (!prevProfile) client.profile = null
			return 'decoder'
		}

		// Device name prefix: DECODER-xxx → decoder
		if (String(d.device_name || '').toUpperCase().startsWith('DECODER')) {
			if (!prevProfile) client.profile = null
			return 'decoder'
		}
	}

	// Fallback: probe a gateway-only endpoint
	try {
		const result = await client.call('getGatewayStreamList')
		if (result && result.result === 'ok') {
			if (!prevProfile) client.profile = null
			return 'gateway'
		}
	} catch (e) {
		// endpoint doesn't exist or errors → likely decoder
	}

	// If we got info data, assume decoder (more common)
	if (!prevProfile) client.profile = null
	if (info?.data) {
		return 'decoder'
	}

	return 'unknown'
}

module.exports = { detectDeviceType }
