import { CompanionPresetDefinitions, type CompanionOptionValues } from '@companion-module/base'
import type { BolinModuleInstance } from './main.js'
import { sortIrisChoices, convertIrisRangeToMap } from './utils.js'
import { icons } from './icons.js'

export function UpdatePresets(self: BolinModuleInstance): void {
	const presets: CompanionPresetDefinitions = {}

	const Color = {
		black: 0x000000,
		white: 0xffffff,
		darkGray: 0x242424,
		lightGray: 0x6e6e6e,
		red: 0xda2f21,
		green: 0x009900,
	}

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
				bgcolor: Color.lightGray,
				color: Color.white,
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
								customSpeed: false,
								speed: '128',
							},
						},
					],
					up: [
						{
							actionId: 'ptMove',
							options: {
								direction: 'Stop',
								customSpeed: false,
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
			bgcolor: Color.lightGray,
			color: Color.white,
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
			bgcolor: Color.lightGray,
			color: Color.white,
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
							customSpeed: false,
							speed: '5',
						},
					},
				],
				up: [
					{
						actionId: 'zoom',
						options: {
							direction: 'Stop',
							customSpeed: false,
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
			bgcolor: Color.lightGray,
			color: Color.white,
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
							customSpeed: false,
							speed: '5',
						},
					},
				],
				up: [
					{
						actionId: 'zoom',
						options: {
							direction: 'Stop',
							customSpeed: false,
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
			bgcolor: Color.lightGray,
			color: Color.white,
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
					bgcolor: Color.green,
				},
			},
		],
	}
	presets[`presetFocusManual`] = {
		type: 'button',
		category: 'Focus',
		name: 'Focus Manual',
		style: {
			bgcolor: Color.lightGray,
			color: Color.white,
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
					bgcolor: Color.green,
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
			bgcolor: Color.lightGray,
			color: Color.white,
			text: `FOCUS\\nNEAR`,
			size: '14',
			alignment: 'center:bottom',
			png64: icons.circleMinus,
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
			bgcolor: Color.lightGray,
			color: Color.white,
			text: `FOCUS\\nFAR`,
			size: '14',
			alignment: 'center:bottom',
			png64: icons.circlePlus,
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
				up: [],
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
			bgcolor: Color.lightGray,
			color: Color.white,
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
			bgcolor: Color.darkGray,
			color: Color.white,
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
			bgcolor: Color.lightGray,
			color: Color.white,
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
				bgcolor: Color.lightGray,
				color: Color.white,
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
						bgcolor: Color.green,
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
			name: `Position Limit ${limit}`,
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
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
						direction: [`${limit}Limit`],
					},
					style: {
						bgcolor: Color.red,
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
			bgcolor: Color.darkGray,
			color: Color.white,
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
		feedbacks: [
			{
				feedbackId: 'positionLimitEnabled',
				options: {
					direction: [`UpLimit`, `DownLimit`, `LeftLimit`, `RightLimit`],
				},
				style: {
					bgcolor: Color.red,
				},
			},
		],
	}
	presets[`positionLimitUnlockAll`] = {
		type: 'button',
		category: 'PTZ Control',
		name: `Position Limit Unlock All`,
		style: {
			bgcolor: Color.darkGray,
			color: Color.white,
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
		feedbacks: [
			{
				feedbackId: 'positionLimitEnabled',
				isInverted: true,
				options: {
					direction: [`UpLimit`, `DownLimit`, `LeftLimit`, `RightLimit`],
				},
				style: {
					bgcolor: Color.green,
				},
			},
		],
	}
	createAdjustmentPresets('ptSpeed', 'PTZ Control', 'PT Speed', 'panTiltSpeed', 'pt_speed', 'P/T SPEED', {
		adjustmentValue: 10,
		headerName: 'Pan / Tilt Speed Control',
	})

	createAdjustmentPresets('zoomSpeed', 'PTZ Control', 'Zoom Speed', 'zoomSpeed', 'zoom_speed', 'ZOOM SPEED', {
		adjustmentValue: 1,
		headerName: 'Zoom Speed',
	})

	const rollPositionCapabilities = !capabilitiesLoaded || (self.camera?.hasCapability('RollInfo') ?? false)
	if (rollPositionCapabilities) {
		createAdjustmentPresets(
			'rollPosition',
			'PTZ Control',
			'Roll Position',
			'setRollPosition',
			'roll_position',
			'ROLL POS',
			{
				adjustmentValue: 1,
				headerName: 'Roll Position',
			},
		)
	}
	presets['ptzControlHeaderDirection'] = {
		category: 'PTZ Control',
		name: 'Direction Invert',
		type: 'text',
		text: '',
	}

	// Pan Direction Invert presets
	for (const mode of [
		{ id: 'toggle', label: 'Toggle', text: 'PAN\\nINVERT' },
		{ id: 'false', label: 'Off', text: 'PAN\\nINVERT\\nOFF' },
		{ id: 'true', label: 'On', text: 'PAN\\nINVERT\\nON' },
	]) {
		createTogglePreset(
			presets,
			`presetPanDirectionInvert${mode.label}`,
			`Pan Direction Invert ${mode.label}`,
			'PTZ Control',
			mode.text,
			'panDirectionInverted',
			mode.id,
			'panDirectionInverted',
			mode.id === 'toggle',
		)
	}

	// Tilt Direction Invert presets
	for (const mode of [
		{ id: 'toggle', label: 'Toggle', text: 'TILT\\nINVERT' },
		{ id: 'true', label: 'On', text: 'TILT\\nINVERT\\nON' },
		{ id: 'false', label: 'Off', text: 'TILT\\nINVERT\\nOFF' },
	]) {
		createTogglePreset(
			presets,
			`presetTiltDirectionInvert${mode.label}`,
			`Tilt Direction Invert ${mode.label}`,
			'PTZ Control',
			mode.text,
			'tiltDirectionInverted',
			mode.id,
			'tiltDirectionInverted',
			mode.id === 'toggle',
		)
	}

	const cameraPresets = self.camera?.getState().presets ?? []
	// Create a map of preset numbers to preset info for quick lookup
	const presetMap = new Map<number, { Name: string; Number: number }>()
	for (const preset of cameraPresets) {
		presetMap.set(preset.Number, preset)
	}

	presets['presetCallHeader'] = {
		category: 'Presets',
		name: 'Call Presets',
		type: 'text',
		text: '',
	}

	// Always create presets for values 1-12, even if they don't exist on the camera
	for (let presetNumber = 1; presetNumber <= 12; presetNumber++) {
		const preset = presetMap.get(presetNumber)
		const presetName = preset?.Name !== undefined ? preset?.Name : `Preset ${presetNumber}`
		const presetNumberStr = presetNumber.toString()

		presets[`presetCall${presetNumberStr}`] = {
			type: 'button',
			category: 'Presets',
			name: 'Call ' + presetName + ' (' + presetNumber + ')',
			style: {
				bgcolor: Color.lightGray,
				color: Color.white,
				text: `CALL\\n${presetName}`,
				size: '14',
				png64: icons.preset,
				alignment: 'center:bottom',
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
		category: 'Presets',
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
			category: 'Presets',
			name: 'Save ' + presetName + ' (' + presetNumber + ')',
			style: {
				bgcolor: Color.lightGray,
				color: Color.white,
				text: `SAVE\\n${presetName}`,
				size: '14',
				png64: icons.save,
				alignment: 'center:bottom',
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
				bgcolor: Color.lightGray,
				color: Color.white,
				text: `WB MODE\\n${key === 'ManualColorTemperature' ? 'Manual' : key}`,
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
						bgcolor: Color.green,
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
				bgcolor: Color.lightGray,
				color: Color.white,
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
						bgcolor: Color.green,
					},
				},
			],
		}
	}

	createAdjustmentPresets(
		'presetWhiteBalanceColorTemperature',
		'White Balance',
		'White Balance Color Temperature',
		'colorTemperature',
		'wb_color_temperature',
		'COLOR\\nTEMP',
		{
			adjustmentValue: 100,
			headerName: 'White Balance Color Temperature',
		},
	)
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
				bgcolor: Color.lightGray,
				color: Color.white,
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
				color: Color.white,
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
				bgcolor: Color.lightGray,
				color: Color.white,
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
				bgcolor: Color.lightGray,
				color: Color.white,
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
						bgcolor: Color.green,
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
				bgcolor: Color.lightGray,
				color: Color.white,
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
						bgcolor: Color.green,
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
				bgcolor: Color.lightGray,
				color: Color.white,
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
						bgcolor: Color.green,
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
		{ id: 'toggle', label: 'Toggle', text: 'FLIP\\n' },
		{ id: 'false', label: 'Off', text: 'FLIP\\nOFF' },
		{ id: 'true', label: 'On', text: 'FLIP\\nON' },
	]) {
		createTogglePreset(
			presets,
			`presetPictureFlip${mode.label}`,
			`Picture Flip ${mode.label}`,
			'Picture',
			mode.text,
			'flip',
			mode.id,
			'flip',
			mode.id === 'toggle',
			{
				defaultIcon: icons.flip,
				alignment: 'center:bottom',
			},
		)
	}

	// Helper function for creating toggle/on/off presets with different styles
	function createTogglePreset(
		presets: CompanionPresetDefinitions,
		key: string,
		name: string,
		category: string,
		text: string,
		actionId: string,
		modeId: string,
		feedbackId: string,
		isToggle: boolean,
		options?: {
			toggleOffIcon?: string
			toggleOnIcon?: string
			defaultIcon?: string | ((modeId: string) => string)
			alignment?: string
			actionOptions?: (modeId: string) => CompanionOptionValues
			feedbackOptions?: (modeId: string) => CompanionOptionValues
		},
	) {
		const actionOptions = options?.actionOptions ? options.actionOptions(modeId) : { mode: modeId }
		const feedbackOptions = options?.feedbackOptions ? options.feedbackOptions(modeId) : {}

		if (isToggle) {
			// Toggle mode: uses icon feedback with toggle icons
			const toggleStyle = {
				bgcolor: Color.darkGray,
				color: Color.white,
				text,
				size: '14' as const,
				alignment: 'center:bottom' as const,
				png64: options?.toggleOffIcon || icons.toggleSmall,
				pngalignment: 'center:top' as const,
				show_topbar: false,
			}

			presets[key] = {
				type: 'button',
				category,
				name,
				style: toggleStyle,
				steps: [
					{
						down: [
							{
								actionId,
								options: actionOptions,
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId,
						options: feedbackOptions,
						style: {
							png64: options?.toggleOnIcon || icons.toggleOn,
						},
					},
				],
			}
		} else {
			// True/False modes: uses color feedback
			const defaultIcon =
				typeof options?.defaultIcon === 'function' ? options.defaultIcon(modeId) : options?.defaultIcon
			const style = {
				bgcolor: Color.lightGray,
				color: Color.white,
				text,
				size: '14' as const,
				show_topbar: false,
				...(options?.alignment && { alignment: options.alignment as 'center:bottom' }),
				...(defaultIcon && { png64: defaultIcon }),
			}

			presets[key] = {
				type: 'button',
				category,
				name,
				style,
				steps: [
					{
						down: [
							{
								actionId,
								options: actionOptions,
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId,
						isInverted: modeId === 'false' ? true : false,
						options: feedbackOptions,
						style: {
							bgcolor: modeId === 'true' ? Color.green : Color.red,
						},
					},
				],
			}
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
		{ id: 'toggle', label: 'Toggle', text: 'MIRROR\\n' },
		{ id: 'false', label: 'Off', text: 'MIRROR\\nOFF' },
		{ id: 'true', label: 'On', text: 'MIRROR\\nON' },
	]) {
		const presetKey =
			mode.id === 'toggle' ? `presetPictureMirrorToggle${mode.label}` : `presetPictureMirror${mode.label}`
		createTogglePreset(
			presets,
			presetKey,
			`Picture Mirror ${mode.label}`,
			'Picture',
			mode.text,
			'mirror',
			mode.id,
			'mirror',
			mode.id === 'toggle',
			{
				toggleOffIcon: icons.toggleOff,
				toggleOnIcon: icons.toggleOn,
				defaultIcon: icons.mirror,
				alignment: 'center:bottom',
			},
		)
	}

	// Picture HLC Mode presets
	presets['presetPictureHLCModeHeader'] = {
		category: 'Picture',
		name: 'HLC Mode',
		type: 'text',
		text: '',
	}
	for (const mode of [
		{ id: 'toggle', label: 'Toggle', text: 'HLC MODE' },
		{ id: 'false', label: 'Off', text: 'HLC MODE\\nOFF' },
		{ id: 'true', label: 'On', text: 'HLC MODE\\nON' },
	]) {
		createTogglePreset(
			presets,
			`presetPictureHLCMode${mode.label}`,
			`Picture HLC Mode ${mode.label}`,
			'Picture',
			mode.text,
			'hlcMode',
			mode.id,
			'hlcMode',
			mode.id === 'toggle',
		)
	}

	// Picture BLC presets
	presets['presetPictureBLCHeader'] = {
		category: 'Picture',
		name: 'BLC',
		type: 'text',
		text: '',
	}
	for (const mode of [
		{ id: 'toggle', label: 'Toggle', text: 'BLC\\n' },
		{ id: 'false', label: 'Off', text: 'BLC\\nOFF' },
		{ id: 'true', label: 'On', text: 'BLC\\nON' },
	]) {
		createTogglePreset(
			presets,
			`presetPictureBLC${mode.label}`,
			`Picture BLC ${mode.label}`,
			'Picture',
			mode.text,
			'blcMode',
			mode.id,
			'blcMode',
			mode.id === 'toggle',
		)
	}

	// Generic helper function to create increase/value/decrease presets
	function createAdjustmentPresets(
		baseKey: string,
		category: string,
		namePrefix: string,
		actionId: string,
		variableId: string,
		displayText: string,
		options?: {
			adjustmentValue?: string | number
			valueIcon?: string
			valueSize?: number | string
			headerName?: string
			actionOptions?: (adjustment: 'increase' | 'decrease') => CompanionOptionValues
		},
	): void {
		const headerName = options?.headerName || namePrefix
		const adjustmentValue = options?.adjustmentValue ?? '1'
		const valueSize = options?.valueSize ?? 14

		// Header
		presets[`${baseKey}Header`] = {
			category,
			name: headerName,
			type: 'text',
			text: '',
		}

		// Increase
		presets[`${baseKey}Increase`] = {
			type: 'button',
			category,
			name: `${namePrefix} Increase`,
			style: {
				bgcolor: Color.lightGray,
				color: Color.white,
				text: displayText,
				size: 14,
				alignment: 'center:bottom' as const,
				png64: icons.circlePlus,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId,
							options: options?.actionOptions
								? options.actionOptions('increase')
								: {
										adjustment: 'increase',
										...(adjustmentValue !== undefined && { value: adjustmentValue }),
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
			category,
			name: `${namePrefix} Value`,
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `${displayText}\\n$(bolin-ptz:${variableId})`,
				size: valueSize as never,
				show_topbar: false,
				...(options?.valueIcon && { png64: options.valueIcon }),
				...(typeof valueSize === 'number' &&
					valueSize === 14 && { alignment: options?.valueIcon ? 'center:bottom' : 'center:center' }),
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
			category,
			name: `${namePrefix} Decrease`,
			style: {
				bgcolor: Color.lightGray,
				color: Color.white,
				text: displayText,
				size: 14,
				alignment: 'center:bottom' as const,
				png64: icons.circleMinus,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId,
							options: options?.actionOptions
								? options.actionOptions('decrease')
								: {
										adjustment: 'decrease',
										...(adjustmentValue !== undefined && { value: adjustmentValue }),
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
	createAdjustmentPresets('presetPicture2DNR', 'Picture', 'Picture 2DNR', '2dnr', '2dnr', '2DNR')
	createAdjustmentPresets('presetPicture3DNR', 'Picture', 'Picture 3DNR', '3dnr', '3dnr', '3DNR')
	createAdjustmentPresets(
		'presetPictureSharpness',
		'Picture',
		'Picture Sharpness',
		'sharpness',
		'sharpness',
		'Sharpness',
	)
	createAdjustmentPresets('presetPictureHue', 'Picture', 'Picture Hue', 'hue', 'hue', 'Hue')
	createAdjustmentPresets('presetPictureContrast', 'Picture', 'Picture Contrast', 'contrast', 'contrast', 'Contrast')
	createAdjustmentPresets(
		'presetPictureSaturation',
		'Picture',
		'Picture Saturation',
		'saturation',
		'saturation',
		'Saturation',
	)
	createAdjustmentPresets(
		'presetPictureDefogLevel',
		'Picture',
		'Picture Defog Level',
		'defogLevel',
		'defog_level',
		'Defog\\nLevel',
	)

	// Gamma Level presets
	const hasGammaLevelCapability = !capabilitiesLoaded || (self.camera?.hasCapability('GammaLevel') ?? false)
	if (hasGammaLevelCapability) {
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
					bgcolor: Color.lightGray,
					color: Color.white,
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
							bgcolor: Color.green,
						},
					},
				],
			}
		}

		// Gamma Bright presets
		createAdjustmentPresets(
			'presetGammaBright',
			'Gamma',
			'Gamma Bright',
			'gammaBright',
			'gamma_bright',
			'GAMMA\\nBRIGHT',
			{
				valueSize: 12,
			},
		)

		// Gamma WDR presets
		presets['presetGammaWDRHeader'] = {
			category: 'Gamma',
			name: 'Gamma WDR',
			type: 'text',
			text: '',
		}
		for (const mode of [
			{ id: 'toggle', label: 'Toggle', text: 'GAMMA\\nWDR' },
			{ id: 'false', label: 'Off', text: 'GAMMA\\nWDR\\nOFF' },
			{ id: 'true', label: 'On', text: 'GAMMA\\nWDR\\nON' },
		]) {
			createTogglePreset(
				presets,
				`presetGammaWDR${mode.label}`,
				`Gamma WDR ${mode.label}`,
				'Gamma',
				mode.text,
				'wdr',
				mode.id,
				'wdr',
				mode.id === 'toggle',
			)
		}

		// Gamma WDR Level presets
		createAdjustmentPresets('presetGammaWDRLevel', 'Gamma', 'Gamma WDR Level', 'wdrLevel', 'wdr_level', 'WDR\\nLEVEL', {
			valueSize: 12,
		})
	}
	createAdjustmentPresets(
		'presetShutterSpeed',
		'Shutter Speed',
		'Shutter Speed',
		'shutterSpeed',
		'shutter_speed',
		'SHUTTER\\nSPEED',
		{
			valueSize: 12,
		},
	)
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
			.sort((a, b) => a.value - b.value)

		for (const { value, label } of shutterSpeedEntries) {
			// Create a safe key for the preset ID (replace special characters)
			const safeLabel = label.replace(/[^a-zA-Z0-9]/g, '_')
			const presetKey = `presetShutterSpeed_${safeLabel}`

			presets[presetKey] = {
				type: 'button',
				category: 'Shutter Speed',
				name: `Shutter Speed ${label}`,
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
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
							bgcolor: Color.green,
						},
					},
				],
			}
		}
	}
	presets['systemInfoHeader'] = {
		category: 'System Info',
		name: 'Camera Info',
		type: 'text',
		text: '',
	}
	presets['systemDeviceName'] = {
		type: 'button',
		category: 'System Info',
		name: 'Device Name',
		style: {
			bgcolor: Color.darkGray,
			color: Color.white,
			text: `CAMERA\\nNAME\\n\\n$(bolin-ptz:device_name)`,
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
			bgcolor: Color.darkGray,
			color: Color.white,
			text: `CAMERA\\nMODEL\\n\n\\n$(bolin-ptz:model_name)`,
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

	const hasSystemFormat = self.camera?.hasCapability('VideoOutputInfo.SystemFormat') ?? false
	if (hasSystemFormat) {
		presets['systemFormat'] = {
			type: 'button',
			category: 'System Info',
			name: 'Format',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `SYSTEM\\nFORMAT\\n\\n$(bolin-ptz:system_format)`,
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

	const hasHdmiFormat = self.camera?.hasCapability('VideoOutputInfo.HDMIResolution') ?? false
	if (hasHdmiFormat) {
		presets['hdmiFormat'] = {
			type: 'button',
			category: 'System Info',
			name: 'HDMI Format',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `HDMI\\nFORMAT\\n\\n$(bolin-ptz:hdmi_resolution)`,
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
	const hasSdiFormat = self.camera?.hasCapability('VideoOutputInfo.SDIResolution') ?? false
	if (hasSdiFormat) {
		presets['sdiFormat'] = {
			type: 'button',
			category: 'System Info',
			name: 'SDI Format',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `SDI\\nFORMAT\\n\\n$(bolin-ptz:sdi_resolution)`,
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

	presets['pelcoID'] = {
		type: 'button',
		category: 'System Info',
		name: 'Pelco ID',
		style: {
			bgcolor: Color.darkGray,
			color: Color.white,
			text: `PELCO\\nID\\n\\n$(bolin-ptz:pelco_id)\\n`,
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

	presets['viscaID'] = {
		type: 'button',
		category: 'System Info',
		name: 'VISCA ID',
		style: {
			bgcolor: Color.darkGray,
			color: Color.white,
			text: `VISCA\\nID\\n\\n$(bolin-ptz:visca_id)\\n`,
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
	/* const hasTallyMode = self.camera?.hasCapability('OSDSystemInfo') ?? false
	if (hasTallyMode) {
		presets['tallyModeHeader'] = {
			category: 'System Info',
			name: 'Tally Mode',
			type: 'text',
			text: '',
		}

		for (const mode of [
			{ id: 'toggle', label: 'Toggle', text: 'TALLY MODE' },
			{ id: 'false', label: 'Off', text: 'TALLY\\nOFF' },
			{ id: 'true', label: 'On', text: 'TALLY\\nON' },
		]) {
			const presetKey = mode.id === 'toggle' ? `presetTallyModeToggle${mode.label}` : `presetTallyMode${mode.label}`
			createTogglePreset(
				presets,
				presetKey,
				`Tally Mode ${mode.label}`,
				'System Info',
				mode.text,
				'tallyMode',
				mode.id,
				'tallyMode',
				mode.id === 'toggle',
				{
					toggleOffIcon: icons.toggleOff,
					toggleOnIcon: icons.toggleOn,
					defaultIcon: icons.bulb,
					alignment: 'center:bottom',
				},
			)
		}
	} */

	presets['ipAddressHeader'] = {
		category: 'System Info',
		name: 'Network Info',
		type: 'text',
		text: '',
	}
	presets['ipAddress'] = {
		type: 'button',
		category: 'System Info',
		name: 'IP Address',
		style: {
			bgcolor: Color.darkGray,
			color: Color.white,
			text: `IP\\nADDRESS\\n\\n$(bolin-ptz:ip_address)\\n`,
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

	presets['subnetMask'] = {
		type: 'button',
		category: 'System Info',
		name: 'Subnet Mask',
		style: {
			bgcolor: Color.darkGray,
			color: Color.white,
			text: `SUBNET\\nMASK\\n\\n$(bolin-ptz:subnet_mask)\\n`,
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
	presets['gateway'] = {
		type: 'button',
		category: 'System Info',
		name: 'Gateway',
		style: {
			bgcolor: Color.darkGray,
			color: Color.white,
			text: `GATEWAY\\n\\n$(bolin-ptz:gateway)\\n`,
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
	presets['fallbackIP'] = {
		type: 'button',
		category: 'System Info',
		name: 'Fallback IP',
		style: {
			bgcolor: Color.darkGray,
			color: Color.white,
			text: `FALLBACK\\nIP\\n\\n$(bolin-ptz:fallback_ip_address)\\n`,
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

	presets['macAddress'] = {
		type: 'button',
		category: 'System Info',
		name: 'MAC Address',
		style: {
			bgcolor: Color.darkGray,
			color: Color.white,
			text: `MAC\\nADDRESS\\n\\n$(bolin-ptz:mac_address)\\n`,
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

	// Auto Restart presets
	const hasAutoRestartCapability = !capabilitiesLoaded || (self.camera?.hasCapability('AutoRestartInfo') ?? false)
	if (hasAutoRestartCapability) {
		const autoRestartModes = [
			{ id: 0, label: 'Never', text: 'AUTO RESTART\\nNEVER' },
			{ id: 1, label: 'Every Day', text: 'AUTO RESTART\\nDAILY' },
			{ id: 2, label: 'Every Week', text: 'AUTO RESTART\\nWEEKLY' },
			{ id: 3, label: 'Every Month', text: 'AUTO RESTART\\nMONTHLY' },
		]

		presets['autoRestartHeader'] = {
			category: 'System Info',
			name: 'Set Auto Restart Mode',
			type: 'text',
			text: '',
		}

		for (const mode of autoRestartModes) {
			presets[`autoRestart${mode.label.replace(' ', '')}`] = {
				type: 'button',
				category: 'System Info',
				name: `Auto Restart ${mode.label}`,
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: mode.text,
					size: '14',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'setAutoRestartType',
								options: {
									type: mode.id,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'autoRestartEnabled',
						options: {
							mode: mode.id,
						},
						style: {
							bgcolor: Color.green,
						},
					},
				],
			}
		}

		// Auto Restart Status Presets
		presets['autoRestartStatusHeader'] = {
			category: 'System Info',
			name: 'Auto Restart Status',
			type: 'text',
			text: '',
		}

		presets['autoRestartNext'] = {
			type: 'button',
			category: 'System Info',
			name: 'Auto Restart Next Time',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `AUTO RESTART\nNEXT\n$(bolin-ptz:auto_restart_next)`,
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

		presets['autoRestartFrequency'] = {
			type: 'button',
			category: 'System Info',
			name: 'Auto Restart Frequency',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `AUTO RESTART\nFREQ\n$(bolin-ptz:auto_restart_frequency)`,
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

		presets['autoRestartDay'] = {
			type: 'button',
			category: 'System Info',
			name: 'Auto Restart Day',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `AUTO RESTART\nDAY\n$(bolin-ptz:auto_restart_day)`,
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

		presets['autoRestartHour'] = {
			type: 'button',
			category: 'System Info',
			name: 'Auto Restart Hour',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `AUTO RESTART\nHOUR\n$(bolin-ptz:auto_restart_hour)`,
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

		presets['autoRestartMinute'] = {
			type: 'button',
			category: 'System Info',
			name: 'Auto Restart Minute',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `AUTO RESTART\nMINUTE\n$(bolin-ptz:auto_restart_minute)`,
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
	// Exposure Mode presets
	presets['presetExposureModeHeader'] = {
		category: 'Exposure',
		name: 'Exposure Mode',
		type: 'text',
		text: '',
	}
	for (const mode of [
		{ id: 0, label: 'Auto', text: 'EXP\\nAUTO' },
		{ id: 1, label: 'Manual', text: 'EXP\\nMANUAL' },
		{ id: 2, label: 'ShutterPri', text: 'EXP\\nSHUTTER\\nPRI' },
		{ id: 3, label: 'IrisPri', text: 'EXP\\nIRIS\\nPRI' },
	]) {
		presets[`presetExposureMode${mode.label}`] = {
			type: 'button',
			category: 'Exposure',
			name: `Exposure Mode ${mode.label}`,
			style: {
				text: mode.text,
				size: 14,
				color: Color.white,
				alignment: 'center:center',
				bgcolor: Color.lightGray,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'exposureMode',
							options: { mode: mode.id },
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'exposureMode',
					options: { mode: mode.label },
					style: {
						bgcolor: Color.green,
					},
				},
			],
		}
	}

	createAdjustmentPresets('presetIris', 'Exposure', 'Iris', 'iris', 'iris', 'IRIS', {
		valueIcon: icons.aperture,
	})
	presets['irisSetValueHeader'] = {
		category: 'Exposure',
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
				category: 'Exposure',
				name: `Iris ${label}`,
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
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
							bgcolor: Color.green,
						},
					},
				],
			}
		}
	}

	// Helper function to create exposure value presets
	function createExposureValuePresets(name: string, actionId: string, variableId: string, displayName: string): void {
		const baseKey = `presetExposure${name}`
		const displayUpper = displayName.toUpperCase().replace(/\s+/g, '\\n')
		createAdjustmentPresets(baseKey, 'Exposure', `Exposure ${name}`, actionId, variableId, displayUpper, {
			headerName: displayName,
		})
	}

	// Create exposure value presets
	createExposureValuePresets('Gain', 'gain', 'gain', 'Gain')
	createExposureValuePresets('GainLimit', 'gainLimit', 'gain_limit', 'Gain Limit')
	createExposureValuePresets('ExpCompLevel', 'expCompLevel', 'ex_comp_level', 'Exp Comp')

	// Smart Exposure presets
	presets['presetExposureSmartExposureHeader'] = {
		category: 'Exposure',
		name: 'Smart Exposure',
		type: 'text',
		text: '',
	}
	for (const mode of [
		{ id: 'toggle', label: 'Toggle', text: 'SMART\\nEXP' },
		{ id: 'false', label: 'Off', text: 'SMART\\nEXP\\nOFF' },
		{ id: 'true', label: 'On', text: 'SMART\\nEXP\\nON' },
	]) {
		createTogglePreset(
			presets,
			`presetExposureSmartExposure${mode.label}`,
			`Exposure Smart Exposure ${mode.label}`,
			'Exposure',
			mode.text,
			'smartExposure',
			mode.id,
			'smartExposure',
			mode.id === 'toggle',
		)
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

			createTogglePreset(
				presets,
				`presetOverlay${overlayNumber}`,
				overlayName,
				'Overlay',
				`OVERLAY\\n${overlayNumber}`,
				'overlayControl',
				'toggle',
				'overlayEnabled',
				true,
				{
					actionOptions: () => ({
						overlay: overlayNumber,
						props: ['enable'],
						mode: 'toggle',
					}),
					feedbackOptions: () => ({
						channel: overlayNumber.toString(),
					}),
				},
			)
		}
	}

	// Stream control presets
	/* const hasRTSPCapability = !capabilitiesLoaded || (self.camera?.hasCapability('RTSPInfo') ?? false)
	if (hasRTSPCapability) {
		presets['streamRTSPHeader'] = {
			category: 'AV Streams',
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
					text: `RTSP\\n${channel.label}`,
				},
				{ id: 'false', label: 'Off', text: `RTSP\\n${channel.label}\\nOFF` },
				{ id: 'true', label: 'On', text: `RTSP\\n${channel.label}\\nON` },
			]) {
				createTogglePreset(
					presets,
					`streamRTSP${channel.label}${mode.label}`,
					`RTSP ${channel.label} Stream ${mode.label}`,
					'AV Streams',
					mode.text,
					'rtspControl',
					mode.id,
					'rtspEnabled',
					mode.id === 'toggle',
					{
						actionOptions: (modeId) => ({
							channel: channel.id,
							props: ['enable'],
							enable: modeId,
						}),
						feedbackOptions: () => ({
							channel: channel.id,
						}),
					},
				)
			}
		}
	}

	const hasRTMPCapability = !capabilitiesLoaded || (self.camera?.hasCapability('RTMPInfo') ?? false)
	if (hasRTMPCapability) {
		presets['streamRTMPHeader'] = {
			category: 'AV Streams',
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
					text: `RTMP\\n${channel.label}`,
				},
				{ id: 'false', label: 'Off', text: `RTMP\\n${channel.label}\\nOFF` },
				{ id: 'true', label: 'On', text: `RTMP\\n${channel.label}\\nON` },
			]) {
				createTogglePreset(
					presets,
					`streamRTMP${channel.label}${mode.label}`,
					`RTMP ${channel.label} Stream ${mode.label}`,
					'AV Streams',
					mode.text,
					'rtmpControl',
					mode.id,
					'rtmpEnabled',
					mode.id === 'toggle',
					{
						actionOptions: (modeId) => ({
							channel: channel.id,
							props: ['enable'],
							enable: modeId,
						}),
						feedbackOptions: () => ({
							channel: channel.id,
						}),
					},
				)
			}
		}
	}

	const hasAVOverUDPCapability = !capabilitiesLoaded || (self.camera?.hasCapability('AVOverUDPInfo') ?? false)
	if (hasAVOverUDPCapability) {
		presets['streamAVOverUDPHeader'] = {
			category: 'AV Streams',
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
					text: `AV UDP\\n${channel.label}`,
				},
				{ id: 'false', label: 'Off', text: `AV UDP\\n${channel.label}\\nOFF` },
				{ id: 'true', label: 'On', text: `AV UDP\\n${channel.label}\\nON` },
			]) {
				createTogglePreset(
					presets,
					`streamAVOverUDP${channel.label}${mode.label}`,
					`AV Over UDP ${channel.label} Stream ${mode.label}`,
					'AV Streams',
					mode.text,
					'avOverUDPControl',
					mode.id,
					'avOverUDPEnabled',
					mode.id === 'toggle',
					{
						actionOptions: (modeId) => ({
							channel: channel.id,
							props: ['enable'],
							enable: modeId,
						}),
						feedbackOptions: () => ({
							channel: channel.id,
						}),
					},
				)
			}
		}
	}

	const hasAVOverRTPCapability = !capabilitiesLoaded || (self.camera?.hasCapability('AVOverRTPInfo') ?? false)
	if (hasAVOverRTPCapability) {
		presets['streamAVOverRTPHeader'] = {
			category: 'AV Streams',
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
					text: `AV RTP\\n${channel.label}`,
				},
				{ id: 'false', label: 'Off', text: `AV RTP\\n${channel.label}\\nOFF` },
				{ id: 'true', label: 'On', text: `AV RTP\\n${channel.label}\\nON` },
			]) {
				createTogglePreset(
					presets,
					`streamAVOverRTP${channel.label}${mode.label}`,
					`AV Over RTP ${channel.label} Stream ${mode.label}`,
					'AV Streams',
					mode.text,
					'avOverRTPControl',
					mode.id,
					'avOverRTPEnabled',
					mode.id === 'toggle',
					{
						actionOptions: (modeId) => ({
							channel: channel.id,
							props: ['enable'],
							enable: modeId,
						}),
						feedbackOptions: () => ({
							channel: channel.id,
						}),
					},
				)
			}
		}
	}

	const hasNDICapability = !capabilitiesLoaded || (self.camera?.hasCapability('NDIInfo') ?? false)
	if (hasNDICapability) {
		presets['streamNDIHeader'] = {
			category: 'AV Streams',
			name: 'NDI Control',
			type: 'text',
			text: '',
		}
		for (const mode of [
			{ id: 'toggle', label: 'Toggle', text: 'NDI\\n' },
			{ id: 'false', label: 'Off', text: 'NDI\\nOFF' },
			{ id: 'true', label: 'On', text: 'NDI\\nON' },
		]) {
			createTogglePreset(
				presets,
				`streamNDI${mode.label}`,
				`NDI ${mode.label}`,
				'AV Streams',
				mode.text,
				'ndiControl',
				mode.id,
				'ndiEnabled',
				mode.id === 'toggle',
				{
					actionOptions: (modeId) => ({
						props: ['ndiEnable'],
						ndiEnable: modeId,
					}),
				},
			)
		}
		presets['streamNDIName'] = {
			type: 'button',
			category: 'AV Streams',
			name: 'NDI Name',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
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
			category: 'AV Streams',
			name: 'NDI HX Bandwidth Value',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
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
			category: 'AV Streams',
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
					text: `SRT\\n${channel.label}`,
				},
				{ id: 'false', label: 'Off', text: `SRT\\n${channel.label}\\nOFF` },
				{ id: 'true', label: 'On', text: `SRT\\n${channel.label}\\nON` },
			]) {
				createTogglePreset(
					presets,
					`streamSRT${channel.label}${mode.label}`,
					`SRT ${channel.label} Stream ${mode.label}`,
					'AV Streams',
					mode.text,
					'srtControl',
					mode.id,
					'srtEnabled',
					mode.id === 'toggle',
					{
						actionOptions: (modeId) => ({
							channel: channel.id,
							props: ['enable'],
							enable: modeId,
						}),
						feedbackOptions: () => ({
							channel: channel.id,
						}),
					},
				)
			}
		}
	}
 */
	// Audio Enable presets
	if (!capabilitiesLoaded || self.camera?.hasCapability('AudioInfo')) {
		presets['presetAudioInputHeader'] = {
			category: 'Audio',
			name: 'Audio Input',
			type: 'text',
			text: '',
		}
		for (const mode of [
			{ id: 'toggle', label: 'Toggle', text: 'AUDIO\\n', icon: 'speaker' },
			{ id: 'false', label: 'Off', text: 'AUDIO\\nOFF', icon: 'speakerMute' },
			{ id: 'true', label: 'On', text: 'AUDIO\\nON', icon: 'speaker' },
		]) {
			createTogglePreset(
				presets,
				`presetAudioInput${mode.label}`,
				`Audio Enable ${mode.label}`,
				'Audio',
				mode.text,
				'audioControl',
				mode.id,
				'audioEnabled',
				mode.id === 'toggle',
				{
					defaultIcon: (modeId) => (modeId === 'false' ? icons.speakerMute : icons.speaker),
					alignment: 'center:bottom',
					actionOptions: (modeId) => ({
						props: ['enable'],
						mode: modeId,
					}),
				},
			)
		}

		/* 		// Audio Volume Set Value presets
		presets['audioVolumeSetValueHeader'] = {
			category: 'Audio',
			name: 'Volume',
			type: 'text',
			text: '',
		}
		presets[`presetAudioVolumeStatus`] = {
			type: 'button',
			category: 'Audio',
			name: `Audio Volume Status`,
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `VOLUME\\n$(bolin-ptz:audio_volume)%`,
				size: 12,
				alignment: 'center:bottom',
				png64: icons.meters,
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
		for (const volume of [
			{ value: 1, label: '1%' },
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
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `SET\\nVOLUME\\n${volume.label}`,
					size: 12,
					alignment: 'center:center',
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
							bgcolor: Color.green,
						},
					},
				],
			}
		} */
	}

	// Encoder Info presets
	const hasEncodeInfoCapability = !capabilitiesLoaded || (self.camera?.hasCapability('EncodeInfo') ?? false)
	if (hasEncodeInfoCapability) {
		// Main Stream Info
		presets['encoderInfoMainStreamHeader'] = {
			category: 'AV Streams',
			name: 'Main Stream Info',
			type: 'text',
			text: '',
		}
		presets['encoderInfoMainStreamInfo'] = {
			type: 'button',
			category: 'AV Streams',
			name: 'Main Stream Info',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `MAIN\\nSTREAM\\n$(bolin-ptz:encode_main_resolution)\\n$(bolin-ptz:encode_main_frame_rate) fps\\n$(bolin-ptz:encode_main_bitrate) Kbps`,
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
		presets['encoderInfoMainStreamResolution'] = {
			type: 'button',
			category: 'AV Streams',
			name: 'Main Stream Resolution',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `MAIN\\nRES\\n\\n$(bolin-ptz:encode_main_resolution)`,
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
			category: 'AV Streams',
			name: 'Main Stream Frame Rate',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `MAIN\\nFRAME\\n\\n$(bolin-ptz:encode_main_frame_rate) fps`,
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
			category: 'AV Streams',
			name: 'Main Stream Bitrate',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `MAIN\\nBITRATE\\n\\n$(bolin-ptz:encode_main_bitrate) Kbps`,
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
			category: 'AV Streams',
			name: 'Sub Stream Info',
			type: 'text',
			text: '',
		}
		presets['encoderInfoSubStreamInfo'] = {
			type: 'button',
			category: 'AV Streams',
			name: 'Sub Stream Info',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `SUB\\nSTREAM\\n$(bolin-ptz:encode_sub_resolution)$(bolin-ptz:encode_sub_frame_rate) fps\\n$(bolin-ptz:encode_sub_bitrate) Kbps`,
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
		presets['encoderInfoSubStreamResolution'] = {
			type: 'button',
			category: 'AV Streams',
			name: 'Sub Stream Resolution',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `SUB\\nRES\\n\\n$(bolin-ptz:encode_sub_resolution)`,
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
			category: 'AV Streams',
			name: 'Sub Stream Frame Rate',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `SUB\\nFRAME\\n\\n$(bolin-ptz:encode_sub_frame_rate) fps`,
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
			category: 'AV Streams',
			name: 'Sub Stream Bitrate',
			style: {
				bgcolor: Color.darkGray,
				color: Color.white,
				text: `SUB\\nBITRATE\\n\\n$(bolin-ptz:encode_sub_bitrate) Kbps`,
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
				category: 'AV Streams',
				name: 'Other',
				type: 'text',
				text: '',
			}
			presets['encoderInfoLowLatency'] = {
				type: 'button',
				category: 'AV Streams',
				name: 'Low Latency',
				style: {
					bgcolor: Color.darkGray,
					color: Color.white,
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
			bgcolor: Color.lightGray,
			color: Color.white,
			text: `AUTO\\nSCAN\\n\\nSTART`,
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
			bgcolor: Color.lightGray,
			color: Color.white,
			text: `AUTO\\nSCAN\\n\\nSTOP`,
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
							customSpeed: false,
							speed: '128',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	const cruiseInfo = self.camera?.getState().cruiseInfo ?? []
	if (cruiseInfo.length > 0) {
		// Cruise presets
		presets['ptzModesCruiseHeader'] = {
			category: 'PTZ Modes',
			name: 'Cruise Mode',
			type: 'text',
			text: '',
		}
	}
	// Create presets for each available cruise
	for (const cruise of cruiseInfo) {
		const cruiseName = cruise.Name || `Cruise ${cruise.Number}`
		const presetKey = `ptzModesCruiseCall${cruise.Number}`

		presets[presetKey] = {
			type: 'button',
			category: 'PTZ Modes',
			name: `CALL Cruise ${cruiseName}`,
			style: {
				bgcolor: Color.lightGray,
				color: Color.white,
				text: `CRUISE\\n$(bolin-ptz:cruise_${cruise.Number}_name)\\n\\nCALL`,
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
	if (cruiseInfo.length > 0) {
		// Stop Cruise preset
		presets['ptzModesCruiseStop'] = {
			type: 'button',
			category: 'PTZ Modes',
			name: 'STOP Cruise',
			style: {
				bgcolor: Color.lightGray,
				color: Color.white,
				text: `CRUISE\\n\\n\\nSTOP`,
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

		// Commands for each trace, with optional feedback configuration
		const traceCommands = [
			{ command: 'StartRecord', label: 'START\nRECORD', name: 'Start Record', feedbackId: 'traceRecording' },
			{ command: 'EndRecord', label: 'END\nRECORD', name: 'End Record', feedbackId: null },
			{ command: 'Call', label: 'CALL\nTRACE', name: 'Call', feedbackId: 'traceActive' },
			{ command: 'Stop', label: 'STOP\nTRACE', name: 'Stop', feedbackId: null },
			{ command: 'Delete', label: '\nDELETE', name: 'Delete', feedbackId: null },
		]

		for (const cmd of traceCommands) {
			const presetKey = `ptzModesTrace${traceNumber}${cmd.command}`

			// Build feedbacks array based on command type
			const feedbacksArray: Array<{
				feedbackId: string
				options: CompanionOptionValues
				style: Record<string, unknown>
			}> = []

			if (cmd.feedbackId === 'traceRecording') {
				feedbacksArray.push({
					feedbackId: 'traceRecording',
					options: {
						traceNumber: traceNumber.toString(),
					},
					style: {
						bgcolor: Color.red,
					},
				})
			} else if (cmd.feedbackId === 'traceActive') {
				feedbacksArray.push({
					feedbackId: 'traceActive',
					options: {
						traceNumber: traceNumber.toString(),
					},
					style: {
						bgcolor: Color.green,
					},
				})
			}

			presets[presetKey] = {
				type: 'button',
				category: 'PTZ Modes',
				name: `Trace ${traceNumber} - ${cmd.name}`,
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `TRACE ${traceNumber}\n\n${cmd.label}`,
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
				feedbacks: feedbacksArray,
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
			{ command: 'Stop', label: 'STOP\nSCAN', name: 'Stop' },
			{ command: 'Delete', label: '\nDELETE', name: 'Delete' },
		]

		for (const cmd of scanningCommands) {
			const presetKey = `ptzModesScanning${scanningNumber}${cmd.command}`
			presets[presetKey] = {
				type: 'button',
				category: 'PTZ Modes',
				name: `Scanning ${scanningNumber} - ${cmd.name}`,
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `SCAN ${scanningNumber}\n\n${cmd.label}`,
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

	for (const preset of cameraPresets) {
		const presetNumber = preset.Number

		if (presetNumber === 58) {
			// Preset 58: Night Mode (Set) / Day Mode (Call)
			presets[`presetSetNightMode`] = {
				type: 'button',
				category: 'Outdoor Features',
				name: 'Night Mode (Set)',
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `NIGHT\\nMODE`,
					size: '14',
					png64: icons.moon,
					alignment: 'center:bottom',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'presetControl',
								options: {
									command: 'Set',
									preset: preset.Number,
									customPreset: preset?.Name ? false : true,
									customPresetNumber: preset.Number,
									customPresetName: preset.Name,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
			presets[`presetCallDayMode`] = {
				type: 'button',
				category: 'Outdoor Features',
				name: 'Day Mode (Call)',
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `DAY\\nMODE`,
					size: '14',
					png64: icons.sun,
					alignment: 'center:bottom',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'presetControl',
								options: {
									command: 'Call',
									preset: preset.Number,
									customPreset: preset?.Name ? false : true,
									customPresetNumber: preset.Number,
									customPresetName: preset.Name,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
		} else if (presetNumber === 59) {
			// Preset 59: Auto Day/Night (Call)
			presets[`presetCallAutoDayNight`] = {
				type: 'button',
				category: 'Outdoor Features',
				name: 'Auto Day/Night',
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `AUTO\\nDAY/ NIGHT`,
					size: 12,
					png64: icons.dayNight,
					alignment: 'center:bottom',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'presetControl',
								options: {
									command: 'Call',
									preset: preset.Number,
									customPreset: preset?.Name ? false : true,
									customPresetNumber: preset.Number,
									customPresetName: preset.Name,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
		} else if (presetNumber === 61) {
			// Preset 61: Defog OFF (Set) / ON (Call)
			presets[`presetSetDefogOff`] = {
				type: 'button',
				category: 'Outdoor Features',
				name: 'Defog OFF (Set)',
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `DEFOG\\nOFF`,
					size: '14',
					png64: icons.fog,
					alignment: 'center:bottom',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'presetControl',
								options: {
									command: 'Set',
									preset: preset.Number,
									customPreset: preset?.Name ? false : true,
									customPresetNumber: preset.Number,
									customPresetName: preset.Name,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
			presets[`presetCallDefogOn`] = {
				type: 'button',
				category: 'Outdoor Features',
				name: 'Defog ON (Call)',
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `DEFOG\\nON`,
					size: '14',
					png64: icons.fog,
					alignment: 'center:bottom',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'presetControl',
								options: {
									command: 'Call',
									preset: preset.Number,
									customPreset: preset?.Name ? false : true,
									customPresetNumber: preset.Number,
									customPresetName: preset.Name,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
		} else if (presetNumber === 62) {
			// Preset 62: Sngl.Wiper ON (Set) / OFF (Call)
			presets[`presetSetWiperOn`] = {
				type: 'button',
				category: 'Outdoor Features',
				name: 'Wiper ON (Set)',
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `WIPER\\nON`,
					size: '14',
					png64: icons.wiper,
					alignment: 'center:bottom',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'presetControl',
								options: {
									command: 'Set',
									preset: preset.Number,
									customPreset: preset?.Name ? false : true,
									customPresetNumber: preset.Number,
									customPresetName: preset.Name,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
			presets[`presetCallWiperOff`] = {
				type: 'button',
				category: 'Outdoor Features',
				name: 'Wiper OFF (Call)',
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `WIPER\\nOFF`,
					size: '14',
					png64: icons.wiper,
					alignment: 'center:bottom',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'presetControl',
								options: {
									command: 'Call',
									preset: preset.Number,
									customPreset: preset?.Name ? false : true,
									customPresetNumber: preset.Number,
									customPresetName: preset.Name,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
		} else if (presetNumber === 63) {
			// Preset 63: Heater OFF (Set) / ON (Call)
			presets[`presetSetHeaterOff`] = {
				type: 'button',
				category: 'Outdoor Features',
				name: 'Heater OFF (Set)',
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `HEATER\\nOFF`,
					size: '14',
					png64: icons.temp,
					alignment: 'center:bottom',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'presetControl',
								options: {
									command: 'Set',
									preset: preset.Number,
									customPreset: preset?.Name ? false : true,
									customPresetNumber: preset.Number,
									customPresetName: preset.Name,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
			presets[`presetCallHeaterOn`] = {
				type: 'button',
				category: 'Outdoor Features',
				name: 'Heater ON (Call)',
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `HEATER\\nON`,
					size: '14',
					png64: icons.temp,
					alignment: 'center:bottom',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'presetControl',
								options: {
									command: 'Call',
									preset: preset.Number,
									customPreset: preset?.Name ? false : true,
									customPresetNumber: preset.Number,
									customPresetName: preset.Name,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
		} else if (presetNumber === 64) {
			// Preset 64: Cont.Wiper ON (Set) / OFF (Call)
			presets[`presetSetContWiperOn`] = {
				type: 'button',
				category: 'Outdoor Features',
				name: 'Cont. Wiper ON (Set)',
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `CONT.\\nWIPER ON`,
					size: 12,
					png64: icons.wiper,
					alignment: 'center:bottom',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'presetControl',
								options: {
									command: 'Set',
									preset: preset.Number,
									customPreset: preset?.Name ? false : true,
									customPresetNumber: preset.Number,
									customPresetName: preset.Name,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
			presets[`presetCallContWiperOff`] = {
				type: 'button',
				category: 'Outdoor Features',
				name: 'Cont. Wiper OFF (Call)',
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `CONT.\\nWIPER OFF`,
					size: 12,
					png64: icons.wiper,
					alignment: 'center:bottom',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'presetControl',
								options: {
									command: 'Call',
									preset: preset.Number,
									customPreset: preset?.Name ? false : true,
									customPresetNumber: preset.Number,
									customPresetName: preset.Name,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
		} else if (presetNumber === 65) {
			// Preset 65:Illumination ON (Set) / OFF (Call)
			presets[`presetSetIlluminationOn`] = {
				type: 'button',
				category: 'Outdoor Features',
				name: 'Illumination ON (Set)',
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `EXT LIGHT\\nON`,
					size: 12,
					png64: icons.bulb,
					alignment: 'center:bottom',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'presetControl',
								options: {
									command: 'Set',
									preset: preset.Number,
									customPreset: preset?.Name ? false : true,
									customPresetNumber: preset.Number,
									customPresetName: preset.Name,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
			presets[`presetCallIlluminationOff`] = {
				type: 'button',
				category: 'Outdoor Features',
				name: 'Illumination OFF (Call)',
				style: {
					bgcolor: Color.lightGray,
					color: Color.white,
					text: `EXT LIGHT\\nOFF`,
					size: 12,
					png64: icons.bulb,
					alignment: 'center:bottom',
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'presetControl',
								options: {
									command: 'Call',
									preset: preset.Number,
									customPreset: preset?.Name ? false : true,
									customPresetNumber: preset.Number,
									customPresetName: preset.Name,
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
