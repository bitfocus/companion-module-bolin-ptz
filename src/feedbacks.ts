import type { ModuleInstance } from './main.js'
import type { PositionLimitations } from './types.js'
import type { CompanionFeedbackBooleanEvent } from '@companion-module/base'
import { CompanionFeedbackDefinitions } from '@companion-module/base'
import { sortIrisChoices, sortShutterSpeedChoices, convertIrisRangeToMap, convertIrisValueToFStop } from './utils.js'

export function UpdateFeedbacks(self: ModuleInstance): void {
	const feedbacks: CompanionFeedbackDefinitions = {}

	// Only check capabilities if they've been loaded, otherwise create all feedbacks
	const capabilitiesLoaded = self.camera?.getStoredCameraCapabilities() !== null

	const hasCapability = (cap: string): boolean => {
		if (!capabilitiesLoaded) return true
		return self.camera?.hasCapability(cap) ?? false
	}

	function createToggleFeedback(feedbackID: string, name: string, description: string, callback: () => boolean): void {
		feedbacks[feedbackID] = {
			name: name,
			description: description,
			type: 'boolean',
			defaultStyle: {
				bgcolor: 0x009900,
			},
			options: [],
			callback: callback,
		}
	}

	function createValueFeedback(
		feedbackID: string,
		name: string,
		description: string,
		defaultValue: number,
		currentValue: number,
	): void {
		feedbacks[feedbackID] = {
			name: name,
			description: description,
			type: 'boolean',
			defaultStyle: {
				bgcolor: 0x009900,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Comparison',
					id: 'comparison',
					choices: [
						{ label: 'Equal to', id: 'equal' },
						{ label: 'Greater than', id: 'greaterThan' },
						{ label: 'Less than', id: 'lessThan' },
					],
					default: 'equal',
				},
				{
					type: 'textinput',
					label: 'Value',
					id: 'value',
					default: defaultValue.toString(),
					useVariables: true,
				},
			],
			callback: (feedback: CompanionFeedbackBooleanEvent) => {
				const comparison = feedback.options.comparison as string as 'equal' | 'greaterThan' | 'lessThan'
				const value = Number(feedback.options.value)

				switch (comparison) {
					case 'equal':
						return currentValue == value
					case 'greaterThan':
						return currentValue > value
					case 'lessThan':
						return currentValue < value
				}
			},
		}
	}

	// Mapping of capability names to their corresponding feedback creation functions
	const feedbackMappings: Array<{
		capabilities: string[]
		createFeedbacks: () => void
	}> = [
		{
			capabilities: ['ExposureInfo', 'Exposure'],
			createFeedbacks: () => {
				createValueFeedback(
					'gain',
					'Exposure - Gain',
					'Gain matches selected value',
					50,
					self.camera?.getState().exposureInfo?.Gain ?? 0,
				)
				createToggleFeedback('smartExposure', 'Exposure - Smart Exposure', 'Smart exposure is enabled', () => {
					return self.camera?.getState().exposureInfo?.SmartExposure ?? false
				})

				// Shutter Speed feedback - uses dynamic map from capabilities
				const shutterSpeedMap = self.camera?.getShutterSpeedMapForActions() ?? {}
				const shutterSpeedChoices = sortShutterSpeedChoices(
					Object.entries(shutterSpeedMap).map(([_value, label]) => ({
						label: label,
						id: label,
					})),
				)

				if (shutterSpeedChoices.length > 0) {
					feedbacks['shutterSpeed'] = {
						name: 'Exposure - Shutter Speed',
						description: 'Shutter speed matches selected value',
						type: 'boolean',
						defaultStyle: {
							bgcolor: 0x009900,
						},
						options: [
							{
								type: 'dropdown',
								label: 'Shutter Speed',
								id: 'speed',
								choices: shutterSpeedChoices,
								default: shutterSpeedChoices[0]?.id ?? '1/60',
							},
						],
						callback: (feedback: CompanionFeedbackBooleanEvent) => {
							const selectedSpeed = feedback.options.speed as string
							return self.camera?.getState().exposureInfo?.ShutterSpeed === selectedSpeed
						},
					}
				}

				// Iris feedback - uses dynamic map from capabilities (enum) or range
				let irisMap = self.camera?.getIrisMapForActions() ?? {}
				const irisRange = self.camera?.getIrisRangeForActions()

				// If we have a range but no map, convert the range to a map
				if (Object.keys(irisMap).length === 0 && irisRange) {
					irisMap = convertIrisRangeToMap(irisRange)
				}

				// If we have a map (either from enum or converted from range), create dropdown feedback
				// Note: irisMap is already filtered to common f-stops at build time
				if (Object.keys(irisMap).length > 0) {
					const irisChoices = sortIrisChoices(
						Object.entries(irisMap).map(([_value, label]) => ({
							label: label,
							id: label,
						})),
					)

					feedbacks['iris'] = {
						name: 'Exposure - Iris',
						description: 'Iris matches selected f-stop value',
						type: 'boolean',
						defaultStyle: {
							bgcolor: 0x009900,
						},
						options: [
							{
								type: 'dropdown',
								label: 'Iris',
								id: 'iris',
								choices: irisChoices,
								default: irisChoices[0]?.id ?? 'F1.6',
							},
						],
						callback: (feedback: CompanionFeedbackBooleanEvent) => {
							const selectedIris = feedback.options.iris as string
							const currentIris = self.camera?.getState().exposureInfo?.Iris
							if (currentIris === undefined) return false

							// Look up the current numeric value in the map
							const currentIrisLabel = irisMap[currentIris]
							if (currentIrisLabel) {
								// Found in map (enum type or converted range)
								return currentIrisLabel === selectedIris
							}

							// If not in map but we have a range, convert to F-stop for comparison
							if (irisRange) {
								const convertedLabel = convertIrisValueToFStop(currentIris)
								return convertedLabel === selectedIris
							}

							return false
						},
					}
				}
			},
		},
		{
			capabilities: ['WhiteBalanceInfo', 'WhiteBalance'],
			createFeedbacks: () => {
				createValueFeedback(
					'colorTemperature',
					'White Balance - Color Temperature',
					'Color temperature matches selected value',
					5000,
					self.camera?.getState().whiteBalanceInfo?.ColorTemperature ?? 5500,
				)
				feedbacks['whiteBalanceMode'] = {
					name: 'White Balance - Mode',
					description: 'White balance mode matches selected value',
					type: 'boolean',
					defaultStyle: {
						bgcolor: 0x009900,
					},
					options: [
						{
							type: 'dropdown',
							label: 'Mode',
							id: 'mode',
							choices: [
								{ label: 'Auto', id: 'Auto' },
								{ label: 'Indoor', id: 'Indoor' },
								{ label: 'Outdoor', id: 'Outdoor' },
								{ label: 'OPW', id: 'OPW' },
								{ label: 'ATW', id: 'ATW' },
								{ label: 'User', id: 'User' },
								{ label: 'SVL', id: 'SVL' },
								{ label: 'ManualColorTemperature', id: 'ManualColorTemperature' },
							],
							default: 'Auto',
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const mode = feedback.options.mode as string
						return self.camera?.getState().whiteBalanceInfo?.Mode === mode
					},
				}
			},
		},
		{
			capabilities: ['OverlayInfo'],
			createFeedbacks: () => {
				feedbacks['overlayEnabled'] = {
					name: 'Overlay Enabled',
					description: 'Selected overlay channel is enabled',
					type: 'boolean',
					defaultStyle: {
						bgcolor: 0x009900,
					},
					options: [
						{
							type: 'textinput',
							label: 'Overlay Number',
							id: 'channel',
							default: '1',
							useVariables: true,
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const channel = Number(feedback.options.channel)
						const overlayInfo = self.camera?.getState().overlayInfo
						if (!overlayInfo) return false
						const overlay = overlayInfo.find((o) => o.Channel === channel)
						return overlay?.Enable ?? false
					},
				}
			},
		},
		{
			capabilities: ['PictureInfo', 'Picture'],
			createFeedbacks: () => {
				createToggleFeedback('flip', 'Picture - Flip', 'Image flip is enabled', () => {
					return self.camera?.getState().pictureInfo?.Flip ?? false
				})

				createToggleFeedback('mirror', 'Picture - Mirror', 'Image mirror is enabled', () => {
					return self.camera?.getState().pictureInfo?.Mirror ?? false
				})

				createToggleFeedback('hlcMode', 'Picture - HLC Mode', 'HLC mode is enabled', () => {
					return self.camera?.getState().pictureInfo?.HLCMode ?? false
				})

				createToggleFeedback('blcMode', 'Picture - BLC', 'BLC mode is enabled', () => {
					return self.camera?.getState().pictureInfo?.BLC ?? false
				})
			},
		},
		{
			capabilities: ['LensInfo', 'Lens'],
			createFeedbacks: () => {
				createToggleFeedback('smart', 'Lens - Smart Focus', 'Smart focus is enabled', () => {
					return self.camera?.getState().lensInfo?.SmartFocus ?? false
				})

				createToggleFeedback('focusMode', 'Focus - Mode', 'Focus mode is set to Auto', () => {
					return self.camera?.getState().lensInfo?.FocusMode === 'Auto' ? true : false
				})

				createToggleFeedback('digitalZoom', 'Lens - Digital Zoom', 'Digital zoom is enabled', () => {
					return self.camera?.getState().lensInfo?.DigitalZoom ?? false
				})

				createToggleFeedback('zoomRatioOSD', 'Lens - Zoom Ratio OSD', 'Zoom ratio OSD is enabled', () => {
					return self.camera?.getState().lensInfo?.ZoomRatioOSD ?? false
				})
			},
		},
		{
			capabilities: ['GammaInfo'],
			createFeedbacks: () => {
				createToggleFeedback('wdr', 'Gamma - WDR', 'WDR is enabled', () => {
					return self.camera?.getState().gammaInfo?.WDR ?? false
				})
			},
		},
		{
			capabilities: ['PanTiltInfo', 'PTZFMoveInfo'],
			createFeedbacks: () => {
				createToggleFeedback(
					'panDirectionInverted',
					'PTZ - Pan Direction Inverted',
					'Pan direction is inverted',
					() => {
						return self.camera?.getState().panTiltInfo?.PanDirection === 1
					},
				)

				createToggleFeedback(
					'tiltDirectionInverted',
					'PTZ - Tilt Direction Inverted',
					'Tilt direction is inverted',
					() => {
						return self.camera?.getState().panTiltInfo?.TiltDirection === 1
					},
				)
			},
		},
		{
			capabilities: ['PositionLimitations'],
			createFeedbacks: () => {
				feedbacks['positionLimitEnabled'] = {
					name: 'PTZ - Position Limit Enabled',
					description: 'Position limit is locked for selected direction',
					type: 'boolean',
					defaultStyle: {
						bgcolor: 0x009900,
					},
					options: [
						{
							type: 'dropdown',
							label: 'Direction',
							choices: [
								{ label: 'Up', id: 'UpLimit' },
								{ label: 'Down', id: 'DownLimit' },
								{ label: 'Left', id: 'LeftLimit' },
								{ label: 'Right', id: 'RightLimit' },
							],
							default: 'UpLimit',
							id: 'direction',
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const direction = feedback.options.direction as keyof PositionLimitations
						return self.camera?.getState().positionLimitations?.[direction] ?? false
					},
				}
			},
		},
	]

	// Filter and create feedbacks based on capabilities
	for (const mapping of feedbackMappings) {
		if (
			!capabilitiesLoaded ||
			mapping.capabilities.length === 0 ||
			mapping.capabilities.some((cap) => hasCapability(cap))
		) {
			mapping.createFeedbacks()
		}
	}

	self.setFeedbackDefinitions(feedbacks)
}
