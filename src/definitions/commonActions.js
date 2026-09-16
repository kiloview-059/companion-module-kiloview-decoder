const { buildOutputPositionFields, buildGroupStreamFields, buildLayoutField, resolveOutputPosition, resolveStream, findStream } = require('../fields/optionFields')
const { isSelectLayoutCrashFirmware } = require('../device/quirks')

/**
 * Common Actions (13): registered for both decoder and gateway profiles.
 * Note: start/stopStreamPlayback are decoder-only — MG300 gateway firmware
 * returns 404 for /source/streams/startPlay|stopPlay (verified on fw 2.20.0132).
 */
function buildActions(instance) {
	const actions = {}

	// ── System ───────────────────────────────────────────────────────────
	actions.reboot = {
		name: 'Reboot Device',
		options: [],
		callback: async () => {
			await instance.DEVICE.reboot()
		},
	}

	actions.refreshStatus = {
		name: 'Refresh Device Status',
		options: [],
		callback: async () => {
			await instance.checkState()
			await instance.checkSources()
		},
	}

	// ── Layout ────────────────────────────────────────────────────────────
	actions.selectLayout = {
		name: 'Select Layout for Output',
		description: 'Apply a layout to an output (current layout marked as Active)',
		options: [
			{
				type: 'dropdown',
				label: 'Output',
				id: 'output_id',
				default: instance.CHOICES_OUTPUTS[0]?.id || '1',
				choices: instance.CHOICES_OUTPUTS,
			},
			buildLayoutField(instance, instance.CHOICES_OUTPUTS[0]?.id || '1'),
		],
		callback: async (action) => {
			const { output_id, layout_id } = action.options
			if (!output_id || !layout_id) {
				instance.log('warn', 'Select Layout: missing output or layout')
				return
			}
			// D350 fw <= 2.20.0732.1221 hard-crashes on /layout/select.
			if (isSelectLayoutCrashFirmware(instance)) {
				instance.log(
					'warn',
					`Select Layout is blocked: D350 firmware ${instance.STATE.firmware_version} crashes on this request. ` +
						'Please upgrade the device firmware to 2.20.0732.1222 or newer, or switch layouts from the web UI.'
				)
				return
			}
			// Guard: re-selecting the layout already active on the output crashes
			// some firmware versions. It is a no-op on healthy firmware, so
			// skipping is always safe.
			const currentLayoutId = instance.STATE.outputs?.find(
				(o) => String(o.id) === String(output_id)
			)?.layout_id
			if (currentLayoutId !== undefined && String(currentLayoutId) === String(layout_id)) {
				if (instance.config.verbose) {
					instance.log('debug', `Select Layout: layout ${layout_id} is already active on output ${output_id}, skipping`)
				}
				return
			}
			if (instance.isDecoder()) {
				await instance.DEVICE.selectLayout(output_id, layout_id)
			} else {
				await instance.DEVICE.selectLayout({ output_id, layout_id: parseInt(layout_id) })
			}
			await instance.checkState()
		},
	}

	// ── Audio ─────────────────────────────────────────────────────────────
	actions.setMute = {
		name: 'Set Position Mute',
		description: 'Mute or unmute a window position (POST /output/mute/set)',
		options: [
			...buildOutputPositionFields(instance),
			{
				type: 'dropdown',
				label: 'Mute',
				id: 'mute',
				default: 'true',
				choices: [
					{ id: 'true', label: 'Mute On' },
					{ id: 'false', label: 'Mute Off' },
				],
			},
		],
		callback: async (action) => {
			const position = resolveOutputPosition(instance, action.options)
			if (!position) {
				instance.log('warn', 'Invalid output or position selection')
				return
			}
			const { output_id, pos_id } = position
			await instance.DEVICE.setMute(output_id, pos_id, action.options.mute === 'true')
			await instance.checkState()
		},
	}

	// ── Output & Source ───────────────────────────────────────────────────
	actions.assignSource = {
		name: 'Assign Source to Position',
		description: 'Assign a stream to a window position on an output',
		options: [
			...buildOutputPositionFields(instance),
			...buildGroupStreamFields(instance),
		],
		callback: async (action) => {
			const position = resolveOutputPosition(instance, action.options)
			const streamSelection = resolveStream(instance, action.options)
			if (!streamSelection) {
				instance.log('warn', 'No stream selected')
				return
			}
			if (!position) {
				instance.log('warn', 'Invalid output or position selection')
				return
			}

			const { output_id, pos_id } = position
			const { stream_id } = streamSelection
			const stream = findStream(instance, stream_id)
			const outputDetail = instance.STATE.output_details?.[String(output_id)]
			const layoutId = outputDetail?.layout_id || parseInt(instance.CHOICES_LAYOUTS[0]?.id || 1)

			const params = instance.DEVICE.buildAssignSourceParams(
				output_id,
				pos_id,
				{ id: stream_id, name: stream?.name || stream?.label || '', url: stream?.url || '' },
				layoutId
			)
			await instance.DEVICE.setSource(params)
			await instance.checkState()
			await instance.checkSources()
		},
	}

	actions.removeSource = {
		name: 'Remove Source from Position',
		options: [...buildOutputPositionFields(instance)],
		callback: async (action) => {
			const position = resolveOutputPosition(instance, action.options)
			if (!position) {
				instance.log('warn', 'Invalid output or position selection')
				return
			}
			const { output_id, pos_id } = position
			if (instance.isGateway()) {
				// Gateway: internal stopPlay then remove (safe operation order)
				try {
					await instance.DEVICE.removeSource({ output_id: String(output_id), pos_id: parseInt(pos_id) })
				} catch (e) {
					if (instance.config.verbose) instance.log('debug', 'removeSource error: ' + e.message)
				}
			} else {
				await instance.DEVICE.removeSource(output_id, pos_id)
			}
			await instance.checkState()
			await instance.checkSources()
		},
	}

	// ── Source Management ─────────────────────────────────────────────────
	actions.refreshSources = {
		name: 'Refresh Source List',
		description: 'Re-fetch the source list from the device',
		options: [],
		callback: async () => {
			// Fix: /source/refresh doesn't exist — just re-poll sources
			await instance.checkSources()
		},
	}

	actions.addSourceStream = {
		name: 'Add Source Stream',
		description: 'Add a manual network stream (RTSP, RTMP, HTTP, etc.) to a source group',
		options: [
			{
				type: 'dropdown',
				label: 'Source Group',
				id: 'group_id',
				default: instance.CHOICES_GROUPS[0]?.id || 'null',
				choices: instance.CHOICES_GROUPS,
			},
			{
				type: 'dropdown',
				label: 'Stream Type',
				id: 'type',
				default: 'rtsp',
				choices: instance.CHOICES_SOURCE_TYPES,
			},
			{ type: 'textinput', label: 'Name', id: 'name', default: '', useVariables: true },
			{ type: 'textinput', label: 'URL', id: 'url', default: '', useVariables: true },
			{ type: 'textinput', label: 'Username (optional)', id: 'user', default: '', useVariables: true },
			{ type: 'textinput', label: 'Password (optional)', id: 'password', default: '', useVariables: true },
			{
				type: 'dropdown',
				label: 'RTSP Transport',
				id: 'trans_mode',
				default: 'tcp',
				choices: [
					{ id: 'tcp', label: 'TCP' },
					{ id: 'udp', label: 'UDP' },
				],
			},
		],
		callback: async (action) => {
			const { group_id, type, name, url, user, password, trans_mode } = action.options
			if (!group_id || group_id === 'null') {
				instance.log('warn', 'No source group selected')
				return
			}
			if (!name || !url) {
				instance.log('warn', 'Name and URL are required')
				return
			}
			const params = instance.DEVICE.buildAddStreamParams(group_id, { type, name, url, user, password, trans_mode })
			await instance.DEVICE.addSourceStream(params)
			await instance.checkSources()
		},
	}

	actions.removeSourceStream = {
		name: 'Remove Source Stream',
		description: 'Delete a stream from a source group',
		options: [...buildGroupStreamFields(instance)],
		callback: async (action) => {
			const streamSelection = resolveStream(instance, action.options)
			if (!streamSelection) {
				instance.log('warn', 'No stream selected')
				return
			}
			await instance.DEVICE.removeSourceStream({
				group_id: streamSelection.group_id,
				stream_id: streamSelection.stream_id,
			})
			await instance.checkSources()
		},
	}

	actions.addSourceGroup = {
		name: 'Add Source Group',
		options: [{ type: 'textinput', label: 'Group Name', id: 'name', default: '', useVariables: true }],
		callback: async (action) => {
			const { name } = action.options
			if (!name) {
				instance.log('warn', 'Add Source Group: name is empty')
				return
			}
			await instance.DEVICE.addSourceGroup(name)
			await instance.checkSources()
		},
	}

	actions.removeSourceGroup = {
		name: 'Remove Source Group',
		options: [
			{
				type: 'dropdown',
				label: 'Group',
				id: 'group_id',
				default: instance.CHOICES_GROUPS[0]?.id || 'null',
				choices: instance.CHOICES_GROUPS,
			},
		],
		callback: async (action) => {
			const { group_id } = action.options
			if (!group_id || group_id === 'null') {
				instance.log('warn', 'Remove Source Group: no group selected')
				return
			}
			await instance.DEVICE.removeSourceGroup(group_id)
			await instance.checkSources()
		},
	}

	// ── Preview ───────────────────────────────────────────────────────────
	actions.previewAssign = {
		name: 'Assign Source to Preview',
		description: 'Add a stream to the preview panel',
		options: [
			...buildGroupStreamFields(instance),
			{
				type: 'dropdown',
				label: 'Preview Slot (optional)',
				id: 'pos_id',
				default: '',
				choices: instance.CHOICES_PREVIEW_SLOTS,
			},
		],
		callback: async (action) => {
			const streamSelection = resolveStream(instance, action.options)
			if (!streamSelection) return
			const { pos_id } = action.options
			const stream = findStream(instance, streamSelection.stream_id)
			const params = instance.DEVICE.buildPreviewAssignParams(
				{ id: streamSelection.stream_id, name: stream?.name || '', url: stream?.url || '' },
				pos_id
			)
			await instance.DEVICE.modifyPreviewSource(params)
			await instance.checkState()
		},
	}

	actions.previewRemove = {
		name: 'Remove Preview Source',
		options: [
			{
				type: 'dropdown',
				label: 'Preview Slot',
				id: 'pos_id',
				default: instance.CHOICES_PREVIEW_SLOTS.find((s) => s.id !== '')?.id ?? '',
				choices: instance.CHOICES_PREVIEW_SLOTS,
			},
		],
		callback: async (action) => {
			const { pos_id } = action.options
			if (pos_id === undefined || pos_id === null || pos_id === '') {
				instance.log('warn', 'Remove Preview Source: no preview slot selected')
				return
			}
			if (instance.isDecoder()) {
				await instance.DEVICE.removePreview(pos_id)
			} else {
				await instance.DEVICE.removePreviewSource({ pos_id: parseInt(pos_id) })
			}
			await instance.checkState()
		},
	}

	return actions
}

module.exports = { buildActions }
