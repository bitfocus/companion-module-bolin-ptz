import type { ModuleInstance } from './main.js'
import type {
	CapabilityDataValue,
	ZoomCommand,
	FocusCommand,
	PTMoveCommand,
	PositionLimitations,
	MenuAction,
	WhiteBalanceInfo,
	PictureInfo,
	LensInfo,
	GammaInfo,
	ExposureInfo,
} from './types.js'
import { CompanionActionDefinitions } from '@companion-module/base'

export function UpdateActions(self: ModuleInstance): void {
	const actions: CompanionActionDefinitions = {}

	const toggleChoices = [
		{ label: 'Toggle', id: 'toggle' },
		{ label: 'Enable', id: 'true' },
		{ label: 'Disable', id: 'false' },
	]

	const setChoices = [
		{ label: 'Increase', id: 'increase' },
		{ label: 'Decrease', id: 'decrease' },
		{ label: 'Set', id: 'set' },
	]

	function createToggleAction(
		actionId: string,
		name: string,
		getCurrentValue: () => boolean | undefined,
		setValue: (value: boolean) => Promise<void>,
	): void {
		actions[actionId] = {
			name: name,
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					choices: toggleChoices,
					default: 'toggle',
					id: 'mode',
				},
			],
			description: `Set the ${name.toLowerCase()}`,
			callback: async (action) => {
				if (!self.camera) return
				const currentValue = getCurrentValue() ?? false
				let newValue: boolean
				if (action.options.mode === 'toggle') {
					newValue = !currentValue
				} else {
					newValue = action.options.mode === 'true' ? true : false
				}
				await setValue(newValue)
			},
		}
	}

	function createValueAction(
		actionId: string,
		name: string,
		getCurrentValue: () => number | undefined,
		setValue: (value: number) => Promise<void>,
		defaultValue: number = 50,
		step: number = 1,
	): void {
		actions[actionId] = {
			name: name,
			options: [
				{
					type: 'dropdown',
					label: 'Adjustment',
					choices: setChoices,
					default: 'increase',
					id: 'adjustment',
				},
				{
					type: 'textinput',
					label: 'Value',
					default: step.toString(),
					id: 'value',
					useVariables: true,
				},
			],
			description: `Set the ${name.toLowerCase()}`,
			callback: async (action) => {
				if (!self.camera) return
				const currentValue = getCurrentValue() ?? defaultValue
				let newValue: number

				if (action.options.adjustment === 'increase') {
					newValue = currentValue + step
				} else if (action.options.adjustment === 'decrease') {
					newValue = currentValue - step
				} else {
					newValue = parseInt(action.options.value as string)
				}

				await setValue(newValue)
			},
		}
	}

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
				choices: toggleChoices,
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

			const updates: Partial<PositionLimitations> = {}
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

	actions['whiteBalanceMode'] = {
		name: 'White Balance Mode',
		options: [
			{
				type: 'dropdown',
				label: 'Mode',
				choices: [
					{ label: 'Auto', id: 1 },
					{ label: 'Indoor', id: 2 },
					{ label: 'Outdoor', id: 3 },
					{ label: 'OPW', id: 4 },
					{ label: 'ATW', id: 'ATW' },
					{ label: 'User', id: 'User' },
					{ label: 'SVL', id: 'SVL' },
					{ label: 'ManualColorTemperature', id: 'ManualColorTemperature' },
				],
				default: 'Auto',
				id: 'mode',
			},
		],
		description: 'Set the white balance mode',
		callback: async (action) => {
			if (!self.camera) return
			await self.camera.setWhiteBalanceInfo({ Mode: action.options.mode } as WhiteBalanceInfo)
		},
	}
	createValueAction(
		'rGain',
		'Red Gain',
		() => self.camera?.currentWhiteBalanceInfo()?.RGain,
		async (value) => {
			await self.camera!.setWhiteBalanceInfo({ RGain: value } as Partial<WhiteBalanceInfo>)
		},
	)
	createValueAction(
		'bGain',
		'Blue Gain',
		() => self.camera?.currentWhiteBalanceInfo()?.BGain,
		async (value) => {
			await self.camera!.setWhiteBalanceInfo({ BGain: value } as Partial<WhiteBalanceInfo>)
		},
	)
	createValueAction(
		'rTuning',
		'Red Tuning',
		() => self.camera?.currentWhiteBalanceInfo()?.RTuning,
		async (value) => {
			await self.camera!.setWhiteBalanceInfo({ RTuning: value } as Partial<WhiteBalanceInfo>)
		},
	)
	createValueAction(
		'bTuning',
		'Blue Tuning',
		() => self.camera?.currentWhiteBalanceInfo()?.BTuning,
		async (value) => {
			await self.camera!.setWhiteBalanceInfo({ BTuning: value } as Partial<WhiteBalanceInfo>)
		},
	)

	createValueAction(
		'gTuning',
		'Green Tuning',
		() => self.camera?.currentWhiteBalanceInfo()?.GTuning,
		async (value) => {
			await self.camera!.setWhiteBalanceInfo({ GTuning: value } as Partial<WhiteBalanceInfo>)
		},
	)
	createToggleAction(
		'flip',
		'Flip',
		() => self.camera?.currentPictureInfo()?.Flip,
		async (value) => {
			await self.camera!.setPictureInfo({ Flip: value } as Partial<PictureInfo>)
		},
	)

	createToggleAction(
		'mirror',
		'Mirror',
		() => self.camera?.currentPictureInfo()?.Mirror,
		async (value) => {
			await self.camera!.setPictureInfo({ Mirror: value } as Partial<PictureInfo>)
		},
	)

	createToggleAction(
		'hlcMode',
		'HLC Mode',
		() => self.camera?.currentPictureInfo()?.HLCMode,
		async (value) => {
			await self.camera!.setPictureInfo({ HLCMode: value } as Partial<PictureInfo>)
		},
	)

	createToggleAction(
		'blcMode',
		'BLC',
		() => self.camera?.currentPictureInfo()?.BLC,
		async (value) => {
			await self.camera!.setPictureInfo({ BLC: value } as Partial<PictureInfo>)
		},
	)

	createValueAction(
		'2dnr',
		'2DNR',
		() => self.camera?.currentPictureInfo()?.['2DNR'],
		async (value) => {
			await self.camera!.setPictureInfo({ ['2DNR']: value } as Partial<PictureInfo>)
		},
	)
	createValueAction(
		'3dnr',
		'3DNR',
		() => self.camera?.currentPictureInfo()?.['3DNR'],
		async (value) => {
			await self.camera!.setPictureInfo({ ['3DNR']: value } as Partial<PictureInfo>)
		},
	)

	createValueAction(
		'sharpness',
		'Sharpness',
		() => self.camera?.currentPictureInfo()?.Sharpness,
		async (value) => {
			await self.camera!.setPictureInfo({ Sharpness: value } as Partial<PictureInfo>)
		},
	)
	createValueAction(
		'hue',
		'Hue',
		() => self.camera?.currentPictureInfo()?.Hue,
		async (value) => {
			await self.camera!.setPictureInfo({ Hue: value } as Partial<PictureInfo>)
		},
	)
	createValueAction(
		'contrast',
		'Contrast',
		() => self.camera?.currentPictureInfo()?.Contrast,
		async (value) => {
			await self.camera!.setPictureInfo({ Contrast: value } as Partial<PictureInfo>)
		},
	)
	createValueAction(
		'saturation',
		'Saturation',
		() => self.camera?.currentPictureInfo()?.Saturation,
		async (value) => {
			await self.camera!.setPictureInfo({ Saturation: value } as Partial<PictureInfo>)
		},
	)

	createValueAction(
		'defogLevel',
		'Defog Level',
		() => self.camera?.currentPictureInfo()?.DefogLevel,
		async (value) => {
			await self.camera!.setPictureInfo({ DefogLevel: value } as Partial<PictureInfo>)
		},
	)

	const ColorMatrixOptions = [
		{ label: 'Magenta Hue', id: 'MagentaHue' },
		{ label: 'Magenta Saturation', id: 'MagentaSaturation' },
		{ label: 'Magenta Value', id: 'MagentaValue' },
		{ label: 'Red Hue', id: 'RedHue' },
		{ label: 'Red Saturation', id: 'RedSaturation' },
		{ label: 'Red Value', id: 'RedValue' },
		{ label: 'Yellow Hue', id: 'YellowHue' },
		{ label: 'Yellow Saturation', id: 'YellowSaturation' },
		{ label: 'Yellow Value', id: 'YellowValue' },
		{ label: 'Green Hue', id: 'GreenHue' },
		{ label: 'Green Saturation', id: 'GreenSaturation' },
		{ label: 'Green Value', id: 'GreenValue' },
		{ label: 'Cyan Hue', id: 'CyanHue' },
		{ label: 'Cyan Saturation', id: 'CyanSaturation' },
		{ label: 'Cyan Value', id: 'CyanValue' },
		{ label: 'Blue Hue', id: 'BlueHue' },
		{ label: 'Blue Saturation', id: 'BlueSaturation' },
		{ label: 'Blue Value', id: 'BlueValue' },
	]

	actions['colorMatrix'] = {
		name: 'Color Matrix',
		options: [
			{
				type: 'dropdown',
				label: 'Matrix Option',
				choices: ColorMatrixOptions,
				default: 'MagentaSaturation',
				id: 'matrix',
			},
			{
				type: 'dropdown',
				label: 'Adjustment',
				choices: setChoices,
				default: 'increase',
				id: 'adjustment',
			},
			{
				type: 'textinput',
				label: 'Value',
				default: '0',
				id: 'value',
				useVariables: true,
			},
		],
		description: 'Set the color matrix',
		callback: async (action) => {
			if (!self.camera) return
			const matrixOption = action.options.matrix as keyof PictureInfo
			if (action.options.adjustment === 'increase') {
				await self.camera.setPictureInfo({
					[matrixOption]: ((self.camera.currentPictureInfo()?.[matrixOption] as number) ?? 0) + 1,
				} as Partial<PictureInfo>)
			} else if (action.options.adjustment === 'decrease') {
				await self.camera.setPictureInfo({
					[matrixOption]: ((self.camera.currentPictureInfo()?.[matrixOption] as number) ?? 0) - 1,
				} as Partial<PictureInfo>)
			} else {
				await self.camera.setPictureInfo({
					[matrixOption]: parseInt(action.options.value as string),
				} as Partial<PictureInfo>)
			}
		},
	}

	actions['deflicker'] = {
		name: 'Deflicker',
		options: [
			{
				type: 'dropdown',
				label: 'Mode',
				choices: [
					{ label: 'OFF', id: 0 },
					{ label: '50HZ', id: 1 },
					{ label: '60HZ', id: 2 },
				],
				default: 'OFF',
				id: 'mode',
			},
		],
		description: 'Set the deflicker',
		callback: async (action) => {
			if (!self.camera) return
			await self.camera.setPictureInfo({ DeFlicker: action.options.mode } as PictureInfo)
		},
	}

	createToggleAction(
		'smartFocus',
		'Smart Focus',
		() => self.camera?.currentLensInfo()?.SmartFocus,
		async (value) => {
			await self.camera!.setLensInfo({ SmartFocus: value } as Partial<LensInfo>)
		},
	)
	createToggleAction(
		'digitalZoom',
		'Digital Zoom',
		() => self.camera?.currentLensInfo()?.DigitalZoom,
		async (value) => {
			await self.camera!.setLensInfo({ DigitalZoom: value } as Partial<LensInfo>)
		},
	)
	createToggleAction(
		'zoomRatioOSD',
		'Zoom Ratio OSD',
		() => self.camera?.currentLensInfo()?.ZoomRatioOSD,
		async (value) => {
			await self.camera!.setLensInfo({ ZoomRatioOSD: value } as Partial<LensInfo>)
		},
	)

	createToggleAction(
		'wdr',
		'WDR',
		() => self.camera?.currentGammaInfo()?.WDR,
		async (value) => {
			await self.camera!.setGammaInfo({ WDR: value } as Partial<GammaInfo>)
		},
	)

	createValueAction(
		'gain',
		'Gain',
		() => self.camera?.currentExposureInfo()?.Gain,
		async (value) => {
			await self.camera!.setExposureInfo({ Gain: value } as Partial<ExposureInfo>)
		},
	)
	createValueAction(
		'gainLimit',
		'Gain Limit',
		() => self.camera?.currentExposureInfo()?.GainLimit,
		async (value) => {
			await self.camera!.setExposureInfo({ GainLimit: value } as Partial<ExposureInfo>)
		},
	)
	createValueAction(
		'expCompLevel',
		'Exposure Compensation Level',
		() => self.camera?.currentExposureInfo()?.ExCompLevel,
		async (value) => {
			await self.camera!.setExposureInfo({ ExCompLevel: value } as Partial<ExposureInfo>)
		},
	)
	createToggleAction(
		'smartExposure',
		'Smart Exposure',
		() => self.camera?.currentExposureInfo()?.SmartExposure,
		async (value) => {
			await self.camera!.setExposureInfo({ SmartExposure: value } as Partial<ExposureInfo>)
		},
	)
	self.setActionDefinitions(actions)
}
