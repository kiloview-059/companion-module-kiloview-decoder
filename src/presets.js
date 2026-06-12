module.exports = {
	initPresets() {
		const self = this
		const presets = []

		self.CHOICES_LAYOUTS.forEach((layout) => {
			presets.push({
				type: 'button',
				category: 'Layouts',
				name: `Layout: ${layout.label}`,
				style: {
					text: layout.label,
					size: '14',
					color: '16777215',
					bgcolor: '0',
				},
				steps: [
					{
						down: [
							{
								actionId: 'selectLayout',
								options: {
									output_id: self.CHOICES_OUTPUTS[0]?.id || '1',
									layout_id: layout.id,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'currentLayout',
						options: {
							output_id: self.CHOICES_OUTPUTS[0]?.id || '1',
							layout_id: layout.id,
						},
						style: {
							color: '16777215',
							bgcolor: '65280',
						},
					},
				],
			})
		})

		presets.push({
			type: 'button',
			category: 'Layout',
			name: 'Save Current Layout',
			style: {
				text: 'Save',
				size: '14',
				color: '16777215',
				bgcolor: '255',
			},
			steps: [
				{
					down: [
						{
							actionId: 'saveLayout',
							options: {
								output_id: self.CHOICES_OUTPUTS[0]?.id || '1',
								layout_id: self.CHOICES_LAYOUTS[0]?.id || '1',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		})

		presets.push({
			type: 'button',
			category: 'Sources',
			name: 'Refresh Sources',
			style: {
				text: 'Refresh Sources',
				size: '14',
				color: '16777215',
				bgcolor: '255',
			},
			steps: [
				{
					down: [{ actionId: 'refreshSources', options: {} }],
					up: [],
				},
			],
			feedbacks: [],
		})

		self.CHOICES_PTZ_PRESETS.slice(0, 4).forEach((preset) => {
			presets.push({
				type: 'button',
				category: 'PTZ',
				name: `Recall PTZ ${preset.label}`,
				style: {
					text: `PTZ ${preset.label}`,
					size: '14',
					color: '16777215',
					bgcolor: '0',
				},
				steps: [
					{
						down: [
							{
								actionId: 'ptzRecallPreset',
								options: {
									output_id: self.CHOICES_OUTPUTS[0]?.id || '1',
									pos_id: self.CHOICES_POSITIONS[0]?.id || 1,
									preset_no: preset.id,
									speed: '0.5',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			})
		})

		presets.push({
			type: 'button',
			category: 'System',
			name: 'Refresh Status',
			style: {
				text: 'Refresh',
				size: '14',
				color: '16777215',
				bgcolor: '255',
			},
			steps: [
				{
					down: [{ actionId: 'refreshStatus', options: {} }],
					up: [],
				},
			],
			feedbacks: [],
		})

		presets.push({
			type: 'button',
			category: 'System',
			name: 'Reboot Device',
			style: {
				text: 'Reboot',
				size: '14',
				color: '16777215',
				bgcolor: '16711680',
			},
			steps: [
				{
					down: [{ actionId: 'reboot', options: {} }],
					up: [],
				},
			],
			feedbacks: [],
		})

		self.setPresetDefinitions(presets)
	},
}
