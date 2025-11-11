import type { ModuleInstance } from './main.js'
import { CompanionActionDefinitions } from '@companion-module/base'

export function UpdateActions(self: ModuleInstance): void {
	const actions: CompanionActionDefinitions = {}

	actions['callPreset'] = {
		name: 'Preset Control',
		description: 'Call, save or delete a preset',
		options: [
			{
				type: 'dropdown',
				label: 'Action',
				choices: [
					{ label: 'Call', id: 'Call' },
					{ label: 'Save', id: 'Set' },
					{ label: 'Delete', id: 'Delete' },
					{ label: 'Add', id: 'Add' },
				],
				default: 'call',
				id: 'action',
			},
			{
				type: 'dropdown',
				label: 'Preset',
				choices: self.camera?.currentPresets()?.map((preset) => ({ label: preset.Name, id: preset.Number })) ?? [],
				default: 1,
				id: 'preset',
			},
		],
		callback: async (action) => {
			if (!self.camera) return
			const presetId = action.options.preset
			if (presetId) {
				const presets = self.camera.currentPresets()
				const preset = presets?.find((p) => p.Number === presetId)
				if (preset) {
					await self.camera.setPreset({
						Action: action.options.action as string,
						Name: preset.Name,
						Number: preset.Number,
					})
				}
			}
		},
	}
	self.setActionDefinitions(actions)
}
