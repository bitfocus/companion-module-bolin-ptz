import { CompanionPresetDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { sortIrisChoices, convertIrisRangeToMap } from './utils.js'
import { icons } from './icons.js'

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions = {}

	// Check if capabilities have been loaded (used for conditional preset creation)
	const capabilitiesLoaded = self.camera?.getStoredCameraCapabilities() !== null

	const ptzDirections = [
		{ key: 'ptzUp', name: 'PTZ Up', iconType: 'arrowUp' as const, direction: 'Up' },
		{ key: 'ptzDown', name: 'PTZ Down', iconType: 'arrowDown' as const, direction: 'Down' },
		{ key: 'ptzLeft', name: 'PTZ Left', iconType: 'arrowLeft' as const, direction: 'Left' },
		{ key: 'ptzRight', name: 'PTZ Right', iconType: 'arrowRight' as const, direction: 'Right' },
		{ key: 'ptzLeftUp', name: 'PTZ Left Up', iconType: 'arrowUpLeft' as const, direction: 'LeftUp' },
		{ key: 'ptzRightUp', name: 'PTZ Right Up', iconType: 'arrowUpRight' as const, direction: 'RightUp' },
		{ key: 'ptzLeftDown', name: 'PTZ Left Down', iconType: 'arrowDownLeft' as const, direction: 'LeftDown' },
		{ key: 'ptzRightDown', name: 'PTZ Right Down', iconType: 'arrowDownRight' as const, direction: 'RightDown' },
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
				png64: icons[`${iconType}`],
				show_topbar: false,
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
			png64: icons.home,
			text: '',
			size: 14,
			show_topbar: false,
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
			text: '',
			size: '14',
			png64: icons.zoomIn,
			show_topbar: false,
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
			text: '',
			png64: icons.zoomOut,
			size: '14',
			show_topbar: false,
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
			size: 14,
			alignment: 'center:bottom',
			png64: icons.focusAuto,
			show_topbar: false,
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
			size: 14,
			alignment: 'center:bottom',
			png64: icons.focusManual,
			show_topbar: false,
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
			show_topbar: false,
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
			show_topbar: false,
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
			text: `Focus SPEED`,
			size: 14,
			alignment: 'center:bottom',
			png64: icons.circlePlus,
			show_topbar: false,
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
			text: `FOCUS SPEED\\n$(bolin-ptz:mf_speed)`,
			size: 12,
			alignment: 'center:bottom',
			png64: icons.speed,
			show_topbar: false,
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
			text: `Focus SPEED`,
			size: 14,
			alignment: 'center:bottom',
			png64: icons.circleMinus,
			show_topbar: false,
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
				show_topbar: false,
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
				alignment: 'center:bottom',
				png64: icons.unlocked,
				show_topbar: false,
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
						text: `UNLOCK\\n${limit}`,
						png64: icons.lock,
					},
				},
			],
		}
	}
	presets[`positionLimitLockAll`] = {
		type: 'button',
		category: 'PTZ Control',
		name: `Position Limit Lock All`,
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `LOCK\\nAll`,
			size: 14,
			alignment: 'center:bottom',
			png64: icons.lock,
			show_topbar: false,
		},
		steps: [
			{
				down: [
					{
						actionId: 'setPositionLimits',
						options: {
							direction: [`UpLimit`, `DownLimit`, `LeftLimit`, `RightLimit`],
							lock: 'true',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets[`positionLimitUnlockAll`] = {
		type: 'button',
		category: 'PTZ Control',
		name: `Position Limit Unlock All`,
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `UNLOCK\\nAll`,
			size: 14,
			alignment: 'center:bottom',
			png64: icons.unlocked,
			show_topbar: false,
		},
		steps: [
			{
				down: [
					{
						actionId: 'setPositionLimits',
						options: {
							direction: [`UpLimit`, `DownLimit`, `LeftLimit`, `RightLimit`],
							lock: 'false',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
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
				show_topbar: false,
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
				show_topbar: false,
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
				show_topbar: false,
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
				show_topbar: false,
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
				show_topbar: false,
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
				show_topbar: false,
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
			text: `COLOR\\nTEMP`,
			size: 14,
			alignment: 'center:bottom',
			png64: icons.circlePlus,
			show_topbar: false,
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
			size: 14,
			show_topbar: false,
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
			text: `COLOR\\nTEMP`,
			size: 14,
			alignment: 'center:bottom',
			png64: icons.circleMinus,
			show_topbar: false,
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
		bgColor: number,
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
				bgcolor: bgColor,
				color: 0xffffff,
				text: `${colorUpper}\\n${typeUpper}`,
				size: 14,
				alignment: 'center:bottom',
				png64: icons.circlePlus,
				show_topbar: false,
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
				bgcolor: bgColor,
				color: 0xffffff,
				text: `${colorUpper}\\n${typeUpper}\\n$(bolin-ptz:${variableId})`,
				size: 14,
				show_topbar: false,
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
				bgcolor: bgColor,
				color: 0xffffff,
				text: `${colorUpper}\\n${typeUpper}`,
				size: 14,
				alignment: 'center:bottom',
				png64: icons.circleMinus,
				show_topbar: false,
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
	createWhiteBalanceValuePresets('Red', 'Gain', 'RGain', 'wb_r_gain', 0x330000)
	createWhiteBalanceValuePresets('Blue', 'Gain', 'BGain', 'wb_b_gain', 0x000033)
	createWhiteBalanceValuePresets('Red', 'Tuning', 'RTuning', 'wb_r_tuning', 0x330000)
	createWhiteBalanceValuePresets('Blue', 'Tuning', 'BTuning', 'wb_b_tuning', 0x000033)
	createWhiteBalanceValuePresets('Green', 'Tuning', 'GTuning', 'wb_g_tuning', 0x003300)

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
				show_topbar: false,
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
				show_topbar: false,
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
				show_topbar: false,
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
				alignment: 'center:bottom',
				png64: icons.flip,
				show_topbar: false,
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
				alignment: 'center:bottom',
				png64: icons.mirror,
				show_topbar: false,
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
				show_topbar: false,
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
				show_topbar: false,
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
				text: `${displayUpper}`,
				size: 14,
				alignment: 'center:bottom',
				png64: icons.circlePlus,
				show_topbar: false,
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
				size: 14,
				show_topbar: false,
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
				text: `${displayUpper}`,
				size: 14,
				alignment: 'center:bottom',
				png64: icons.circleMinus,
				show_topbar: false,
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
				show_topbar: false,
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
			text: `GAMMA\\nBRIGHT`,
			size: 14,
			alignment: 'center:bottom',
			png64: icons.circlePlus,
			show_topbar: false,
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
			show_topbar: false,
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
			text: `GAMMA\\nBRIGHT`,
			size: 14,
			alignment: 'center:bottom',
			png64: icons.circleMinus,
			show_topbar: false,
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
				show_topbar: false,
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
			text: `WDR\\nLEVEL`,
			size: 14,
			alignment: 'center:bottom',
			png64: icons.circlePlus,
			show_topbar: false,
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
			show_topbar: false,
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
			text: `WDR\\nLEVEL`,
			size: 14,
			alignment: 'center:bottom',
			png64: icons.circleMinus,
			show_topbar: false,
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
			text: `IRIS\\n`,
			size: 14,
			alignment: 'center:bottom',
			png64: icons.circlePlus,
			show_topbar: false,
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
			size: 14,
			alignment: 'center:bottom',
			png64: icons.aperture,
			show_topbar: false,
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
			text: `IRIS\\n`,
			size: 14,
			alignment: 'center:bottom',
			png64: icons.circleMinus,
			show_topbar: false,
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
					show_topbar: false,
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
			text: `SHUTTER\\nSPEED`,
			size: 14,
			alignment: 'center:bottom',
			png64: icons.circlePlus,
			show_topbar: false,
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
			show_topbar: false,
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
			text: `SHUTTER\\nSPEED`,
			size: 14,
			alignment: 'center:bottom',
			png64: icons.circleMinus,
			show_topbar: false,
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
					show_topbar: false,
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
			show_topbar: false,
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
			show_topbar: false,
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
			show_topbar: false,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}

	// Helper function to create exposure value presets
	function createExposureValuePresets(name: string, actionId: string, variableId: string, displayName: string): void {
		const baseKey = `presetExposure${name}`
		const displayUpper = displayName.toUpperCase().replace(/\s+/g, '\\n')

		// Header
		presets[`${baseKey}Header`] = {
			category: 'Exposure',
			name: `${name}`,
			type: 'text',
			text: '',
		}

		// Increase
		presets[`${baseKey}Increase`] = {
			type: 'button',
			category: 'Exposure',
			name: `Exposure ${name} Increase`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `${displayUpper}`,
				size: 14,
				alignment: 'center:bottom',
				png64: icons.circlePlus,
				show_topbar: false,
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
			category: 'Exposure',
			name: `Exposure ${name} Value`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `${displayUpper}\\n$(bolin-ptz:${variableId})`,
				size: 12,
				show_topbar: false,
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
			category: 'Exposure',
			name: `Exposure ${name} Decrease`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `${displayUpper}`,
				size: 14,
				alignment: 'center:bottom',
				png64: icons.circleMinus,
				show_topbar: false,
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

	// Create exposure value presets
	createExposureValuePresets('Gain', 'gain', 'gain', 'Gain')
	createExposureValuePresets('GainLimit', 'gainLimit', 'gain_limit', 'Gain Limit')
	createExposureValuePresets('ExpCompLevel', 'expCompLevel', 'ex_comp_level', 'Exp Comp Level')

	// Smart Exposure presets
	presets['presetExposureSmartExposureHeader'] = {
		category: 'Exposure',
		name: 'Smart Exposure',
		type: 'text',
		text: '',
	}
	for (const mode of [
		{ id: 'toggle', label: 'Toggle', text: 'SMART\\nEXP\\n$(bolin-ptz:smart_exposure)' },
		{ id: 'true', label: 'On', text: 'SMART\\nEXP\\nON' },
		{ id: 'false', label: 'Off', text: 'SMART\\nEXP\\nOFF' },
	]) {
		presets[`presetExposureSmartExposure${mode.label}`] = {
			type: 'button',
			category: 'Exposure',
			name: `Exposure Smart Exposure ${mode.label}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: mode.text,
				size: '14',
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'smartExposure',
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
					feedbackId: 'smartExposure',
					isInverted: mode.id === 'false' ? true : false,
					options: {},
					style: {
						bgcolor: 0x009900,
					},
				},
			],
		}
	}

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
					show_topbar: false,
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

	// Stream control presets
	const hasRTSPCapability = !capabilitiesLoaded || (self.camera?.hasCapability('RTSPInfo') ?? false)
	if (hasRTSPCapability) {
		presets['streamRTSPHeader'] = {
			category: 'Streams',
			name: 'RTSP Control',
			type: 'text',
			text: '',
		}
		for (const channel of [
			{ id: 0, label: 'Main' },
			{ id: 1, label: 'Sub' },
		]) {
			for (const mode of [
				{
					id: 'toggle',
					label: 'Toggle',
					text: `RTSP\\n${channel.label}\\n$(bolin-ptz:rtsp_${channel.id === 0 ? 'main' : 'sub'}_enable)`,
				},
				{ id: 'true', label: 'On', text: `RTSP\\n${channel.label}\\nON` },
				{ id: 'false', label: 'Off', text: `RTSP\\n${channel.label}\\nOFF` },
			]) {
				presets[`streamRTSP${channel.label}${mode.label}`] = {
					type: 'button',
					category: 'Streams',
					name: `RTSP ${channel.label} Stream ${mode.label}`,
					style: {
						bgcolor: 0x000000,
						color: 0xffffff,
						text: mode.text,
						size: '14',
						show_topbar: false,
					},
					steps: [
						{
							down: [
								{
									actionId: 'rtspControl',
									options: {
										channel: channel.id,
										props: ['enable'],
										enable: mode.id,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'rtspEnabled',
							isInverted: mode.id === 'false' ? true : false,
							options: {
								channel: channel.id,
							},
							style: {
								bgcolor: 0x009900,
							},
						},
					],
				}
			}
		}
	}

	const hasRTMPCapability = !capabilitiesLoaded || (self.camera?.hasCapability('RTMPInfo') ?? false)
	if (hasRTMPCapability) {
		presets['streamRTMPHeader'] = {
			category: 'Streams',
			name: 'RTMP Control',
			type: 'text',
			text: '',
		}
		for (const channel of [
			{ id: 0, label: 'Main' },
			{ id: 1, label: 'Sub' },
		]) {
			for (const mode of [
				{
					id: 'toggle',
					label: 'Toggle',
					text: `RTMP\\n${channel.label}\\n$(bolin-ptz:rtmp_${channel.id === 0 ? 'main' : 'sub'}_enable)`,
				},
				{ id: 'true', label: 'On', text: `RTMP\\n${channel.label}\\nON` },
				{ id: 'false', label: 'Off', text: `RTMP\\n${channel.label}\\nOFF` },
			]) {
				presets[`streamRTMP${channel.label}${mode.label}`] = {
					type: 'button',
					category: 'Streams',
					name: `RTMP ${channel.label} Stream ${mode.label}`,
					style: {
						bgcolor: 0x000000,
						color: 0xffffff,
						text: mode.text,
						size: '14',
						show_topbar: false,
					},
					steps: [
						{
							down: [
								{
									actionId: 'rtmpControl',
									options: {
										channel: channel.id,
										props: ['enable'],
										enable: mode.id,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'rtmpEnabled',
							isInverted: mode.id === 'false' ? true : false,
							options: {
								channel: channel.id,
							},
							style: {
								bgcolor: 0x009900,
							},
						},
					],
				}
			}
		}
	}

	const hasAVOverUDPCapability = !capabilitiesLoaded || (self.camera?.hasCapability('AVOverUDPInfo') ?? false)
	if (hasAVOverUDPCapability) {
		presets['streamAVOverUDPHeader'] = {
			category: 'Streams',
			name: 'AV Over UDP Control',
			type: 'text',
			text: '',
		}
		for (const channel of [
			{ id: 0, label: 'Main' },
			{ id: 1, label: 'Sub' },
		]) {
			for (const mode of [
				{
					id: 'toggle',
					label: 'Toggle',
					text: `AV UDP\\n${channel.label}\\n$(bolin-ptz:av_over_udp_${channel.id === 0 ? 'main' : 'sub'}_enable)`,
				},
				{ id: 'true', label: 'On', text: `AV UDP\\n${channel.label}\\nON` },
				{ id: 'false', label: 'Off', text: `AV UDP\\n${channel.label}\\nOFF` },
			]) {
				presets[`streamAVOverUDP${channel.label}${mode.label}`] = {
					type: 'button',
					category: 'Streams',
					name: `AV Over UDP ${channel.label} Stream ${mode.label}`,
					style: {
						bgcolor: 0x000000,
						color: 0xffffff,
						text: mode.text,
						size: '14',
						show_topbar: false,
					},
					steps: [
						{
							down: [
								{
									actionId: 'avOverUDPControl',
									options: {
										channel: channel.id,
										props: ['enable'],
										enable: mode.id,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'avOverUDPEnabled',
							isInverted: mode.id === 'false' ? true : false,
							options: {
								channel: channel.id,
							},
							style: {
								bgcolor: 0x009900,
							},
						},
					],
				}
			}
		}
	}

	const hasAVOverRTPCapability = !capabilitiesLoaded || (self.camera?.hasCapability('AVOverRTPInfo') ?? false)
	if (hasAVOverRTPCapability) {
		presets['streamAVOverRTPHeader'] = {
			category: 'Streams',
			name: 'AV Over RTP Control',
			type: 'text',
			text: '',
		}
		for (const channel of [
			{ id: 0, label: 'Main' },
			{ id: 1, label: 'Sub' },
		]) {
			for (const mode of [
				{
					id: 'toggle',
					label: 'Toggle',
					text: `AV RTP\\n${channel.label}\\n$(bolin-ptz:av_over_rtp_${channel.id === 0 ? 'main' : 'sub'}_enable)`,
				},
				{ id: 'true', label: 'On', text: `AV RTP\\n${channel.label}\\nON` },
				{ id: 'false', label: 'Off', text: `AV RTP\\n${channel.label}\\nOFF` },
			]) {
				presets[`streamAVOverRTP${channel.label}${mode.label}`] = {
					type: 'button',
					category: 'Streams',
					name: `AV Over RTP ${channel.label} Stream ${mode.label}`,
					style: {
						bgcolor: 0x000000,
						color: 0xffffff,
						text: mode.text,
						size: '14',
						show_topbar: false,
					},
					steps: [
						{
							down: [
								{
									actionId: 'avOverRTPControl',
									options: {
										channel: channel.id,
										props: ['enable'],
										enable: mode.id,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'avOverRTPEnabled',
							isInverted: mode.id === 'false' ? true : false,
							options: {
								channel: channel.id,
							},
							style: {
								bgcolor: 0x009900,
							},
						},
					],
				}
			}
		}
	}

	const hasNDICapability = !capabilitiesLoaded || (self.camera?.hasCapability('NDIInfo') ?? false)
	if (hasNDICapability) {
		presets['streamNDIHeader'] = {
			category: 'Streams',
			name: 'NDI Control',
			type: 'text',
			text: '',
		}
		for (const mode of [
			{ id: 'toggle', label: 'Toggle', text: 'NDI\\n$(bolin-ptz:ndi_enable)' },
			{ id: 'true', label: 'On', text: 'NDI\\nON' },
			{ id: 'false', label: 'Off', text: 'NDI\\nOFF' },
		]) {
			presets[`streamNDI${mode.label}`] = {
				type: 'button',
				category: 'Streams',
				name: `NDI ${mode.label}`,
				style: {
					bgcolor: 0x000000,
					color: 0xffffff,
					text: mode.text,
					size: '14',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'ndiControl',
								options: {
									props: ['ndiEnable'],
									ndiEnable: mode.id,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'ndiEnabled',
						isInverted: mode.id === 'false' ? true : false,
						options: {},
						style: {
							bgcolor: 0x009900,
						},
					},
				],
			}
		}
		presets['streamNDIName'] = {
			type: 'button',
			category: 'Streams',
			name: 'NDI Name',
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `NDI NAME\\n$(bolin-ptz:ndi_name)`,
				size: 12,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}
		presets['streamNDIHXBandwidthValue'] = {
			type: 'button',
			category: 'Streams',
			name: 'NDI HX Bandwidth Value',
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `NDI HX\\nBANDWIDTH\\n$(bolin-ptz:ndi_hx_bandwidth)`,
				size: 12,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	const hasSRTCapability = !capabilitiesLoaded || (self.camera?.hasCapability('SRTInfo') ?? false)
	if (hasSRTCapability) {
		presets['streamSRTHeader'] = {
			category: 'Streams',
			name: 'SRT Control',
			type: 'text',
			text: '',
		}
		for (const channel of [
			{ id: 0, label: 'Main' },
			{ id: 1, label: 'Sub' },
		]) {
			for (const mode of [
				{
					id: 'toggle',
					label: 'Toggle',
					text: `SRT\\n${channel.label}\\n$(bolin-ptz:srt_${channel.id === 0 ? 'main' : 'sub'}_enable)`,
				},
				{ id: 'true', label: 'On', text: `SRT\\n${channel.label}\\nON` },
				{ id: 'false', label: 'Off', text: `SRT\\n${channel.label}\\nOFF` },
			]) {
				presets[`streamSRT${channel.label}${mode.label}`] = {
					type: 'button',
					category: 'Streams',
					name: `SRT ${channel.label} Stream ${mode.label}`,
					style: {
						bgcolor: 0x000000,
						color: 0xffffff,
						text: mode.text,
						size: '14',
						show_topbar: false,
					},
					steps: [
						{
							down: [
								{
									actionId: 'srtControl',
									options: {
										channel: channel.id,
										props: ['enable'],
										enable: mode.id,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'srtEnabled',
							isInverted: mode.id === 'false' ? true : false,
							options: {
								channel: channel.id,
							},
							style: {
								bgcolor: 0x009900,
							},
						},
					],
				}
			}
		}
	}

	// Audio Enable presets
	if (!capabilitiesLoaded || self.camera?.hasCapability('AudioInfo')) {
		presets['presetAudioEnableHeader'] = {
			category: 'Audio',
			name: 'Audio Enable',
			type: 'text',
			text: '',
		}
		for (const mode of [
			{ id: 'toggle', label: 'Toggle', text: 'AUDIO\\n$(bolin-ptz:audio_enable)', icon: 'speaker' },
			{ id: 'true', label: 'On', text: 'AUDIO\\nON', icon: 'speaker' },
			{ id: 'false', label: 'Off', text: 'AUDIO\\nOFF', icon: 'speakerMute' },
		]) {
			presets[`presetAudioEnable${mode.label}`] = {
				type: 'button',
				category: 'Audio',
				name: `Audio Enable ${mode.label}`,
				style: {
					bgcolor: 0x000000,
					color: 0xffffff,
					text: mode.text,
					size: '14',
					alignment: 'center:bottom',
					png64: mode.id === 'false' ? icons.speakerMute : icons.speaker,
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'audioControl',
								options: {
									props: ['enable'],
									mode: mode.id,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'audioEnabled',
						isInverted: mode.id === 'false' ? true : false,
						options: {},
						style: {
							bgcolor: 0x009900,
						},
					},
				],
			}
		}

		// Audio Volume Set Value presets
		presets['audioVolumeSetValueHeader'] = {
			category: 'Audio',
			name: 'Volume Set Value',
			type: 'text',
			text: '',
		}
		for (const volume of [
			{ value: 0, label: '0%' },
			{ value: 25, label: '25%' },
			{ value: 50, label: '50%' },
			{ value: 75, label: '75%' },
			{ value: 100, label: '100%' },
		]) {
			presets[`presetAudioVolume${volume.label}`] = {
				type: 'button',
				category: 'Audio',
				name: `Audio Volume ${volume.label}`,
				style: {
					bgcolor: 0x000000,
					color: 0xffffff,
					text: `VOLUME\\n${volume.label}`,
					size: 12,
					alignment: 'center:bottom',
					png64: icons.meters,
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'audioControl',
								options: {
									props: ['volume'],
									volume: volume.value.toString(),
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'audioVolume',
						options: {
							comparison: 'equal',
							value: volume.value.toString(),
						},
						style: {
							bgcolor: 0x009900,
						},
					},
				],
			}
		}
	}

	// Encoder Info presets
	const hasEncodeInfoCapability = !capabilitiesLoaded || (self.camera?.hasCapability('EncodeInfo') ?? false)
	if (hasEncodeInfoCapability) {
		// Main Stream Info
		presets['encoderInfoMainStreamHeader'] = {
			category: 'Encoder Info',
			name: 'Main Stream',
			type: 'text',
			text: '',
		}
		presets['encoderInfoMainStreamResolution'] = {
			type: 'button',
			category: 'Encoder Info',
			name: 'Main Stream Resolution',
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `MAIN\\nRESOLUTION\\n$(bolin-ptz:encode_main_resolution)`,
				size: 12,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}
		presets['encoderInfoMainStreamFrameRate'] = {
			type: 'button',
			category: 'Encoder Info',
			name: 'Main Stream Frame Rate',
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `MAIN\\nFRAME RATE\\n$(bolin-ptz:encode_main_frame_rate)`,
				size: 12,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}
		presets['encoderInfoMainStreamBitrate'] = {
			type: 'button',
			category: 'Encoder Info',
			name: 'Main Stream Bitrate',
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `MAIN\\nBITRATE\\n$(bolin-ptz:encode_main_bitrate)`,
				size: 12,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}

		// Sub Stream Info
		presets['encoderInfoSubStreamHeader'] = {
			category: 'Encoder Info',
			name: 'Sub Stream',
			type: 'text',
			text: '',
		}
		presets['encoderInfoSubStreamResolution'] = {
			type: 'button',
			category: 'Encoder Info',
			name: 'Sub Stream Resolution',
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `SUB\\nRESOLUTION\\n$(bolin-ptz:encode_sub_resolution)`,
				size: 12,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}
		presets['encoderInfoSubStreamFrameRate'] = {
			type: 'button',
			category: 'Encoder Info',
			name: 'Sub Stream Frame Rate',
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `SUB\\nFRAME RATE\\n$(bolin-ptz:encode_sub_frame_rate)`,
				size: 12,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}
		presets['encoderInfoSubStreamBitrate'] = {
			type: 'button',
			category: 'Encoder Info',
			name: 'Sub Stream Bitrate',
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `SUB\\nBITRATE\\n$(bolin-ptz:encode_sub_bitrate)`,
				size: 12,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}
		// Other encoder info
		if (self.camera?.hasCapability('EncodeInfo.LowLatency')) {
			presets['encoderInfoOtherHeader'] = {
				category: 'Encoder Info',
				name: 'Other',
				type: 'text',
				text: '',
			}
			presets['encoderInfoLowLatency'] = {
				type: 'button',
				category: 'Encoder Info',
				name: 'Low Latency',
				style: {
					bgcolor: 0x000000,
					color: 0xffffff,
					text: `LOW\\nLATENCY\\n$(bolin-ptz:low_latency)`,
					size: 12,
					show_topbar: false,
				},
				steps: [
					{
						down: [],
						up: [],
					},
				],
				feedbacks: [],
			}
		}
	}

	// PTZ Modes presets
	presets['ptzModesAutoScanningHeader'] = {
		category: 'PTZ Modes',
		name: 'Auto Scanning',
		type: 'text',
		text: '',
	}
	presets['ptzModesAutoScanning'] = {
		type: 'button',
		category: 'PTZ Modes',
		name: 'Auto Scanning',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `AUTO\\nSCAN\\nSTART`,
			size: '14',
			show_topbar: false,
		},
		steps: [
			{
				down: [
					{
						actionId: 'setAutoScanning',
						options: {
							speed: '128',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}
	presets['ptzModesAutoScanningStop'] = {
		type: 'button',
		category: 'PTZ Modes',
		name: 'Auto Scanning Stop',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `AUTO\\nSCAN\\nSTOP`,
			size: '14',
			show_topbar: false,
		},
		steps: [
			{
				down: [
					{
						actionId: 'ptMove',
						options: {
							direction: 'Stop',
							speed: '128',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	// Cruise presets
	presets['ptzModesCruiseHeader'] = {
		category: 'PTZ Modes',
		name: 'Cruise Mode',
		type: 'text',
		text: '',
	}

	// Create presets for each available cruise
	const cruiseInfo = self.camera?.getState().cruiseInfo ?? []
	for (const cruise of cruiseInfo) {
		const cruiseName = cruise.Name || `Cruise ${cruise.Number}`
		const presetKey = `ptzModesCruiseCall${cruise.Number}`

		presets[presetKey] = {
			type: 'button',
			category: 'PTZ Modes',
			name: `CALL Cruise ${cruiseName}`,
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `CALL\\nCRUISE\\n$(bolin-ptz:cruise_${cruise.Number}_name)`,
				size: '14',
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'cruiseControl',
							options: {
								command: 'Call',
								cruise: cruise.Number,
								customCruise: false,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	// Stop Cruise preset
	presets['ptzModesCruiseStop'] = {
		type: 'button',
		category: 'PTZ Modes',
		name: 'STOP Cruise',
		style: {
			bgcolor: 0x000000,
			color: 0xffffff,
			text: `STOP\\nCRUISE`,
			size: '14',
			show_topbar: false,
		},
		steps: [
			{
				down: [
					{
						actionId: 'cruiseControl',
						options: {
							command: 'Stop',
							cruise: 1, // Default cruise number, doesn't matter for Stop
							customCruise: false,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	// Trace presets - sections for Trace 1 through 4
	for (let traceNumber = 1; traceNumber <= 4; traceNumber++) {
		const sectionKey = `ptzModesTrace${traceNumber}Header`
		presets[sectionKey] = {
			category: 'PTZ Modes',
			name: `Trace ${traceNumber}`,
			type: 'text',
			text: '',
		}

		// Commands for each trace
		const traceCommands = [
			{ command: 'StartRecord', label: 'START\nRECORD', name: 'Start Record' },
			{ command: 'EndRecord', label: 'END\nRECORD', name: 'End Record' },
			{ command: 'Call', label: 'CALL\nTRACE', name: 'Call' },
			{ command: 'Delete', label: 'DELETE', name: 'Delete' },
			{ command: 'Stop', label: 'STOP\nTRACE', name: 'Stop' },
		]

		for (const cmd of traceCommands) {
			const presetKey = `ptzModesTrace${traceNumber}${cmd.command}`
			presets[presetKey] = {
				type: 'button',
				category: 'PTZ Modes',
				name: `Trace ${traceNumber} - ${cmd.name}`,
				style: {
					bgcolor: 0x000000,
					color: 0xffffff,
					text: `TRACE ${traceNumber}\n${cmd.label}`,
					size: '14',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'traceControl',
								options: {
									command: cmd.command,
									trace: traceNumber,
									customTrace: true,
									customTraceNumber: traceNumber.toString(),
									customTraceName: `Trace ${traceNumber}`,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
		}
	}

	// Scanning presets - sections for Scanning 1 through 4
	for (let scanningNumber = 1; scanningNumber <= 4; scanningNumber++) {
		const sectionKey = `ptzModesScanning${scanningNumber}Header`
		presets[sectionKey] = {
			category: 'PTZ Modes',
			name: `Scanning ${scanningNumber}`,
			type: 'text',
			text: '',
		}

		// Commands for each scanning pattern
		const scanningCommands = [
			{ command: 'LeftLimit', label: 'LEFT\nLIMIT', name: 'Left Limit' },
			{ command: 'RightLimit', label: 'RIGHT\nLIMIT', name: 'Right Limit' },
			{ command: 'Call', label: 'CALL\nSCAN', name: 'Call' },
			{ command: 'Delete', label: 'DELETE', name: 'Delete' },
			{ command: 'Stop', label: 'STOP\nSCAN', name: 'Stop' },
		]

		for (const cmd of scanningCommands) {
			const presetKey = `ptzModesScanning${scanningNumber}${cmd.command}`
			presets[presetKey] = {
				type: 'button',
				category: 'PTZ Modes',
				name: `Scanning ${scanningNumber} - ${cmd.name}`,
				style: {
					bgcolor: 0x000000,
					color: 0xffffff,
					text: `SCAN ${scanningNumber}\n${cmd.label}`,
					size: '14',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'scanningControl',
								options: {
									command: cmd.command,
									scanning: scanningNumber,
									customScanning: true,
									customScanningNumber: scanningNumber.toString(),
									customScanningName: `Scanning ${scanningNumber}`,
									speed: cmd.command === 'Call' ? '128' : '0', // Only set speed for Call command
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
		}
	}

	self.setPresetDefinitions(presets)
}
