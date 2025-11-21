import { CompanionPresetDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { graphics } from 'companion-module-utils'

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

	presets['ptzControlHeaderFocus'] = {
		category: 'PTZ Control',
		name: 'Camera Focus',
		type: 'text',
		text: '',
	}
	presets[`presetFocusNear`] = {
		type: 'button',
		category: 'PTZ Control',
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
		category: 'PTZ Control',
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
	presets[`presetFocusAuto`] = {
		type: 'button',
		category: 'PTZ Control',
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
		category: 'PTZ Control',
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

	const cameraPresets = self.camera?.currentPresets()
	if (!cameraPresets) return
	presets['presetCallHeader'] = {
		category: 'PTZ Presets',
		name: 'Call Presets',
		type: 'text',
		text: '',
	}
	for (const preset of cameraPresets) {
		presets[`presetCall${preset.Number.toString()}`] = {
			type: 'button',
			category: 'PTZ Presets',
			name: 'Call ' + preset.Name + ' (' + preset.Number + ')',
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `CALL\\n${preset.Name}`,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'presetControl',
							options: {
								command: 'Call',
								preset: preset.Number,
								customPreset: false,
								customPresetNumber: preset.Number,
								customPresetName: 'Preset $(options:customPresetNumber)',
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
	for (const preset of cameraPresets) {
		presets[`presetSave${preset.Number.toString()}`] = {
			type: 'button',
			category: 'PTZ Presets',
			name: 'Save ' + preset.Name + ' (' + preset.Number + ')',
			style: {
				bgcolor: 0x000000,
				color: 0xffffff,
				text: `SAVE\\n${preset.Name}`,
				size: '14',
			},
			steps: [
				{
					down: [
						{
							actionId: 'presetControl',
							options: {
								command: 'Set',
								preset: preset.Number,
								customPreset: false,
								customPresetNumber: preset.Number,
								customPresetName: 'Preset $(options:customPresetNumber)',
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
				text: `WHITE\\nBALANCE\\n${key}`,
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
	self.setPresetDefinitions(presets)
}
