import type { ModuleInstance } from './main.js'
import type { ZoomCommand, FocusCommand, PTMoveCommand } from './types.js'
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

	actions['goHome'] = {
		name: 'Go Home',
		options: [],
		description: 'Go to the home position',
		callback: async () => {
			if (!self.camera) return
			await self.camera.goHome()
		},
	}

	actions['zoom'] = {
		name: 'Zoom',
		options: [
			{
				type: 'dropdown',
				label: 'Direction',
				choices: [
					{ label: 'Wide', id: 'Wide' },
					{ label: 'Tele', id: 'Tele' },
					{ label: 'Stop', id: 'Stop' },
				],
				default: 'Wide',
				id: 'direction',
			},
			{
				type: 'number',
				label: 'Speed',
				default: 5,
				id: 'speed',
				min: 1,
				max: 8,
				isVisibleExpression: '$(options:direction) !== "Stop"',
			},
		],
		description: 'Zoom the camera',
		callback: async (action) => {
			if (!self.camera) return
			const zoom: ZoomCommand = {
				Direction: action.options.direction as ZoomCommand['Direction'],
				Speed: (action.options.speed as number) || 5,
			}
			await self.camera.zoom(zoom)
		},
	}

	actions['focus'] = {
		name: 'Focus',
		options: [
			{
				type: 'dropdown',
				label: 'Direction',
				choices: [
					{ label: 'Near', id: 'Near' },
					{ label: 'Far', id: 'Far' },
					{ label: 'Stop', id: 'Stop' },
				],
				default: 'Near',
				id: 'direction',
			},
			{
				type: 'number',
				label: 'Speed',
				default: 5,
				id: 'speed',
				min: 1,
				max: 8,
				isVisibleExpression:
					'$(options:direction) !== "Stop" && $(options:direction) !== "Manual" && $(options:direction) !== "Auto"',
			},
		],
		description: 'Focus the camera',
		callback: async (action) => {
			if (!self.camera) return
			const focus: FocusCommand = {
				Direction: action.options.direction as FocusCommand['Direction'],
				Speed: (action.options.speed as number) || 5,
			}
			await self.camera.focus(focus)
		},
	}

	actions['focusMode'] = {
		name: 'Focus Mode',
		options: [
			{
				type: 'dropdown',
				label: 'Mode',
				choices: [
					{ label: 'Auto', id: 'Auto' },
					{ label: 'Manual', id: 'Manual' },
				],
				default: 'Auto',
				id: 'mode',
			},
		],
		description: 'Set the focus mode',
		callback: async (action) => {
			if (!self.camera) return
			const focus: FocusCommand = {
				Direction: action.options.mode as FocusCommand['Direction'],
			}
			await self.camera.focus(focus)
		},
	}

	actions['ptMove'] = {
		name: 'Pan / Tilt Move',
		options: [
			{
				type: 'dropdown',
				label: 'Direction',
				choices: [
					{ label: 'Up', id: 'Up' },
					{ label: 'Down', id: 'Down' },
					{ label: 'Left', id: 'Left' },
					{ label: 'Right', id: 'Right' },
					{ label: 'Up Lef', id: 'LeftUp' },
					{ label: 'Up Right', id: 'RightUp' },
					{ label: 'Down Left', id: 'LeftDown' },
					{ label: 'Down Right', id: 'RightDown' },
					{ label: 'Stop', id: 'Stop' },
				],
				default: 'Up',
				id: 'direction',
			},
		],
		description: 'Move the camera',
		callback: async (action) => {
			if (!self.camera) return
			const move: PTMoveCommand = {
				Mode: 1,
				SuperfineSpeed: 128,
				Direction: action.options.direction as PTMoveCommand['Direction'],
			}
			await self.camera.ptMove(move)
		},
	}

	actions['restart'] = {
		name: 'Restart',
		options: [],
		description: 'Restart the camera',
		callback: async () => {
			if (!self.camera) return
			await self.camera.restart()
		},
	}

	self.setActionDefinitions(actions)
}
