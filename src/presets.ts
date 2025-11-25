import { CompanionPresetDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { graphics } from 'companion-module-utils'
import { sortIrisChoices, convertIrisRangeToMap } from './utils.js'

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions = {}

	const ptzDirections = [
		{ key: 'ptzUp', name: 'PTZ Up', iconType: 'directionUp' as const, direction: 'Up' },
		{ key: 'ptzDown', name: 'PTZ Down', iconType: 'directionDown' as const, direction: 'Down' },
		{ key: 'ptzLeft', name: 'PTZ Left', iconType: 'directionLeft' as const, direction: 'Left' },
		{ key: 'ptzRight', name: 'PTZ Right', iconType: 'directionRight' as const, direction: 'Right' },
		{ key: 'ptzLeftUp', name: 'PTZ Left Up', iconType: 'directionUpLeft' as const, direction: 'LeftUp' },
		{ key: 'ptzRightUp', name: 'PTZ Right Up', iconType: 'directionUpRight' as const, direction: 'RightUp' },
		{ key: 'ptzLeftDown', name: 'PTZ Left Down', iconType: 'directionDownLeft' as const, direction: 'LeftDown' },
		{ key: 'ptzRightDown', name: 'PTZ Right Down', iconType: 'directionDownRight' as const, direction: 'RightDown' },
	] as const

	presets['ptzControlHeaderMovement'] = {
		category: 'PTZ Control',
		name: 'Camera Movement',
		type: 'text',
		text: '',
	}
	for (const { key, name, iconType, direction } of ptzDirections) {
		presets[key] = {
			type: 'button',
			category: 'PTZ Control',
			name: name,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: '',
				size: 24,
				png64: graphics.toPNG64({
					image: graphics.icon({ width: 50, height: 50, type: iconType }),
					width: 50,
					height: 50,
				}),
			},
			steps: [
				{
					down: [
						{
							actionId: 'ptMove',
							options: {
								direction: direction,
								speed: '128',
							},
						},
					],
					up: [
						{
							actionId: 'ptMove',
							options: {
								direction: 'Stop',
								speed: '128',
							},
						},
					],
				},
			],
			feedbacks: [],
		}
	}
	presets[`home`] = {
		type: 'button',
		category: 'PTZ Control',
		name: 'Go Home',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `HOME`,
			size: '14',
		},
		steps: [
			{
				down: [
					{
						actionId: 'goHome',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets[`presetZoomIn`] = {
		type: 'button',
		category: 'PTZ Control',
		name: 'Zoom In',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `ZOOM\\nIN`,
			size: '14',
		},
		steps: [
			{
				down: [
					{
						actionId: 'zoom',
						options: {
							direction: 'Tele',
							speed: '5',
						},
					},
				],
				up: [
					{
						actionId: 'zoom',
						options: {
							direction: 'Stop',
							speed: '5',
						},
					},
				],
			},
		],
		feedbacks: [],
	}
	presets[`presetZoomOut`] = {
		type: 'button',
		category: 'PTZ Control',
		name: 'Zoom Out',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `ZOOM\\nOUT`,
			size: '14',
		},
		steps: [
			{
				down: [
					{
						actionId: 'zoom',
						options: {
							direction: 'Wide',
							speed: '5',
						},
					},
				],
				up: [
					{
						actionId: 'zoom',
						options: {
							direction: 'Stop',
							speed: '5',
						},
					},
				],
			},
		],
		feedbacks: [],
	}
	presets['presetFocusModeHeader'] = {
		category: 'Focus',
		name: 'Focus Mode',
		type: 'text',
		text: '',
	}
	presets[`presetFocusAuto`] = {
		type: 'button',
		category: 'Focus',
		name: 'Focus Auto',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `AUTO\\nFOCUS`,
			size: '14',
		},
		steps: [
			{
				down: [
					{
						actionId: 'focusMode',
						options: {
							mode: 'Auto',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'focusMode',
				options: {},
				style: {
					bgcolor: 0x009900,
				},
			},
		],
	}
	presets[`presetFocusManual`] = {
		type: 'button',
		category: 'Focus',
		name: 'Focus Manual',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `MANUAL\\nFOCUS`,
			size: '14',
		},
		steps: [
			{
				down: [
					{
						actionId: 'focusMode',
						options: {
							mode: 'Manual',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'focusMode',
				isInverted: true,
				options: {},
				style: {
					bgcolor: 0x009900,
				},
			},
		],
	}
	presets['presetMFHeader'] = {
		category: 'Focus',
		name: 'Manual Focus Control',
		type: 'text',
		text: '',
	}
	presets[`presetFocusNear`] = {
		type: 'button',
		category: 'Focus',
		name: 'Focus Near',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `FOCUS\\nNEAR`,
			size: '14',
		},
		steps: [
			{
				down: [
					{
						actionId: 'focusMode',
						options: {
							mode: 'Manual',
						},
					},
					{
						actionId: 'focus',
						options: {
							direction: 'Near',
							speed: '5',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets[`presetFocusFar`] = {
		type: 'button',
		category: 'Focus',
		name: 'Focus Far',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `FOCUS\\nFAR`,
			size: '14',
		},
		steps: [
			{
				down: [
					{
						actionId: 'focusMode',
						options: {
							mode: 'Manual',
						},
					},
					{
						actionId: 'focus',
						options: {
							direction: 'Far',
							speed: '5',
						},
					},
				],
				up: [
					{
						actionId: 'zoom',
						options: {
							direction: 'Stop',
							speed: '5',
						},
					},
				],
			},
		],
		feedbacks: [],
	}

	presets['presetMFSpeedHeader'] = {
		category: 'Focus',
		name: 'Manual Focus Speed',
		type: 'text',
		text: '',
	}
	presets['presetMFSpeedIncrease'] = {
		type: 'button',
		category: 'Focus',
		name: 'MF Speed Increase',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `INCREASE\\nMF SPEED`,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'mfSpeed',
						options: {
							adjustment: 'increase',
							value: '1',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['presetMFSpeedValue'] = {
		type: 'button',
		category: 'Focus',
		name: 'MF Speed Value',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `MF SPEED\\n$(bolin-ptz:mf_speed)`,
			size: 12,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['presetMFSpeedDecrease'] = {
		type: 'button',
		category: 'Focus',
		name: 'MF Speed Decrease',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `DECREASE\\nMF SPEED`,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'mfSpeed',
						options: {
							adjustment: 'decrease',
							value: '1',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['presetAFSensitivityHeader'] = {
		category: 'Focus',
		name: 'Auto Focus Sensitivity',
		type: 'text',
		text: '',
	}
	const afSensitivityModes = {
		Low: 'Low',
		Middle: 'Middle',
		High: 'High',
	}
	for (const [key, value] of Object.entries(afSensitivityModes)) {
		presets[`presetAFSensitivity${key}`] = {
			type: 'button',
			category: 'Focus',
			name: `AF Sensitivity ${key}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `AF SENS\\n${key}`,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'afSensitivity',
							options: {
								sensitivity: value,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'afSensitivity',
					options: {
						sensitivity: value,
					},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

	presets['ptzControlHeaderpositionLimit'] = {
		category: 'PTZ Control',
		name: 'Position Limits',
		type: 'text',
		text: '',
	}
	for (const limit of ['Up', 'Down', 'Left', 'Right']) {
		presets[`positionLimit${limit}`] = {
			type: 'button',
			category: 'PTZ Control',
			name: `Position Limit ${limit}}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `LOCK\\n${limit}`,
				size: 14,
			},
			steps: [
				{
					down: [
						{
							actionId: 'setPositionLimits',
							options: {
								direction: [`${limit}Limit`],
								lock: 'toggle',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'positionLimitEnabled',
					options: {
						direction: `${limit}Limit`,
					},
					style: {
						bgcolor: 0xcc0000,
						text: `${limit} LOCKED`,
					},
				},
			],
		}
	}

	presets['ptzControlHeaderDirection'] = {
		category: 'PTZ Control',
		name: 'Direction Invert',
		type: 'text',
		text: '',
	}

	// Pan Direction Invert presets
	for (const mode of [
		{ id: 'toggle', label: 'Toggle', text: 'PAN\\nINVERT\\n$(bolin-ptz:pan_direction)' },
		{ id: 'true', label: 'On', text: 'PAN\\nINVERT\\nON' },
		{ id: 'false', label: 'Off', text: 'PAN\\nINVERT\\nOFF' },
	]) {
		presets[`presetPanDirectionInvert${mode.label}`] = {
			type: 'button',
			category: 'PTZ Control',
			name: `Pan Direction Invert ${mode.label}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: mode.text,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'panDirectionInverted',
							options: {
								mode: mode.id,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'panDirectionInverted',
					isInverted: mode.id === 'false' ? true : false,
					options: {},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

	// Tilt Direction Invert presets
	for (const mode of [
		{ id: 'toggle', label: 'Toggle', text: 'TILT\\nINVERT\\n$(bolin-ptz:tilt_direction)' },
		{ id: 'true', label: 'On', text: 'TILT\\nINVERT\\nON' },
		{ id: 'false', label: 'Off', text: 'TILT\\nINVERT\\nOFF' },
	]) {
		presets[`presetTiltDirectionInvert${mode.label}`] = {
			type: 'button',
			category: 'PTZ Control',
			name: `Tilt Direction Invert ${mode.label}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: mode.text,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'tiltDirectionInverted',
							options: {
								mode: mode.id,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'tiltDirectionInverted',
					isInverted: mode.id === 'false' ? true : false,
					options: {},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

	const cameraPresets = self.camera?.getState().presets ?? []
	// Create a map of preset numbers to preset info for quick lookup
	const presetMap = new Map<number, { Name: string; Number: number }>()
	for (const preset of cameraPresets) {
		presetMap.set(preset.Number, preset)
	}

	presets['presetCallHeader'] = {
		category: 'PTZ Presets',
		name: 'Call Presets',
		type: 'text',
		text: '',
	}

	// Always create presets for values 1-12, even if they don't exist on the camera
	for (let presetNumber = 1; presetNumber <= 12; presetNumber++) {
		const preset = presetMap.get(presetNumber)
		const presetName = preset?.Name ?? `Preset ${presetNumber}`
		const presetNumberStr = presetNumber.toString()

		presets[`presetCall${presetNumberStr}`] = {
			type: 'button',
			category: 'PTZ Presets',
			name: 'Call ' + presetName + ' (' + presetNumber + ')',
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `CALL\\n${presetName}`,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'presetControl',
							options: {
								command: 'Call',
								preset: presetNumber,
								customPreset: preset?.Name ? false : true,
								customPresetNumber: presetNumber,
								customPresetName: `Preset ${presetNumber}`,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	presets['presetSaveHeader'] = {
		category: 'PTZ Presets',
		name: 'Save Presets',
		type: 'text',
		text: '',
	}

	for (let presetNumber = 1; presetNumber <= 12; presetNumber++) {
		const preset = presetMap.get(presetNumber)
		const presetName = preset?.Name ?? `Preset ${presetNumber}`
		const presetNumberStr = presetNumber.toString()

		presets[`presetSave${presetNumberStr}`] = {
			type: 'button',
			category: 'PTZ Presets',
			name: 'Save ' + presetName + ' (' + presetNumber + ')',
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `SAVE\\n${presetName}`,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'presetControl',
							options: {
								command: 'Set',
								preset: presetNumber,
								customPreset: preset?.Name ? false : true,
								customPresetNumber: presetNumber,
								customPresetName: `Preset ${presetNumber}`,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	presets['presetWhiteBalanceHeader'] = {
		category: 'White Balance',
		name: 'White Balance Modes',
		type: 'text',
		text: '',
	}

	const whiteBalanceModes = {
		Auto: 0,
		Indoor: 1,
		Outdoor: 2,
		OPW: 3,
		ATW: 4,
		User: 5,
		SVL: 8,
		ManualColorTemperature: 10,
	}
	for (const [key, value] of Object.entries(whiteBalanceModes)) {
		presets[`presetWhiteBalance${key}`] = {
			type: 'button',
			category: 'White Balance',
			name: 'White Balance ' + key,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `WB MODE\\n${key}`,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'whiteBalanceMode',
							options: {
								mode: value,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'whiteBalanceMode',
					options: {
						mode: key,
					},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

	presets['presetWhiteBalanceSensitivityHeader'] = {
		category: 'White Balance',
		name: 'White Balance Sensitivity',
		type: 'text',
		text: '',
	}

	const whiteBalanceSensitivityModes = {
		Low: 0,
		Middle: 1,
		High: 2,
	}
	for (const [key, value] of Object.entries(whiteBalanceSensitivityModes)) {
		presets[`presetWhiteBalanceSensitivity${key}`] = {
			type: 'button',
			category: 'White Balance',
			name: 'White Balance Sensitivity ' + key,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `WB SENS\\n${key}`,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'whiteBalanceSensitivity',
							options: {
								sensitivity: value,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'whiteBalanceSensitivity',
					options: {
						sensitivity: value,
					},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

	presets['presetWhiteBalanceColorTemperatureHeader'] = {
		category: 'White Balance',
		name: 'White Balance Color Temperature',
		type: 'text',
		text: '',
	}
	presets['presetWhiteBalanceColorTemperatureIncrease'] = {
		type: 'button',
		category: 'White Balance',
		name: 'White Balance Color Temperature',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `INCREASE\\nCOLOR\\nTEMP`,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'colorTemperature',
						options: {
							adjustment: 'increase',
							value: 100,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['presetWhiteBalanceColorTemperatureValue'] = {
		type: 'button',
		category: 'White Balance',
		name: 'White Balance Color Temperature',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `WB\\nTEMP\\n$(bolin-ptz:wb_color_temperature)`,
			size: 12,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['presetWhiteBalanceColorTemperatureDecrease'] = {
		type: 'button',
		category: 'White Balance',
		name: 'White Balance Color Temperature',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `DECREASE\\nCOLOR\\nTEMP`,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'colorTemperature',
						options: {
							adjustment: 'decrease',
							value: 100,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}
	// Helper function to create white balance value presets
	function createWhiteBalanceValuePresets(
		color: string,
		type: string,
		option: string,
		variableId: string,
		textColor: number,
	): void {
		const baseName = `White Balance ${color} ${type}`
		const baseKey = `presetWhiteBalance${color}${type}`
		const colorUpper = color.toUpperCase()
		const typeUpper = type.toUpperCase()

		// Header
		presets[`${baseKey}Header`] = {
			category: 'White Balance',
			name: baseName,
			type: 'text',
			text: '',
		}

		// Increase
		presets[`${baseKey}Increase`] = {
			type: 'button',
			category: 'White Balance',
			name: `${baseName} Increase`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `INCREASE\\n${colorUpper}\\n${typeUpper}`,
				size: 12,
			},
			steps: [
				{
					down: [
						{
							actionId: 'whiteBalanceAdjustments',
							options: {
								option: option,
								adjustment: 'increase',
								value: '1',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}

		// Value Display
		presets[`${baseKey}Value`] = {
			type: 'button',
			category: 'White Balance',
			name: `${baseName} Value`,
			style: {
				bgcolor: 0x000000,
				color: textColor,
				text: `${colorUpper}\\n${typeUpper}\\n$(bolin-ptz:${variableId})`,
				size: 12,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}

		// Decrease
		presets[`${baseKey}Decrease`] = {
			type: 'button',
			category: 'White Balance',
			name: `${baseName} Decrease`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `DECREASE\\n${colorUpper}\\n${typeUpper}`,
				size: 12,
			},
			steps: [
				{
					down: [
						{
							actionId: 'whiteBalanceAdjustments',
							options: {
								option: option,
								adjustment: 'decrease',
								value: '1',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	// Create white balance value presets
	createWhiteBalanceValuePresets('Red', 'Gain', 'RGain', 'wb_r_gain', 0xff0000)
	createWhiteBalanceValuePresets('Blue', 'Gain', 'BGain', 'wb_b_gain', 0x0000ff)
	createWhiteBalanceValuePresets('Red', 'Tuning', 'RTuning', 'wb_r_tuning', 0xff0000)
	createWhiteBalanceValuePresets('Blue', 'Tuning', 'BTuning', 'wb_b_tuning', 0x0000ff)
	createWhiteBalanceValuePresets('Green', 'Tuning', 'GTuning', 'wb_g_tuning', 0x00ff00)

	// Picture Scene presets
	presets['presetPictureSceneHeader'] = {
		category: 'Picture',
		name: 'Scene',
		type: 'text',
		text: '',
	}
	const pictureScenes = {
		Standard: 1,
		Bright: 3,
		Clarity: 4,
		Soft: 5,
	}
	for (const [key, value] of Object.entries(pictureScenes)) {
		presets[`presetPictureScene${key}`] = {
			type: 'button',
			category: 'Picture',
			name: `Picture Scene ${key}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `SCENE\\n${key}`,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'scene',
							options: {
								scene: value,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'scene',
					options: {
						scene: value,
					},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

	// Picture Defog Mode presets
	presets['presetPictureDefogModeHeader'] = {
		category: 'Picture',
		name: 'Defog Mode',
		type: 'text',
		text: '',
	}
	const defogModes = {
		OFF: 0,
		Auto: 1,
		Manual: 2,
	}
	for (const [key, value] of Object.entries(defogModes)) {
		presets[`presetPictureDefogMode${key}`] = {
			type: 'button',
			category: 'Picture',
			name: `Picture Defog Mode ${key}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `DEFOG\\n${key}`,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'defogMode',
							options: {
								mode: value,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'defogMode',
					options: {
						mode: value,
					},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

	// Picture Effect presets
	presets['presetPictureEffectHeader'] = {
		category: 'Picture',
		name: 'Effect',
		type: 'text',
		text: '',
	}
	const pictureEffects = {
		Day: 0,
		Night: 1,
	}
	for (const [key, value] of Object.entries(pictureEffects)) {
		presets[`presetPictureEffect${key}`] = {
			type: 'button',
			category: 'Picture',
			name: `Picture Effect ${key}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `EFFECT\\n${key}`,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'effect',
							options: {
								effect: value,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'effect',
					options: {
						effect: value,
					},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

	// Picture Flip presets
	presets['presetPictureFlipHeader'] = {
		category: 'Picture',
		name: 'Flip',
		type: 'text',
		text: '',
	}
	for (const mode of [
		{ id: 'toggle', label: 'Toggle', text: 'FLIP\\n$(bolin-ptz:flip)' },
		{ id: 'true', label: 'On', text: 'FLIP\\nON' },
		{ id: 'false', label: 'Off', text: 'FLIP\\nOFF' },
	]) {
		presets[`presetPictureFlip${mode.label}`] = {
			type: 'button',
			category: 'Picture',
			name: `Picture Flip ${mode.label}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: mode.text,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'flip',
							options: {
								mode: mode.id,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'flip',
					isInverted: mode.id === 'false' ? true : false,
					options: {},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

	// Picture Mirror presets
	presets['presetPictureMirrorHeader'] = {
		category: 'Picture',
		name: 'Mirror',
		type: 'text',
		text: '',
	}
	for (const mode of [
		{ id: 'toggle', label: 'Toggle', text: 'MIRROR\\n$(bolin-ptz:mirror)' },
		{ id: 'true', label: 'On', text: 'MIRROR\\nON' },
		{ id: 'false', label: 'Off', text: 'MIRROR\\nOFF' },
	]) {
		presets[`presetPictureMirror${mode.label}`] = {
			type: 'button',
			category: 'Picture',
			name: `Picture Mirror ${mode.label}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: mode.text,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'mirror',
							options: {
								mode: mode.id,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'mirror',
					isInverted: mode.id === 'false' ? true : false,
					options: {},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

	// Picture HLC Mode presets
	presets['presetPictureHLCModeHeader'] = {
		category: 'Picture',
		name: 'HLC Mode',
		type: 'text',
		text: '',
	}
	for (const mode of [
		{ id: 'toggle', label: 'Toggle', text: 'HLC MODE\\n$(bolin-ptz:hlc_mode)' },
		{ id: 'true', label: 'On', text: 'HLC MODE\\nON' },
		{ id: 'false', label: 'Off', text: 'HLC MODE\\nOFF' },
	]) {
		presets[`presetPictureHLCMode${mode.label}`] = {
			type: 'button',
			category: 'Picture',
			name: `Picture HLC Mode ${mode.label}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: mode.text,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'hlcMode',
							options: {
								mode: mode.id,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'hlcMode',
					isInverted: mode.id === 'false' ? true : false,
					options: {},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

	// Picture BLC presets
	presets['presetPictureBLCHeader'] = {
		category: 'Picture',
		name: 'BLC',
		type: 'text',
		text: '',
	}
	for (const mode of [
		{ id: 'toggle', label: 'Toggle', text: 'BLC\\n$(bolin-ptz:blc)' },
		{ id: 'true', label: 'On', text: 'BLC\\nON' },
		{ id: 'false', label: 'Off', text: 'BLC\\nOFF' },
	]) {
		presets[`presetPictureBLC${mode.label}`] = {
			type: 'button',
			category: 'Picture',
			name: `Picture BLC ${mode.label}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: mode.text,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'blcMode',
							options: {
								mode: mode.id,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'blcMode',
					isInverted: mode.id === 'false' ? true : false,
					options: {},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

	// Helper function to create picture value presets
	function createPictureValuePresets(name: string, actionId: string, variableId: string, displayName: string): void {
		const baseKey = `presetPicture${name}`
		const displayUpper = displayName.toUpperCase().replace(/\s+/g, '\\n')

		// Header
		presets[`${baseKey}Header`] = {
			category: 'Picture',
			name: `${name}`,
			type: 'text',
			text: '',
		}

		// Increase
		presets[`${baseKey}Increase`] = {
			type: 'button',
			category: 'Picture',
			name: `Picture ${name} Increase`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `INCREASE\\n${displayUpper}`,
				size: 12,
			},
			steps: [
				{
					down: [
						{
							actionId: actionId,
							options: {
								adjustment: 'increase',
								value: '1',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}

		// Value Display
		presets[`${baseKey}Value`] = {
			type: 'button',
			category: 'Picture',
			name: `Picture ${name} Value`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `${displayUpper}\\n$(bolin-ptz:${variableId})`,
				size: 12,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}

		// Decrease
		presets[`${baseKey}Decrease`] = {
			type: 'button',
			category: 'Picture',
			name: `Picture ${name} Decrease`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `DECREASE\\n${displayUpper}`,
				size: 12,
			},
			steps: [
				{
					down: [
						{
							actionId: actionId,
							options: {
								adjustment: 'decrease',
								value: '1',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	// Create picture value presets
	createPictureValuePresets('2DNR', '2dnr', '2dnr', '2DNR')
	createPictureValuePresets('3DNR', '3dnr', '3dnr', '3DNR')
	createPictureValuePresets('Sharpness', 'sharpness', 'sharpness', 'Sharpness')
	createPictureValuePresets('Hue', 'hue', 'hue', 'Hue')
	createPictureValuePresets('Contrast', 'contrast', 'contrast', 'Contrast')
	createPictureValuePresets('Saturation', 'saturation', 'saturation', 'Saturation')
	createPictureValuePresets('Defog Level', 'defogLevel', 'defog_level', 'Defog Level')

	// Gamma Level presets
	presets['presetGammaLevelHeader'] = {
		category: 'Gamma',
		name: 'Gamma Level',
		type: 'text',
		text: '',
	}
	const gammaLevels = {
		Default: 0,
		'0.45': 1,
		'0.50': 2,
		'0.55': 3,
		'0.63': 4,
	}
	for (const [key, value] of Object.entries(gammaLevels)) {
		presets[`presetGammaLevel${key.replace('.', '_')}`] = {
			type: 'button',
			category: 'Gamma',
			name: `Gamma Level ${key}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `GAMMA\\n${key}`,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'gammaLevel',
							options: {
								level: value,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'gammaLevel',
					options: {
						level: value,
					},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

	// Gamma Bright presets
	presets['presetGammaBrightHeader'] = {
		category: 'Gamma',
		name: 'Gamma Bright',
		type: 'text',
		text: '',
	}
	presets['presetGammaBrightIncrease'] = {
		type: 'button',
		category: 'Gamma',
		name: 'Gamma Bright Increase',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `INCREASE\\nGAMMA\\nBRIGHT`,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'gammaBright',
						options: {
							adjustment: 'increase',
							value: '1',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['presetGammaBrightValue'] = {
		type: 'button',
		category: 'Gamma',
		name: 'Gamma Bright Value',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `GAMMA\\nBRIGHT\\n$(bolin-ptz:gamma_bright)`,
			size: 12,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['presetGammaBrightDecrease'] = {
		type: 'button',
		category: 'Gamma',
		name: 'Gamma Bright Decrease',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `DECREASE\\nGAMMA\\nBRIGHT`,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'gammaBright',
						options: {
							adjustment: 'decrease',
							value: '1',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	// Gamma WDR presets
	presets['presetGammaWDRHeader'] = {
		category: 'Gamma',
		name: 'Gamma WDR',
		type: 'text',
		text: '',
	}
	for (const mode of [
		{ id: 'toggle', label: 'Toggle', text: 'GAMMA\\nWDR\\n$(bolin-ptz:wdr)' },
		{ id: 'true', label: 'On', text: 'GAMMA\\nWDR\\nON' },
		{ id: 'false', label: 'Off', text: 'GAMMA\\nWDR\\nOFF' },
	]) {
		presets[`presetGammaWDR${mode.label}`] = {
			type: 'button',
			category: 'Gamma',
			name: `Gamma WDR ${mode.label}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: mode.text,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'wdr',
							options: {
								mode: mode.id,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'wdr',
					isInverted: mode.id === 'false' ? true : false,
					options: {},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

	// Gamma WDR Level presets
	presets['presetGammaWDRLevelHeader'] = {
		category: 'Gamma',
		name: 'Gamma WDR Level',
		type: 'text',
		text: '',
	}
	presets['presetGammaWDRLevelIncrease'] = {
		type: 'button',
		category: 'Gamma',
		name: 'Gamma WDR Level Increase',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `INCREASE\\nWDR\\nLEVEL`,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'wdrLevel',
						options: {
							adjustment: 'increase',
							value: '1',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['presetGammaWDRLevelValue'] = {
		type: 'button',
		category: 'Gamma',
		name: 'Gamma WDR Level Value',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `WDR\\nLEVEL\\n$(bolin-ptz:wdr_level)`,
			size: 12,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['presetGammaWDRLevelDecrease'] = {
		type: 'button',
		category: 'Gamma',
		name: 'Gamma WDR Level Decrease',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `DECREASE\\nWDR\\nLEVEL`,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'wdrLevel',
						options: {
							adjustment: 'decrease',
							value: '1',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['irisAdjustmentsHeader'] = {
		category: 'Iris',
		name: 'Iris Adjustments',
		type: 'text',
		text: '',
	}
	presets['presetIrisIncrease'] = {
		type: 'button',
		category: 'Iris',
		name: 'Iris Increase',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `INCREASE\\nIRIS`,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'iris',
						options: {
							adjustment: 'increase',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['presetIrisValue'] = {
		type: 'button',
		category: 'Iris',
		name: 'Iris Value',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `IRIS\\n$(bolin-ptz:iris)`,
			size: 12,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['presetIrisDecrease'] = {
		type: 'button',
		category: 'Iris',
		name: 'Iris Decrease',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `DECREASE\\nIRIS`,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'iris',
						options: {
							adjustment: 'decrease',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['irisSetValueHeader'] = {
		category: 'Iris',
		name: 'Iris Set Value',
		type: 'text',
		text: '',
	}
	// Create presets for each common iris value
	let irisMap = self.camera?.getIrisMapForActions() ?? {}
	const irisRange = self.camera?.getIrisRangeForActions()

	// If we have a range but no map, convert the range to a map
	if (Object.keys(irisMap).length === 0 && irisRange) {
		irisMap = convertIrisRangeToMap(irisRange)
	}

	// If we have a map (either from enum or converted from range), create presets
	if (Object.keys(irisMap).length > 0) {
		const irisEntries = sortIrisChoices(
			Object.entries(irisMap).map(([value, label]) => ({
				value: Number.parseInt(value, 10),
				label: label,
			})),
		)

		for (const { value, label } of irisEntries) {
			// Create a safe key for the preset ID (replace special characters)
			const safeLabel = label.replace(/[^a-zA-Z0-9]/g, '_')
			const presetKey = `presetIris_${safeLabel}`

			presets[presetKey] = {
				type: 'button',
				category: 'Iris',
				name: `Iris ${label}`,
				style: {
					bgcolor: 0x000000,
					color: 0xffffff,
					text: label,
					size: '14',
				},
				steps: [
					{
						down: [
							{
								actionId: 'iris',
								options: {
									adjustment: 'set',
									iris: value,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'iris',
						options: {
							iris: label,
						},
						style: {
							bgcolor: 0x009900,
						},
					},
				],
			}
		}
	}

	presets['shutterSpeedHeader'] = {
		category: 'Shutter Speed',
		name: 'Shutter Speed Adjustments',
		type: 'text',
		text: '',
	}
	presets['presetShutterSpeedIncrease'] = {
		type: 'button',
		category: 'Shutter Speed',
		name: 'Shutter Speed Increase',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `INCREASE\\nSHUTTER\\nSPEED`,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'shutterSpeed',
						options: {
							adjustment: 'increase',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['presetShutterSpeedValue'] = {
		type: 'button',
		category: 'Shutter Speed',
		name: 'Shutter Speed Value',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `SHUTTER\\nSPEED\\n$(bolin-ptz:shutter_speed)`,
			size: 12,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['presetShutterSpeedDecrease'] = {
		type: 'button',
		category: 'Shutter Speed',
		name: 'Shutter Speed Decrease',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `DECREASE\\nSHUTTER\\nSPEED`,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'shutterSpeed',
						options: {
							adjustment: 'decrease',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['shutterSpeedSetValueHeader'] = {
		category: 'Shutter Speed',
		name: 'Shutter Speed Set Value',
		type: 'text',
		text: '',
	}

	// Create presets for each shutter speed value
	const shutterSpeedMap = self.camera?.getShutterSpeedMapForActions() ?? {}
	if (Object.keys(shutterSpeedMap).length > 0) {
		const shutterSpeedEntries = Object.entries(shutterSpeedMap)
			.map(([value, label]) => ({
				value: Number.parseInt(value, 10),
				label: label,
			}))
			.sort((a, b) => {
				// Sort by numeric value from label (e.g., "1/60" -> 60, "1/1000" -> 1000)
				const aNum = Number.parseInt(a.label.split('/')[1] || '0', 10)
				const bNum = Number.parseInt(b.label.split('/')[1] || '0', 10)
				return aNum - bNum
			})

		for (const { value, label } of shutterSpeedEntries) {
			// Create a safe key for the preset ID (replace special characters)
			const safeLabel = label.replace(/[^a-zA-Z0-9]/g, '_')
			const presetKey = `presetShutterSpeed_${safeLabel}`

			presets[presetKey] = {
				type: 'button',
				category: 'Shutter Speed',
				name: `Shutter Speed ${label}`,
				style: {
					bgcolor: 0x000000,
					color: 0xffffff,
					text: label,
					size: '14',
				},
				steps: [
					{
						down: [
							{
								actionId: 'shutterSpeed',
								options: {
									adjustment: 'set',
									speed: value,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'shutterSpeed',
						options: {
							speed: label,
						},
						style: {
							bgcolor: 0x009900,
						},
					},
				],
			}
		}
	}
	presets['systemDeviceName'] = {
		type: 'button',
		category: 'System Info',
		name: 'Device Name',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `CAMERA\n$(bolin-ptz:device_name)`,
			size: 12,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['systemModel'] = {
		type: 'button',
		category: 'System Info',
		name: 'Model',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `MODEL\n$(bolin-ptz:model_name)`,
			size: 12,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['systemFormat'] = {
		type: 'button',
		category: 'System Info',
		name: 'Format',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `FORMAT\n$(bolin-ptz:system_format)`,
			size: 12,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}

	const capabilitiesLoaded = self.camera?.getStoredCameraCapabilities() !== null
	const hasOverlayCapability = !capabilitiesLoaded || (self.camera?.hasCapability('OverlayInfo') ?? false)

	if (hasOverlayCapability) {
		const overlayInfo = self.camera?.getState().overlayInfo ?? []

		presets['overlayHeader'] = {
			category: 'Overlay',
			name: 'Overlay Control',
			type: 'text',
			text: '',
		}

		// Create a preset for each overlay (1-8, but only if they exist in the state)
		for (let overlayNumber = 1; overlayNumber <= 8; overlayNumber++) {
			const overlay = overlayInfo.find((o) => o.Channel === overlayNumber)
			// Create preset even if overlay doesn't exist in state yet (it might be created later)
			const overlayName = overlay?.Text ? `Overlay ${overlayNumber} (${overlay.Text})` : `Overlay ${overlayNumber}`

			presets[`presetOverlay${overlayNumber}`] = {
				type: 'button',
				category: 'Overlay',
				name: overlayName,
				style: {
					bgcolor: 0x000000,
					color: 0xffffff,
					text: `OVERLAY\\n${overlayNumber}`,
					size: '14',
				},
				steps: [
					{
						down: [
							{
								actionId: 'overlayControl',
								options: {
									overlay: overlayNumber,
									props: ['enable'],
									mode: 'toggle',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'overlayEnabled',
						options: {
							channel: overlayNumber.toString(),
						},
						style: {
							bgcolor: 0x009900,
						},
					},
				],
			}
		}
	}

	self.setPresetDefinitions(presets)
}
