import type { ModuleInstance } from './main.js'
import type {
	CapabilityDataValue,
	ZoomCommand,
	FocusCommand,
	PTMoveCommand,
	PositionLimitations,
	MenuAction,
} from './types.js'
import { CompanionActionDefinitions } from '@companion-module/base'

export function UpdateActions(self: ModuleInstance): void {
	const actions: CompanionActionDefinitions = {}

	actions['presetControl'] = {
		name: 'Preset Control',
		description: 'Call, save or delete a preset',
		options: [
			{
				type: 'dropdown',
				label: 'Command',
				choices: [
					{ label: 'Call', id: 'Call' },
					{ label: 'Save', id: 'Set' },
					{ label: 'Delete', id: 'Delete' },
				],
				default: 'Call',
				id: 'command',
			},
			{
				type: 'dropdown',
				label: 'Preset',
				choices: self.camera?.currentPresets()?.map((preset) => ({ label: preset.Name, id: preset.Number })) ?? [],
				default: 1,
				id: 'preset',
				isVisibleExpression: '$(options:customPreset) === false',
			},
			{ type: 'checkbox', label: 'Custom Preset', default: false, id: 'customPreset' },
			{
				type: 'textinput',
				label: 'Custom Preset Number',
				default: '1',
				id: 'customPresetNumber',
				isVisibleExpression: '$(options:customPreset) === true',
				useVariables: true,
				description: '(1 - 255)',
			},
			{
				type: 'textinput',
				label: 'Custom Preset Name',
				default: 'Preset $(options:customPresetNumber)',
				id: 'customPresetName',
				isVisibleExpression: 'Preset $(options:customPreset) === true',
				useVariables: true,
			},
		],
		callback: async (action) => {
			if (!self.camera) return
			const command = action.options.command as string

			if (action.options.customPreset) {
				const customPresetNumber = parseInt(action.options.customPresetNumber as string)
				const customPresetName = action.options.customPresetName as string
				if (isNaN(customPresetNumber)) {
					self.log('warn', 'Custom Preset Number must be a number')
					return
				}
				if (customPresetNumber < 1 || customPresetNumber > 255) {
					self.log('warn', 'Custom Preset Number must be between 1 and 255')
					return
				}
				await self.camera.setPreset({
					Action: command,
					Name: customPresetName,
					Number: customPresetNumber,
				})
			} else {
				const presets = self.camera.currentPresets()
				const preset = presets?.find((p) => p.Number === action.options.preset)
				if (!preset) {
					self.log('warn', 'Preset not found')
					return
				}
				await self.camera.setPreset({
					Action: command,
					Name: preset.Name,
					Number: preset.Number,
				})
			}
		},
	}

	actions['setPresetSpeed'] = {
		name: 'Set Preset Speed',
		options: [
			{
				type: 'textinput',
				label: 'Preset Speed',
				default: '5',
				id: 'presetSpeed',
				useVariables: true,
				description: '(1 - 5)',
			},
			{
				type: 'textinput',
				label: 'Preset Zoom Speed',
				default: '5',
				id: 'zoomSpeed',
				description: '(1 - 5)',
				useVariables: true,
			},
		],
		description: 'Set the preset speed',
		callback: async (action) => {
			if (!self.camera) return
			const presetSpeed = parseInt(action.options.presetSpeed as string)
			const presetZoomSpeed = parseInt(action.options.zoomSpeed as string)
			if (isNaN(presetSpeed)) {
				self.log('warn', 'Preset Speed must be a number')
				return
			}
			if (isNaN(presetZoomSpeed)) {
				self.log('warn', 'Preset Zoom Speed must be a number')
				return
			}
			if (presetSpeed < 1 || presetSpeed > 5) {
				self.log('warn', 'Preset Speed must be between 1 and 5')
				return
			}
			if (presetZoomSpeed < 1 || presetZoomSpeed > 5) {
				self.log('warn', 'Preset Zoom Speed must be between 1 and 5')
				return
			}
			await self.camera.setPresetSpeed({
				PresetSpeed: presetSpeed,
				PresetZoomSpeed: presetZoomSpeed,
			})
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
				type: 'textinput',
				label: 'Speed',
				default: '5',
				id: 'speed',
				description: '(1 - 8)',
				useVariables: true,
			},
		],
		description: 'Zoom the camera',
		callback: async (action) => {
			if (!self.camera) return
			const speed = parseInt(action.options.speed as string)
			if (isNaN(speed)) {
				self.log('warn', 'Speed must be a number')
				return
			}
			if (speed < 1 || speed > 8) {
				self.log('warn', 'Speed must be between 1 and 5')
				return
			}
			const zoom: ZoomCommand = {
				Direction: action.options.direction as ZoomCommand['Direction'],
				Speed: speed,
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
				type: 'textinput',
				label: 'Speed',
				default: '5',
				id: 'speed',
				description: '(1 - 8)',
				useVariables: true,
			},
		],
		description: 'Focus the camera',
		callback: async (action) => {
			if (!self.camera) return
			const speed = parseInt(action.options.speed as string)
			if (isNaN(speed)) {
				self.log('warn', 'Speed must be a number')
				return
			}
			if (speed < 1 || speed > 8) {
				self.log('warn', 'Speed must be between 1 and 8')
				return
			}
			const focus: FocusCommand = {
				Direction: action.options.direction as FocusCommand['Direction'],
				Speed: speed,
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
			{
				type: 'textinput',
				label: 'Speed',
				default: '128',
				id: 'speed',
				description: '(1 - 255)',
				useVariables: true,
			},
		],
		description: 'Move the camera',
		callback: async (action) => {
			if (!self.camera) return
			const speed = parseInt(action.options.speed as string)
			if (isNaN(speed)) {
				self.log('warn', 'Speed must be a number')
				return
			}
			if (speed < 1 || speed > 255) {
				self.log('warn', 'Speed must be between 1 and 255')
				return
			}
			const move: PTMoveCommand = {
				Mode: 1,
				SuperfineSpeed: speed,
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

	actions['setPositionLimits'] = {
		name: 'Set Position Limits',
		options: [
			{
				type: 'multidropdown',
				label: 'Direction',
				choices: [
					{ label: 'Up', id: 'UpLimit' },
					{ label: 'Down', id: 'DownLimit' },
					{ label: 'Left', id: 'LeftLimit' },
					{ label: 'Right', id: 'RightLimit' },
				],
				default: [],
				id: 'direction',
			},
			{
				type: 'dropdown',
				label: 'Lock',
				choices: [
					{ label: 'Toggle', id: 'toggle' },
					{ label: 'Enable', id: 'true' },
					{ label: 'Disable', id: 'false' },
				],
				default: 'toggle',
				id: 'lock',
			},
		],
		description: 'Set the position limits',
		callback: async (action) => {
			if (!self.camera) return
			const directions = (action.options.direction as string[]) || []
			const actionType = action.options.lock as 'toggle' | 'true' | 'false'

			if (directions.length === 0) return
			const currentLimits = (await self.camera.getPositionLimits()) || {}

			const updates: PositionLimitations = {}
			for (const direction of directions) {
				const fieldName = direction as keyof PositionLimitations
				if (fieldName) {
					if (actionType === 'toggle') {
						updates[fieldName] = !currentLimits[fieldName]
					} else {
						updates[fieldName] = actionType === 'true'
					}
				}
			}

			await self.camera.setPositionLimits(updates)
		},
	}

	actions['setOSDMenu'] = {
		name: 'OSD Menu Control',
		options: [
			{
				type: 'dropdown',
				label: 'Action',
				id: 'command',
				default: 'ON',
				choices: [
					{ label: 'ON', id: 'ON' },
					{ label: 'OFF / Back', id: 'OFF' },
					{ label: 'Up', id: 'Up' },
					{ label: 'Down', id: 'Down' },
					{ label: 'Left', id: 'Left' },
					{ label: 'Right', id: 'Right' },
					{ label: 'OK', id: 'OK' },
				],
			},
		],
		description: 'Set the OSD menu',
		callback: async (action) => {
			if (!self.camera) return
			await self.camera.setOSDMenu(action.options.command as MenuAction)
		},
	}

	actions['setHDMIResolution'] = {
		name: 'Set HDMI Resolution',
		options: [
			{
				type: 'dropdown',
				label: 'Resolution',
				choices:
					self.camera
						?.currentGeneralCapabilities()
						?.[
							'VideoOutputInfo'
						]?.['HDMIResolution']?.Data?.map((data: CapabilityDataValue) => ({ label: data.Value as string, id: data.Value as string })) ??
					[],
				default: '1920x1080P60',
				id: 'resolution',
			},
		],
		description: 'Set the HDMI resolution',
		callback: async (action) => {
			if (!self.camera) return
			await self.camera.setVideoOutput({ HDMIResolution: action.options.resolution as string })
		},
	}

	self.setActionDefinitions(actions)
}
