/**
 * Firmware-specific quirks discovered during real-device testing.
 */

/**
 * Compare dotted numeric firmware versions, e.g. '2.20.0732.1221'.
 * Missing segments are treated as 0. Returns -1, 0 or 1.
 */
function compareFirmware(a, b) {
	const pa = String(a || '').split('.').map((n) => parseInt(n, 10) || 0)
	const pb = String(b || '').split('.').map((n) => parseInt(n, 10) || 0)
	const len = Math.max(pa.length, pb.length)
	for (let i = 0; i < len; i++) {
		if ((pa[i] || 0) < (pb[i] || 0)) return -1
		if ((pa[i] || 0) > (pb[i] || 0)) return 1
	}
	return 0
}

/**
 * Previously believed D350 firmware <= 2.20.0732.1221 hard-crashed on
 * POST /layout/select. Root cause was actually the module stripping the
 * `alias` field from the `app` auth header — the device validates alias
 * on this endpoint and crashes when it's missing. Now that alias is kept
 * (escaped via \uXXXX in decoderProfile.buildAuthHeaders), this quirk is
 * no longer needed. Kept as a no-op for any callers still referencing it.
 */
function isSelectLayoutCrashFirmware(_instance) {
	return false
}

module.exports = { compareFirmware, isSelectLayoutCrashFirmware }
