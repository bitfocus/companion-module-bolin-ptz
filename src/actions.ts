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
	PTZFPosition,
	PanTiltInfo,
	OverlayInfo,
	RTSPInfo,
	RTMPInfo,
	AVOverUDPInfo,
	AVOverRTPInfo,
	NDIInfo,
} from './types.js'
import { CompanionActionDefinitions } from '@companion-module/base'
import {
	sortIrisChoices,
	getAdjacentIrisValue,
	sortShutterSpeedChoices,
	getAdjacentShutterSpeedValue,
	convertIrisRangeToMap,
} from './utils.js'

/**
 * Helper function to safely parse an integer with validation
 */
function parseInteger(value: string | number | undefined, fieldName: string, self: ModuleInstance): number | null {
	if (value === undefined) return null
	const parsed = typeof value === 'number' ? value : parseInt(String(value), 10)
	if (isNaN(parsed)) {
		self.log('warn', `${fieldName} must be a number`)
		return null
	}
	return parsed
}

export function UpdateActions(self: ModuleInstance): void {
	const actions: CompanionActionDefinitions = {}

	// Only check capabilities if they've been loaded, otherwise create all actions
	const capabilitiesLoaded = self.camera?.getStoredCameraCapabilities() !== null

	const hasCapability = (cap: string): boolean => {
		if (!capabilitiesLoaded) return true
		return self.camera?.hasCapability(cap) ?? false
	}

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
		description?: string,
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
			description: description ?? `Set the ${name.toLowerCase()}`,
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
		description?: string,
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
			description: description ?? `Set the ${name.toLowerCase()}`,
			callback: async (action) => {
				if (!self.camera) return
				const currentValue = getCurrentValue() ?? defaultValue
				let newValue: number

				if (action.options.adjustment === 'increase') {
					newValue = currentValue + step
				} else if (action.options.adjustment === 'decrease') {
					newValue = currentValue - step
				} else {
					const parsedValue = parseInteger(action.options.value as string, `${name} value`, self)
					if (parsedValue === null) return
					newValue = parsedValue
				}

				await setValue(newValue)
			},
		}
	}

	// Mapping of capability names to their corresponding action creation functions
	const actionMappings: Array<{
		capabilities: string[]
		createActions: () => void
	}> = [
		{
			capabilities: ['PresetInfo'],
			createActions: () => {
				actions['presetControl'] = {
					name: 'Presets - Call / Save / Delete',
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
							choices:
								self.camera?.getState().presets?.map((preset) => ({ label: preset.Name, id: preset.Number })) ?? [],
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
							isVisibleExpression: '$(options:customPreset) === true',
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
							const presets = self.camera?.getState().presets
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
			},
		},
		{
			capabilities: ['PTZFPresetSpeed', 'PresetSpeed'],
			createActions: () => {
				actions['setPresetSpeed'] = {
					name: 'Presets - Set Preset Speed',
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
			},
		},
		{
			capabilities: ['PanTiltInfo', 'PTZFMoveInfo'],
			createActions: () => {
				createToggleAction(
					'panDirectionInverted',
					'PTZ - Pan Direction Invert',
					() => self.camera?.getState().panTiltInfo?.PanDirection === 1,
					async (value) => {
						await self.camera!.setPTInfo({ PanDirection: value ? 1 : 0 } as Partial<PanTiltInfo>)
					},
				)
				createToggleAction(
					'tiltDirectionInverted',
					'PTZ - Tilt Direction Invert',
					() => self.camera?.getState().panTiltInfo?.TiltDirection === 1,
					async (value) => {
						await self.camera!.setPTInfo({ TiltDirection: value ? 1 : 0 } as Partial<PanTiltInfo>)
					},
				)
			},
		},
		{
			capabilities: [],
			createActions: () => {
				// Basic PTZ controls - always available
				actions['goHome'] = {
					name: 'PTZ - Go Home',
					options: [],
					description: 'Go to the home position',
					callback: async () => {
						if (!self.camera) return
						await self.camera.goHome()
					},
				}
				actions['zoom'] = {
					name: 'PTZ - Zoom',
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
							self.log('warn', 'Speed must be between 1 and 8')
							return
						}
						const zoom: ZoomCommand = {
							Direction: action.options.direction as ZoomCommand['Direction'],
							Speed: speed,
						}
						await self.camera.zoom(zoom)
					},
				}
				actions['ptMove'] = {
					name: 'PTZ - Pan / Tilt Move',
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
					name: 'System - Restart',
					options: [],
					description: 'Restart the camera',
					callback: async () => {
						if (!self.camera) return
						await self.camera.restart()
					},
				}
				actions['setOSDMenu'] = {
					name: 'System - OSD Menu Control',
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
			},
		},
		{
			capabilities: ['LensInfo', 'Lens'],
			createActions: () => {
				actions['focus'] = {
					name: 'Focus - Direction',
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
					name: 'Focus - Mode',
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
				createToggleAction(
					'smartFocus',
					'Lens - Smart Focus',
					() => self.camera?.getState().lensInfo?.SmartFocus,
					async (value) => {
						await self.camera!.setLensInfo({ SmartFocus: value } as Partial<LensInfo>)
					},
					'Enable or disable smart focus mode',
				)
				createToggleAction(
					'digitalZoom',
					'Lens - Digital Zoom',
					() => self.camera?.getState().lensInfo?.DigitalZoom,
					async (value) => {
						await self.camera!.setLensInfo({ DigitalZoom: value } as Partial<LensInfo>)
					},
					'Enable or disable digital zoom',
				)
				createToggleAction(
					'zoomRatioOSD',
					'Lens - Zoom Ratio OSD',
					() => self.camera?.getState().lensInfo?.ZoomRatioOSD,
					async (value) => {
						await self.camera!.setLensInfo({ ZoomRatioOSD: value } as Partial<LensInfo>)
					},
					'Show or hide zoom ratio on OSD',
				)
				actions['mfSpeed'] = {
					name: 'Lens - MF Speed',
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
							default: '1',
							id: 'value',
							useVariables: true,
							description: '(0 - 7)',
						},
					],
					description: 'Set manual focus speed (0-7)',
					callback: async (action) => {
						if (!self.camera) return
						const currentValue = self.camera?.getState().lensInfo?.MFSpeed ?? 0
						let newValue: number

						if (action.options.adjustment === 'increase') {
							newValue = Math.min(7, currentValue + 1)
						} else if (action.options.adjustment === 'decrease') {
							newValue = Math.max(0, currentValue - 1)
						} else {
							const parsedValue = parseInteger(action.options.value as string, 'MF Speed value', self)
							if (parsedValue === null) return
							newValue = Math.max(0, Math.min(7, parsedValue))
						}

						await self.camera.setLensInfo({ MFSpeed: newValue } as Partial<LensInfo>)
					},
				}
				actions['afSensitivity'] = {
					name: 'Lens - AF Sensitivity',
					options: [
						{
							type: 'dropdown',
							label: 'Sensitivity',
							choices: [
								{ label: 'Low', id: 'Low' },
								{ label: 'Middle', id: 'Middle' },
								{ label: 'High', id: 'High' },
							],
							default: 'Middle',
							id: 'sensitivity',
						},
					],
					description: 'Set the AF sensitivity level',
					callback: async (action) => {
						if (!self.camera) return
						// Convert string value to number for API (0=Low, 1=Middle, 2=High)
						const sensitivityMap: Record<string, number> = {
							Low: 0,
							Middle: 1,
							High: 2,
						}
						const sensitivityValue = sensitivityMap[action.options.sensitivity as string] ?? 1
						// Send as any to allow numeric value (API expects number, not string)
						await self.camera.setLensInfo({
							AFSensitivity: sensitivityValue,
						} as any)
					},
				}
			},
		},
		{
			capabilities: ['PositionLimitations'],
			createActions: () => {
				actions['setPositionLimits'] = {
					name: 'PTZ - Pan / Tilt Move',
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

				actions['setPositionLimits'] = {
					name: 'PTZ - Set Position Limits',
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
			},
		},
		{
			capabilities: ['VideoOutputInfo'],
			createActions: () => {
				if (self.camera?.hasCapability('VideoOutputInfo.SystemFormat')) {
					actions['setSystemFormat'] = {
						name: 'System - Set Video Format',
						options: [
							{
								type: 'dropdown',
								label: 'Format',
								choices:
									self.camera
										?.getState()
										.generalCapabilities?.[
											'VideoOutputInfo'
										]?.['SystemFormat']?.Data?.map((data: CapabilityDataValue) => ({ label: data.Value as string, id: data.Value as string })) ??
									[],
								default:
									self.camera?.getState().generalCapabilities?.['VideoOutputInfo']?.['SystemFormat']?.Data?.[0]
										?.Value ?? '1920x1080P60',
								id: 'format',
							},
						],
						description: 'Set the system format',
						callback: async (action) => {
							if (!self.camera) return
							const currentFormat = self.camera?.getState().videoOutputInfo
							if (!currentFormat) return
							currentFormat.SystemFormat = action.options.format as string
							await self.camera.setVideoOutput(currentFormat)
						},
					}
				}
				if (self.camera?.hasCapability('VideoOutputInfo.HDMIResolution')) {
					actions['setHDMIResolution'] = {
						name: 'System - Set HDMI Resolution',
						options: [
							{
								type: 'dropdown',
								label: 'Resolution',
								choices:
									self.camera
										?.getState()
										.generalCapabilities?.[
											'VideoOutputInfo'
										]?.['HDMIResolution']?.Data?.map((data: CapabilityDataValue) => ({ label: data.Value as string, id: data.Value as string })) ??
									[],
								default:
									self.camera?.getState().generalCapabilities?.['VideoOutputInfo']?.['HDMIResolution']?.Data?.[0]
										?.Value ?? '1920x1080P60',
								id: 'resolution',
							},
						],
						description: 'Set the HDMI resolution',
						callback: async (action) => {
							if (!self.camera) return
							const currentFormat = self.camera?.getState().videoOutputInfo
							if (!currentFormat) return
							currentFormat.HDMIResolution = action.options.resolution as string
							await self.camera.setVideoOutput(currentFormat)
						},
					}
				}
				if (self.camera?.hasCapability('VideoOutputInfo.SDIResolution')) {
					actions['setSDIResolution'] = {
						name: 'System - Set SDI Resolution',
						options: [
							{
								type: 'dropdown',
								label: 'Resolution',
								choices:
									self.camera
										?.getState()
										.generalCapabilities?.[
											'VideoOutputInfo'
										]?.['SDIResolution']?.Data?.map((data: CapabilityDataValue) => ({ label: data.Value as string, id: data.Value as string })) ??
									[],
								default:
									self.camera?.getState().generalCapabilities?.['VideoOutputInfo']?.['SDIResolution']?.Data?.[0]
										?.Value ?? '1920x1080P60',
								id: 'resolution',
							},
						],
						description: 'Set the SDI resolution',
						callback: async (action) => {
							if (!self.camera) return
							const currentFormat = self.camera?.getState().videoOutputInfo
							if (!currentFormat) return
							currentFormat.SDIResolution = action.options.resolution as string
							await self.camera.setVideoOutput(currentFormat)
						},
					}
				}
			},
		},
		{
			capabilities: ['WhiteBalanceInfo', 'WhiteBalance'],
			createActions: () => {
				actions['whiteBalanceMode'] = {
					name: 'White Balance - Mode',
					options: [
						{
							type: 'dropdown',
							label: 'Mode',
							choices: [
								{ label: 'Auto', id: 0 },
								{ label: 'Indoor', id: 1 },
								{ label: 'Outdoor', id: 2 },
								{ label: 'OPW', id: 3 },
								{ label: 'ATW', id: 4 },
								{ label: 'User', id: 5 },
								{ label: 'SVL', id: 8 },
								{ label: 'ManualColorTemperature', id: 10 },
							],
							default: 0,
							id: 'mode',
						},
					],
					description: 'Set the white balance mode',
					callback: async (action) => {
						if (!self.camera) return
						await self.camera.setWhiteBalanceInfo({ Mode: action.options.mode } as WhiteBalanceInfo)
					},
				}
				actions['whiteBalanceSensitivity'] = {
					name: 'White Balance - Sensitivity',
					options: [
						{
							type: 'dropdown',
							label: 'Sensitivity',
							choices: [
								{ label: 'Low', id: 0 },
								{ label: 'Middle', id: 1 },
								{ label: 'High', id: 2 },
							],
							default: 1,
							id: 'sensitivity',
						},
					],
					description: 'Set the white balance sensitivity level',
					callback: async (action) => {
						if (!self.camera) return
						await self.camera.setWhiteBalanceInfo({
							WBSensitivity: action.options.sensitivity,
						} as Partial<WhiteBalanceInfo>)
					},
				}
				const WhiteBalanceOptions = [
					{ label: 'Red Gain', id: 'RGain' },
					{ label: 'Blue Gain', id: 'BGain' },
					{ label: 'Red Tuning', id: 'RTuning' },
					{ label: 'Blue Tuning', id: 'BTuning' },
					{ label: 'Green Tuning', id: 'GTuning' },
				]

				actions['whiteBalanceAdjustments'] = {
					name: 'White Balance - Color Tuning / Gain',
					options: [
						{
							type: 'dropdown',
							label: 'White Balance Option',
							choices: WhiteBalanceOptions,
							default: 'RGain',
							id: 'option',
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
							isVisibleExpression: `$(options:adjustment) === 'set'`,
						},
					],
					description: 'Adjust the white balance color tuning / gain',
					callback: async (action) => {
						if (!self.camera) return
						const whiteBalanceOption = action.options.option as keyof WhiteBalanceInfo
						if (action.options.adjustment === 'increase') {
							await self.camera.setWhiteBalanceInfo({
								[whiteBalanceOption]:
									((self.camera.getState().whiteBalanceInfo?.[whiteBalanceOption] as number) ?? 0) + 1,
							} as Partial<WhiteBalanceInfo>)
						} else if (action.options.adjustment === 'decrease') {
							await self.camera.setWhiteBalanceInfo({
								[whiteBalanceOption]:
									((self.camera.getState().whiteBalanceInfo?.[whiteBalanceOption] as number) ?? 0) - 1,
							} as Partial<WhiteBalanceInfo>)
						} else {
							const parsedValue = parseInteger(action.options.value as string, 'White balance value', self)
							if (parsedValue === null) return
							await self.camera.setWhiteBalanceInfo({
								[whiteBalanceOption]: parsedValue,
							} as Partial<WhiteBalanceInfo>)
						}
					},
				}
				createValueAction(
					'colorTemperature',
					'White Balance - Color Temperature',
					() => self.camera?.getState().whiteBalanceInfo?.ColorTemperature,
					async (value) => {
						// Check if white balance mode is ManualColorTemperature, if not set it first
						const currentMode = self.camera?.getState().whiteBalanceInfo?.Mode
						if (currentMode !== 'ManualColorTemperature') {
							await self.camera!.setWhiteBalanceInfo({ Mode: 'ManualColorTemperature' } as WhiteBalanceInfo)
						}
						await self.camera!.setWhiteBalanceInfo({ ColorTemperature: value } as Partial<WhiteBalanceInfo>)
					},
					5500,
					100,
					'Set color temperature in Kelvin',
				)
			},
		},
		{
			capabilities: ['PictureInfo', 'Picture'],
			createActions: () => {
				createToggleAction(
					'flip',
					'Picture - Flip',
					() => self.camera?.getState().pictureInfo?.Flip,
					async (value) => {
						await self.camera!.setPictureInfo({ Flip: value } as Partial<PictureInfo>)
					},
					'Flip the image vertically',
				)

				createToggleAction(
					'mirror',
					'Picture - Mirror',
					() => self.camera?.getState().pictureInfo?.Mirror,
					async (value) => {
						await self.camera!.setPictureInfo({ Mirror: value } as Partial<PictureInfo>)
					},
					'Mirror the image horizontally',
				)

				createToggleAction(
					'hlcMode',
					'Picture - HLC Mode',
					() => self.camera?.getState().pictureInfo?.HLCMode,
					async (value) => {
						await self.camera!.setPictureInfo({ HLCMode: value } as Partial<PictureInfo>)
					},
					'Enable or disable high light compensation',
				)
				createToggleAction(
					'blcMode',
					'Picture - BLC',
					() => self.camera?.getState().pictureInfo?.BLC,
					async (value) => {
						await self.camera!.setPictureInfo({ BLC: value } as Partial<PictureInfo>)
					},
					'Enable or disable back light compensation',
				)

				createValueAction(
					'2dnr',
					'Picture - 2DNR',
					() => self.camera?.getState().pictureInfo?.['2DNR'],
					async (value) => {
						await self.camera!.setPictureInfo({ ['2DNR']: value } as Partial<PictureInfo>)
					},
					50,
					1,
					'Adjust 2D noise reduction level',
				)
				createValueAction(
					'3dnr',
					'Picture - 3DNR',
					() => self.camera?.getState().pictureInfo?.['3DNR'],
					async (value) => {
						await self.camera!.setPictureInfo({ ['3DNR']: value } as Partial<PictureInfo>)
					},
					50,
					1,
					'Adjust 3D noise reduction level',
				)

				createValueAction(
					'sharpness',
					'Picture - Sharpness',
					() => self.camera?.getState().pictureInfo?.Sharpness,
					async (value) => {
						await self.camera!.setPictureInfo({ Sharpness: value } as Partial<PictureInfo>)
					},
					50,
					1,
					'Adjust image sharpness',
				)
				createValueAction(
					'hue',
					'Picture - Hue',
					() => self.camera?.getState().pictureInfo?.Hue,
					async (value) => {
						await self.camera!.setPictureInfo({ Hue: value } as Partial<PictureInfo>)
					},
					50,
					1,
					'Adjust color hue',
				)
				createValueAction(
					'contrast',
					'Picture - Contrast',
					() => self.camera?.getState().pictureInfo?.Contrast,
					async (value) => {
						await self.camera!.setPictureInfo({ Contrast: value } as Partial<PictureInfo>)
					},
					50,
					1,
					'Adjust image contrast',
				)
				createValueAction(
					'saturation',
					'Picture - Saturation',
					() => self.camera?.getState().pictureInfo?.Saturation,
					async (value) => {
						await self.camera!.setPictureInfo({ Saturation: value } as Partial<PictureInfo>)
					},
					50,
					1,
					'Adjust color saturation',
				)
				createValueAction(
					'defogLevel',
					'Picture - Defog Level',
					() => self.camera?.getState().pictureInfo?.DefogLevel,
					async (value) => {
						await self.camera!.setPictureInfo({ DefogLevel: value } as Partial<PictureInfo>)
					},
					50,
					1,
					'Adjust defog level',
				)
				actions['deflicker'] = {
					name: 'Picture - Deflicker',
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
				actions['scene'] = {
					name: 'Picture - Scene',
					options: [
						{
							type: 'dropdown',
							label: 'Scene',
							choices: [
								{ label: 'Standard', id: 1 },
								{ label: 'Bright', id: 3 },
								{ label: 'Clarity', id: 4 },
								{ label: 'Soft', id: 5 },
							],
							default: 1,
							id: 'scene',
						},
					],
					description: 'Set the scene mode',
					callback: async (action) => {
						if (!self.camera) return
						const sceneNumber = action.options.scene as number
						await self.camera.setPictureInfo({ Scene: sceneNumber } as unknown as PictureInfo)
					},
				}
				actions['defogMode'] = {
					name: 'Picture - Defog Mode',
					options: [
						{
							type: 'dropdown',
							label: 'Mode',
							choices: [
								{ label: 'OFF', id: 0 },
								{ label: 'Auto', id: 1 },
								{ label: 'Manual', id: 2 },
							],
							default: 0,
							id: 'mode',
						},
					],
					description: 'Set the defog mode',
					callback: async (action) => {
						if (!self.camera) return
						const modeNumber = action.options.mode as number
						await self.camera.setPictureInfo({ DefogMode: modeNumber } as unknown as PictureInfo)
					},
				}
				actions['effect'] = {
					name: 'Picture - Effect',
					options: [
						{
							type: 'dropdown',
							label: 'Effect',
							choices: [
								{ label: 'Day', id: 0 },
								{ label: 'Night', id: 1 },
							],
							default: 0,
							id: 'effect',
						},
					],
					description: 'Set the picture effect',
					callback: async (action) => {
						if (!self.camera) return
						const effectNumber = action.options.effect as number
						await self.camera.setPictureInfo({ Effect: effectNumber } as unknown as PictureInfo)
					},
				}

				// Check if camera has color matrix capabilities
				const hasColorMatrixCapability =
					!capabilitiesLoaded ||
					hasCapability('MagentaHue') ||
					hasCapability('RedHue') ||
					hasCapability('PictureInfo.MagentaHue') ||
					hasCapability('PictureInfo.RedHue')

				if (hasColorMatrixCapability) {
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
								isVisibleExpression: `$(options:adjustment) === 'set'`,
							},
						],
						description: 'Set the color matrix',
						callback: async (action) => {
							if (!self.camera) return
							const matrixOption = action.options.matrix as keyof PictureInfo
							if (action.options.adjustment === 'increase') {
								await self.camera.setPictureInfo({
									[matrixOption]: ((self.camera.getState().pictureInfo?.[matrixOption] as number) ?? 0) + 1,
								} as Partial<PictureInfo>)
							} else if (action.options.adjustment === 'decrease') {
								await self.camera.setPictureInfo({
									[matrixOption]: ((self.camera.getState().pictureInfo?.[matrixOption] as number) ?? 0) - 1,
								} as Partial<PictureInfo>)
							} else {
								const parsedValue = parseInt(action.options.value as string)
								if (isNaN(parsedValue)) {
									self.log('warn', 'Color matrix value must be a number')
									return
								}
								await self.camera.setPictureInfo({
									[matrixOption]: parsedValue,
								} as Partial<PictureInfo>)
							}
						},
					}
				}
			},
		},
		{
			capabilities: ['GammaInfo'],
			createActions: () => {
				createToggleAction(
					'wdr',
					'Gamma - WDR',
					() => self.camera?.getState().gammaInfo?.WDR,
					async (value) => {
						await self.camera!.setGammaInfo({ WDR: value } as Partial<GammaInfo>)
					},
					'Enable or disable wide dynamic range',
				)
				actions['gammaLevel'] = {
					name: 'Gamma - Level',
					options: [
						{
							type: 'dropdown',
							label: 'Level',
							choices: [
								{ label: 'Default', id: 0 },
								{ label: '0.45', id: 1 },
								{ label: '0.50', id: 2 },
								{ label: '0.55', id: 3 },
								{ label: '0.63', id: 4 },
							],
							default: 0,
							id: 'level',
						},
					],
					description: 'Set the gamma level',
					callback: async (action) => {
						if (!self.camera) return
						const levelNumber = action.options.level as number
						await self.camera.setGammaInfo({ Level: levelNumber } as unknown as Partial<GammaInfo>)
					},
				}
				createValueAction(
					'gammaBright',
					'Gamma - Bright',
					() => self.camera?.getState().gammaInfo?.Bright,
					async (value) => {
						await self.camera!.setGammaInfo({ Bright: value } as Partial<GammaInfo>)
					},
					50,
					1,
					'Set the gamma brightness level',
				)
				createValueAction(
					'wdrLevel',
					'Gamma - WDR Level',
					() => self.camera?.getState().gammaInfo?.WDRLevel,
					async (value) => {
						await self.camera!.setGammaInfo({ WDRLevel: value } as Partial<GammaInfo>)
					},
					50,
					1,
					'Set the wide dynamic range level',
				)

				createValueAction(
					'gain',
					'Exposure - Gain',
					() => self.camera?.getState().exposureInfo?.Gain,
					async (value) => {
						await self.camera!.setExposureInfo({ Gain: value } as Partial<ExposureInfo>)
					},
					50,
					1,
					'Adjust camera gain',
				)
				createValueAction(
					'gainLimit',
					'Exposure - Gain Limit',
					() => self.camera?.getState().exposureInfo?.GainLimit,
					async (value) => {
						await self.camera!.setExposureInfo({ GainLimit: value } as Partial<ExposureInfo>)
					},
					50,
					1,
					'Set maximum gain limit',
				)
				createValueAction(
					'expCompLevel',
					'Exposure - Compensation Level',
					() => self.camera?.getState().exposureInfo?.ExCompLevel,
					async (value) => {
						await self.camera!.setExposureInfo({ ExCompLevel: value } as Partial<ExposureInfo>)
					},
					50,
					1,
					'Adjust exposure compensation',
				)
				createToggleAction(
					'smartExposure',
					'Exposure - Smart Exposure',
					() => self.camera?.getState().exposureInfo?.SmartExposure,
					async (value) => {
						await self.camera!.setExposureInfo({ SmartExposure: value } as Partial<ExposureInfo>)
					},
					'Enable or disable smart exposure',
				)
			},
		},
		{
			capabilities: ['ExposureInfo', 'Exposure'],
			createActions: () => {
				// Shutter Speed action - uses dynamic map from capabilities

				const shutterSpeedMap = self.camera?.getShutterSpeedMapForActions() ?? {}
				const shutterSpeedChoices = sortShutterSpeedChoices(
					Object.entries(shutterSpeedMap).map(([value, label]) => ({
						label: label,
						id: Number.parseInt(value, 10),
					})),
				)

				if (shutterSpeedChoices.length > 0) {
					actions['shutterSpeed'] = {
						name: 'Exposure - Shutter Speed',
						options: [
							{
								type: 'dropdown',
								label: 'Adjustment',
								choices: setChoices,
								default: 'increase',
								id: 'adjustment',
							},
							{
								type: 'dropdown',
								label: 'Shutter Speed',
								choices: shutterSpeedChoices,
								default: shutterSpeedChoices[0]?.id ?? 9,
								id: 'speed',
								isVisibleExpression: `$(options:adjustment) === 'set'`,
							},
						],
						description: 'Set the shutter speed',
						callback: async (action) => {
							if (!self.camera || shutterSpeedChoices.length === 0) return
							const adjustment = action.options.adjustment as string
							const shutterSpeedMap = self.camera.getShutterSpeedMapForActions()
							const currentShutterSpeed = self.camera.getState().exposureInfo?.ShutterSpeed

							const shutterSpeedString =
								adjustment === 'set'
									? (shutterSpeedMap[action.options.speed as number] ?? '1/60')
									: getAdjacentShutterSpeedValue(
											shutterSpeedChoices,
											shutterSpeedMap,
											currentShutterSpeed,
											adjustment as 'increase' | 'decrease',
										)

							// Send the string value - setExposureInfo will convert to numeric for API
							await self.camera.setExposureInfo({ ShutterSpeed: shutterSpeedString } as Partial<ExposureInfo>)
						},
					}
				}

				let irisMap = self.camera?.getIrisMapForActions() ?? {}
				const irisRange = self.camera?.getIrisRangeForActions()

				// If we have a range but no map, convert the range to a map
				if (Object.keys(irisMap).length === 0 && irisRange) {
					irisMap = convertIrisRangeToMap(irisRange)
				}

				// If we have a map (either from enum or converted from range), create dropdown action
				// Note: irisMap is already filtered to common f-stops at build time
				if (Object.keys(irisMap).length > 0) {
					// Create sorted list of standard f-stop values for increase/decrease operations
					const irisChoices = sortIrisChoices(
						Object.entries(irisMap).map(([value, label]) => ({
							label: label,
							id: Number.parseInt(value, 10),
						})),
					)

					actions['iris'] = {
						name: 'Exposure - Iris',
						options: [
							{
								type: 'dropdown',
								label: 'Adjustment',
								choices: setChoices,
								default: 'increase',
								id: 'adjustment',
							},
							{
								type: 'dropdown',
								label: 'Iris',
								choices: irisChoices,
								default: irisChoices[0]?.id ?? 0,
								id: 'iris',
								isVisibleExpression: `$(options:adjustment) === 'set'`,
							},
						],
						description: 'Set the iris',
						callback: async (action) => {
							if (!self.camera || irisChoices.length === 0) return
							const adjustment = action.options.adjustment as string
							const currentIris = self.camera.getState().exposureInfo?.Iris

							const irisValue =
								adjustment === 'set'
									? (action.options.iris as number)
									: getAdjacentIrisValue(irisChoices, currentIris, adjustment as 'increase' | 'decrease')

							// The API expects the numeric enum value directly
							await self.camera.setExposureInfo({ Iris: irisValue } as Partial<ExposureInfo>)
						},
					}
				}
			},
		},
		{
			capabilities: ['PTZFPosition'],
			createActions: () => {
				actions['ptzPosition'] = {
					name: 'PTZ - Set Position (Absolute)',
					options: [
						{
							type: 'textinput',
							label: 'Pan Position',
							default: '0',
							id: 'panPosition',
							useVariables: true,
						},
						{
							type: 'textinput',
							label: 'Tilt Position',
							default: '0',
							id: 'tiltPosition',
							useVariables: true,
						},
						{
							type: 'textinput',
							label: 'Zoom Position',
							default: '0',
							id: 'zoomPosition',
							useVariables: true,
						},
						{
							type: 'textinput',
							label: 'Pan Tilt Speed',
							default: '0',
							id: 'panTiltSpeed',
							useVariables: true,
						},
						{
							type: 'textinput',
							label: 'Zoom Speed',
							default: '0',
							id: 'zoomSpeed',
							useVariables: true,
						},
					],
					description: 'Set the PTZ position using absolute numerical values',
					callback: async (action) => {
						if (!self.camera) return
						const panPosition = parseInt(action.options.panPosition as string)
						const tiltPosition = parseInt(action.options.tiltPosition as string)
						const zoomPosition = parseInt(action.options.zoomPosition as string)
						const panTiltSpeed = parseInt(action.options.panTiltSpeed as string)
						const zoomSpeed = parseInt(action.options.zoomSpeed as string)

						if (
							isNaN(panPosition) ||
							isNaN(tiltPosition) ||
							isNaN(zoomPosition) ||
							isNaN(panTiltSpeed) ||
							isNaN(zoomSpeed)
						) {
							self.log('warn', 'All PTZ position values must be numbers')
							return
						}

						await self.camera.setPTZPosition({
							PanPosition: panPosition,
							TiltPosition: tiltPosition,
							ZoomPosition: zoomPosition,
							PanTiltSpeed: panTiltSpeed,
							ZoomSpeed: zoomSpeed,
						} as PTZFPosition)
					},
				}
				actions['ptzRelPosition'] = {
					name: 'PTZ - Adjust Position (Relative)',
					options: [
						{
							type: 'textinput',
							label: 'Pan Adjustment',
							default: '0',
							id: 'panPosition',
							useVariables: true,
						},
						{
							type: 'textinput',
							label: 'Tilt Adjustment',
							default: '0',
							id: 'tiltPosition',
							useVariables: true,
						},
						{
							type: 'textinput',
							label: 'Pan Tilt Speed',
							default: '0',
							id: 'panTiltSpeed',
							useVariables: true,
						},
					],
					description: 'Adjust the PTZ position using relative numerical values',
					callback: async (action) => {
						if (!self.camera) return
						const panPosition = parseInt(action.options.panPosition as string)
						const tiltPosition = parseInt(action.options.tiltPosition as string)
						const panTiltSpeed = parseInt(action.options.panTiltSpeed as string)

						if (isNaN(panPosition) || isNaN(tiltPosition) || isNaN(panTiltSpeed)) {
							self.log('warn', 'All PTZ position values must be numbers')
							return
						}

						await self.camera.setPTZRelPosition({
							PanPosition: panPosition,
							TiltPosition: tiltPosition,
							PanTiltSpeed: panTiltSpeed,
						})
					},
				}
			},
		},
		{
			capabilities: ['OverlayInfo'],
			createActions: () => {
				actions['overlayControl'] = {
					name: 'Overlay Control',
					options: [
						{
							type: 'dropdown',
							label: 'Overlay',
							tooltip: 'Overlays 5 (Logo) & 8 (Date) cannot accept text changes',
							choices: [
								{ label: 'Overlay 1', id: 1 },
								{ label: 'Overlay 2', id: 2 },
								{ label: 'Overlay 3', id: 3 },
								{ label: 'Overlay 4', id: 4 },
								{ label: 'Overlay 5', id: 5 },
								{ label: 'Overlay 6', id: 6 },
								{ label: 'Overlay 7', id: 7 },
								{ label: 'Overlay 8', id: 8 },
							],
							default: 1,
							id: 'overlay',
						},
						{
							type: 'multidropdown',
							label: 'Properties',
							choices: [
								{ label: 'Enabled', id: 'enable' },
								{ label: 'Text', id: 'text' },
								{ label: 'Text Color', id: 'textColor' },
								{ label: 'Position (X)', id: 'positionX' },
								{ label: 'Position (Y)', id: 'positionY' },
							],
							default: ['enable'],
							id: 'props',
						},
						{
							type: 'dropdown',
							label: 'Mode',
							choices: [
								{ label: 'Toggle', id: 'toggle' },
								{ label: 'Enable', id: 'true' },
								{ label: 'Disable', id: 'false' },
							],
							default: 'true',
							id: 'mode',
							isVisibleExpression: `arrayIncludes($(options:props), 'enable')`,
						},
						{
							type: 'textinput',
							label: 'Text',
							default: 'Overlay',
							id: 'text',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'text') && $(options:overlay) !== 5 && $(options:overlay) !== 8`,
						},
						{
							type: 'dropdown',
							label: 'Text Color',
							choices: [
								{ label: 'White', id: 'white' },
								{ label: 'Black', id: 'black' },
								{ label: 'Yellow', id: 'yellow' },
								{ label: 'Red', id: 'red' },
								{ label: 'Blue', id: 'blue' },
							],
							default: 'white',
							id: 'textColor',
							isVisibleExpression: `arrayIncludes($(options:props), 'textColor') && $(options:overlay) !== 5`,
						},
						{
							type: 'textinput',
							label: 'Position (X)',
							tooltip: 'Origin is the top left corner',
							default: '0',
							id: 'positionX',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'positionX')`,
						},
						{
							type: 'textinput',
							label: 'Position (Y)',
							tooltip: 'Origin is the top left corner',
							default: '0',
							id: 'positionY',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'positionY')`,
						},
					],
					description: 'Set the overlay control',
					callback: async (action) => {
						if (!self.camera) return
						const props = action.options.props as string[]

						const overlayInfo: Partial<OverlayInfo> = {
							Channel: action.options.overlay as number,
						}

						for (const prop of props) {
							if (prop === 'enable') {
								const enable =
									action.options.mode === 'toggle'
										? !self.camera.getState().overlayInfo?.[(action.options.overlay as number) - 1]?.Enable
										: action.options.mode === 'true'
											? true
											: false
								overlayInfo.Enable = enable
							}
							if (prop === 'text') {
								overlayInfo.Text = action.options.text as string
							}
							if (prop === 'textColor') {
								overlayInfo.Color = action.options.textColor as string
							}
							if (prop === 'positionX') {
								const posX = parseInt(action.options.positionX as string)
								if (isNaN(posX)) {
									self.log('warn', 'Position X must be a number')
									return
								}
								overlayInfo.PosX = posX
							}
							if (prop === 'positionY') {
								const posY = parseInt(action.options.positionY as string)
								if (isNaN(posY)) {
									self.log('warn', 'Position Y must be a number')
									return
								}
								overlayInfo.PosY = posY
							}
						}

						await self.camera.setOverlayInfo(overlayInfo)
					},
				}
			},
		},
		{
			capabilities: ['RTSPInfo'],
			createActions: () => {
				actions['rtspControl'] = {
					name: 'Stream - RTSP Control',
					description: 'Control RTSP stream settings',
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							choices: [
								{ label: 'Main Stream (0)', id: 0 },
								{ label: 'Substream (1)', id: 1 },
							],
							default: 0,
							id: 'channel',
						},
						{
							type: 'multidropdown',
							label: 'Properties',
							choices: [
								{ label: 'Enable', id: 'enable' },
								{ label: 'Port', id: 'port' },
								{ label: 'Stream Key', id: 'streamKey' },
								{ label: 'Auth Enable', id: 'authEnable' },
							],
							default: ['enable'],
							id: 'props',
						},
						{
							type: 'dropdown',
							label: 'Enable',
							choices: toggleChoices,
							default: 'toggle',
							id: 'enable',
							isVisibleExpression: `arrayIncludes($(options:props), 'enable')`,
						},
						{
							type: 'textinput',
							label: 'Port',
							default: '',
							id: 'port',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'port')`,
						},
						{
							type: 'textinput',
							label: 'Stream Key',
							default: '',
							id: 'streamKey',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'streamKey')`,
						},
						{
							type: 'checkbox',
							label: 'Auth Enable',
							default: false,
							id: 'authEnable',
							isVisibleExpression: `arrayIncludes($(options:props), 'authEnable')`,
						},
					],
					callback: async (action) => {
						if (!self.camera) return
						const channel = action.options.channel as number
						const props = action.options.props as string[]
						const currentStream = self.camera.getState().rtspInfo?.find((s) => s.Channel === channel)
						const currentEnable = currentStream?.Enable ?? false

						const updateInfo: Partial<RTSPInfo> = {}

						for (const prop of props) {
							if (prop === 'enable') {
								let newEnable: boolean
								if (action.options.enable === 'toggle') {
									newEnable = !currentEnable
								} else {
									newEnable = action.options.enable === 'true' ? true : false
								}
								updateInfo.Enable = newEnable
							}
							if (prop === 'port') {
								if (action.options.port) {
									const port = parseInt(action.options.port as string)
									if (!isNaN(port)) {
										updateInfo.Port = port
									}
								}
							}
							if (prop === 'streamKey') {
								if (action.options.streamKey) {
									updateInfo.StreamKey = action.options.streamKey as string
								}
							}
							if (prop === 'authEnable') {
								if (action.options.authEnable !== undefined) {
									updateInfo.AuthEnable = action.options.authEnable as boolean
								}
							}
						}

						await self.camera.setRTSPInfo(channel, updateInfo)
					},
				}
			},
		},
		{
			capabilities: ['RTMPInfo'],
			createActions: () => {
				actions['rtmpControl'] = {
					name: 'Stream - RTMP Control',
					description: 'Control RTMP stream settings',
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							choices: [
								{ label: 'Main Stream (0)', id: 0 },
								{ label: 'Substream (1)', id: 1 },
							],
							default: 0,
							id: 'channel',
						},
						{
							type: 'multidropdown',
							label: 'Properties',
							choices: [
								{ label: 'Enable', id: 'enable' },
								{ label: 'Port', id: 'port' },
								{ label: 'Url', id: 'url' },
								{ label: 'Stream Key', id: 'streamKey' },
								{ label: 'Video Tag Header', id: 'videoTagHeader' },
							],
							default: ['enable'],
							id: 'props',
						},
						{
							type: 'dropdown',
							label: 'Enable',
							choices: toggleChoices,
							default: 'toggle',
							id: 'enable',
							isVisibleExpression: `arrayIncludes($(options:props), 'enable')`,
						},
						{
							type: 'textinput',
							label: 'Port',
							default: '',
							id: 'port',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'port')`,
						},
						{
							type: 'textinput',
							label: 'Url',
							default: '',
							id: 'url',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'url')`,
						},
						{
							type: 'textinput',
							label: 'Stream Key',
							default: '',
							id: 'streamKey',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'streamKey')`,
						},
						{
							type: 'textinput',
							label: 'Video Tag Header',
							default: '',
							id: 'videoTagHeader',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'videoTagHeader')`,
						},
					],
					callback: async (action) => {
						if (!self.camera) return
						const channel = action.options.channel as number
						const props = action.options.props as string[]
						const currentStream = self.camera.getState().rtmpInfo?.find((s) => s.Channel === channel)
						const currentEnable = currentStream?.Enable ?? false

						const updateInfo: Partial<RTMPInfo> = {}

						for (const prop of props) {
							if (prop === 'enable') {
								let newEnable: boolean
								if (action.options.enable === 'toggle') {
									newEnable = !currentEnable
								} else {
									newEnable = action.options.enable === 'true' ? true : false
								}
								updateInfo.Enable = newEnable
							}
							if (prop === 'port') {
								if (action.options.port) {
									const port = parseInt(action.options.port as string)
									if (!isNaN(port)) {
										updateInfo.Port = port
									}
								}
							}
							if (prop === 'url') {
								if (action.options.url) {
									updateInfo.Url = action.options.url as string
								}
							}
							if (prop === 'streamKey') {
								if (action.options.streamKey) {
									updateInfo.StreamKey = action.options.streamKey as string
								}
							}
							if (prop === 'videoTagHeader') {
								if (action.options.videoTagHeader) {
									const videoTagHeader = parseInt(action.options.videoTagHeader as string)
									if (!isNaN(videoTagHeader)) {
										updateInfo.VideoTagHeader = videoTagHeader
									}
								}
							}
						}

						await self.camera.setRTMPInfo(channel, updateInfo)
					},
				}
			},
		},
		{
			capabilities: ['AVOverUDPInfo'],
			createActions: () => {
				actions['avOverUDPControl'] = {
					name: 'Stream - AV Over UDP Control',
					description: 'Control AV over UDP stream settings',
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							choices: [
								{ label: 'Main Stream (0)', id: 0 },
								{ label: 'Substream (1)', id: 1 },
							],
							default: 0,
							id: 'channel',
						},
						{
							type: 'multidropdown',
							label: 'Properties',
							choices: [
								{ label: 'Enable', id: 'enable' },
								{ label: 'Address', id: 'address' },
								{ label: 'Port', id: 'port' },
							],
							default: ['enable'],
							id: 'props',
						},
						{
							type: 'dropdown',
							label: 'Enable',
							choices: toggleChoices,
							default: 'toggle',
							id: 'enable',
							isVisibleExpression: `arrayIncludes($(options:props), 'enable')`,
						},
						{
							type: 'textinput',
							label: 'Address',
							default: '',
							id: 'address',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'address')`,
						},
						{
							type: 'textinput',
							label: 'Port',
							default: '',
							id: 'port',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'port')`,
						},
					],
					callback: async (action) => {
						if (!self.camera) return
						const channel = action.options.channel as number
						const props = action.options.props as string[]
						const currentStream = self.camera.getState().avOverUDPInfo?.find((s) => s.Channel === channel)
						const currentEnable = currentStream?.Enable ?? false

						const updateInfo: Partial<AVOverUDPInfo> = {}

						for (const prop of props) {
							if (prop === 'enable') {
								let newEnable: boolean
								if (action.options.enable === 'toggle') {
									newEnable = !currentEnable
								} else {
									newEnable = action.options.enable === 'true' ? true : false
								}
								updateInfo.Enable = newEnable
							}
							if (prop === 'address') {
								if (action.options.address) {
									updateInfo.Address = action.options.address as string
								}
							}
							if (prop === 'port') {
								if (action.options.port) {
									const port = parseInt(action.options.port as string)
									if (!isNaN(port)) {
										updateInfo.Port = port
									}
								}
							}
						}

						await self.camera.setAVOverUDPInfo(channel, updateInfo)
					},
				}
			},
		},
		{
			capabilities: ['AVOverRTPInfo'],
			createActions: () => {
				actions['avOverRTPControl'] = {
					name: 'Stream - AV Over RTP Control',
					description: 'Control AV over RTP stream settings',
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							choices: [
								{ label: 'Main Stream (0)', id: 0 },
								{ label: 'Substream (1)', id: 1 },
							],
							default: 0,
							id: 'channel',
						},
						{
							type: 'multidropdown',
							label: 'Properties',
							choices: [
								{ label: 'Enable', id: 'enable' },
								{ label: 'Address', id: 'address' },
								{ label: 'Port', id: 'port' },
							],
							default: ['enable'],
							id: 'props',
						},
						{
							type: 'dropdown',
							label: 'Enable',
							choices: toggleChoices,
							default: 'toggle',
							id: 'enable',
							isVisibleExpression: `arrayIncludes($(options:props), 'enable')`,
						},
						{
							type: 'textinput',
							label: 'Address',
							default: '',
							id: 'address',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'address')`,
						},
						{
							type: 'textinput',
							label: 'Port',
							default: '',
							id: 'port',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'port')`,
						},
					],
					callback: async (action) => {
						if (!self.camera) return
						const channel = action.options.channel as number
						const props = action.options.props as string[]
						const currentStream = self.camera.getState().avOverRTPInfo?.find((s) => s.Channel === channel)
						const currentEnable = currentStream?.Enable ?? false

						const updateInfo: Partial<AVOverRTPInfo> = {}

						for (const prop of props) {
							if (prop === 'enable') {
								let newEnable: boolean
								if (action.options.enable === 'toggle') {
									newEnable = !currentEnable
								} else {
									newEnable = action.options.enable === 'true' ? true : false
								}
								updateInfo.Enable = newEnable
							}
							if (prop === 'address') {
								if (action.options.address) {
									updateInfo.Address = action.options.address as string
								}
							}
							if (prop === 'port') {
								if (action.options.port) {
									const port = parseInt(action.options.port as string)
									if (!isNaN(port)) {
										updateInfo.Port = port
									}
								}
							}
						}

						await self.camera.setAVOverRTPInfo(channel, updateInfo)
					},
				}
			},
		},
		{
			capabilities: ['NDIInfo'],
			createActions: () => {
				actions['ndiControl'] = {
					name: 'Stream - NDI Control',
					description: 'Control NDI stream settings',
					options: [
						{
							type: 'multidropdown',
							label: 'Properties',
							choices: [
								{ label: 'NDI Enable', id: 'ndiEnable' },
								{ label: 'NDI Name', id: 'ndiName' },
								{ label: 'NDI HX Bandwidth', id: 'ndiHXBandwidth' },
							],
							default: ['ndiEnable'],
							id: 'props',
						},
						{
							type: 'dropdown',
							label: 'NDI Enable',
							choices: toggleChoices,
							default: 'toggle',
							id: 'ndiEnable',
							isVisibleExpression: `arrayIncludes($(options:props), 'ndiEnable')`,
						},
						{
							type: 'textinput',
							label: 'NDI Name',
							default: '',
							id: 'ndiName',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'ndiName')`,
						},
						{
							type: 'textinput',
							label: 'NDI HX Bandwidth',
							default: '0',
							id: 'ndiHXBandwidth',
							useVariables: true,
							isVisibleExpression: `arrayIncludes($(options:props), 'ndiHXBandwidth')`,
						},
					],
					callback: async (action) => {
						if (!self.camera) return
						const props = action.options.props as string[]
						const currentNDI = self.camera.getState().ndiInfo
						const currentEnable = currentNDI?.NDIEnable ?? false

						const updateInfo: Partial<NDIInfo> = {}

						for (const prop of props) {
							if (prop === 'ndiEnable') {
								let newEnable: boolean
								if (action.options.ndiEnable === 'toggle') {
									newEnable = !currentEnable
								} else {
									newEnable = action.options.ndiEnable === 'true' ? true : false
								}
								updateInfo.NDIEnable = newEnable
							}
							if (prop === 'ndiName') {
								if (action.options.ndiName) {
									updateInfo.NDIName = action.options.ndiName as string
								}
							}
							if (prop === 'ndiHXBandwidth') {
								if (action.options.ndiHXBandwidth) {
									const bandwidth = parseInt(action.options.ndiHXBandwidth as string)
									if (!isNaN(bandwidth)) {
										updateInfo.NDIHXBandwidth = bandwidth
									}
								}
							}
						}

						await self.camera.setNDIInfo(updateInfo)
					},
				}
			},
		},
	]

	// Filter and create actions based on capabilities
	for (const mapping of actionMappings) {
		if (
			!capabilitiesLoaded ||
			mapping.capabilities.length === 0 ||
			mapping.capabilities.some((cap) => hasCapability(cap))
		) {
			mapping.createActions()
		}
	}

	self.setActionDefinitions(actions)
}
