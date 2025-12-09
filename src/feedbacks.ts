import type { BolinModuleInstance } from './main.js'
import type { PositionLimitations, PictureInfo } from './types.js'
import type { CompanionFeedbackBooleanEvent } from '@companion-module/base'
import { CompanionFeedbackDefinitions } from '@companion-module/base'
import { sortIrisChoices, sortShutterSpeedChoices, convertIrisRangeToMap, convertIrisValueToFStop } from './utils.js'

export function UpdateFeedbacks(self: BolinModuleInstance): void {
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
		getCurrentValue: () => number,
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
				const currentValue = getCurrentValue()
				const comparison = feedback.options.comparison as string as 'equal' | 'greaterThan' | 'lessThan'
				const value = Number(feedback.options.value)
				switch (comparison) {
					case 'equal':
						return currentValue === value
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
					() => self.camera?.getState().exposureInfo?.Gain ?? 0,
				)
				createToggleFeedback('smartExposure', 'Exposure - Smart Exposure', 'Smart exposure is enabled', () => {
					return self.camera?.getState().exposureInfo?.SmartExposure ?? false
				})

				feedbacks['exposureMode'] = {
					name: 'Exposure - Mode',
					description: 'Exposure mode matches selected mode',
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
								{ label: 'Manual', id: 'Manual' },
								{ label: 'ShutterPri', id: 'ShutterPri' },
								{ label: 'IrisPri', id: 'IrisPri' },
							],
							default: 'Auto',
						},
					],
					callback: (event) => {
						const currentMode = self.camera?.getState().exposureInfo?.Mode ?? 'Auto'
						const selectedMode = event.options.mode as string
						return currentMode === selectedMode
					},
				}

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
					() => self.camera?.getState().whiteBalanceInfo?.ColorTemperature ?? 5500,
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
				feedbacks['whiteBalanceSensitivity'] = {
					name: 'White Balance - Sensitivity',
					description: 'White balance sensitivity matches selected value',
					type: 'boolean',
					defaultStyle: {
						bgcolor: 0x009900,
					},
					options: [
						{
							type: 'dropdown',
							label: 'Sensitivity',
							id: 'sensitivity',
							choices: [
								{ label: 'Low', id: 0 },
								{ label: 'Middle', id: 1 },
								{ label: 'High', id: 2 },
							],
							default: 1,
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const sensitivity = feedback.options.sensitivity as number
						return self.camera?.getState().whiteBalanceInfo?.WBSensitivity === sensitivity
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
				feedbacks['scene'] = {
					name: 'Picture - Scene',
					description: 'Scene mode matches selected value',
					type: 'boolean',
					defaultStyle: {
						bgcolor: 0x009900,
					},
					options: [
						{
							type: 'dropdown',
							label: 'Scene',
							id: 'scene',
							choices: [
								{ label: 'Standard', id: 1 },
								{ label: 'Bright', id: 3 },
								{ label: 'Clarity', id: 4 },
								{ label: 'Soft', id: 5 },
							],
							default: 1,
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const sceneNumber = feedback.options.scene as number
						const currentScene = self.camera?.getState().pictureInfo?.Scene
						// Convert current scene string to number for comparison
						const sceneMap: Record<string, number> = {
							Standard: 1,
							Bright: 3,
							Clarity: 4,
							Soft: 5,
						}
						const currentSceneNumber = typeof currentScene === 'string' ? (sceneMap[currentScene] ?? -1) : currentScene
						return currentSceneNumber === sceneNumber
					},
				}
				feedbacks['defogMode'] = {
					name: 'Picture - Defog Mode',
					description: 'Defog mode matches selected value',
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
								{ label: 'OFF', id: 0 },
								{ label: 'Auto', id: 1 },
								{ label: 'Manual', id: 2 },
							],
							default: 0,
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const modeNumber = feedback.options.mode as number
						const currentMode = self.camera?.getState().pictureInfo?.DefogMode
						// Convert current mode string to number for comparison
						const defogMap: Record<string, number> = {
							OFF: 0,
							Auto: 1,
							Manual: 2,
						}
						const currentModeNumber = typeof currentMode === 'string' ? (defogMap[currentMode] ?? -1) : currentMode
						return currentModeNumber === modeNumber
					},
				}
				feedbacks['effect'] = {
					name: 'Picture - Effect',
					description: 'Effect matches selected value',
					type: 'boolean',
					defaultStyle: {
						bgcolor: 0x009900,
					},
					options: [
						{
							type: 'dropdown',
							label: 'Effect',
							id: 'effect',
							choices: [
								{ label: 'Day', id: 0 },
								{ label: 'Night', id: 1 },
							],
							default: 0,
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const effectNumber = feedback.options.effect as number
						const currentEffect = self.camera?.getState().pictureInfo?.Effect
						// Convert current effect string to number for comparison
						const effectMap: Record<string, number> = {
							Day: 0,
							Night: 1,
						}
						const currentEffectNumber =
							typeof currentEffect === 'string' ? (effectMap[currentEffect] ?? -1) : currentEffect
						return currentEffectNumber === effectNumber
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
					feedbacks['colorMatrix'] = {
						name: 'Picture - Color Matrix',
						description: 'Color matrix value matches selected value',
						type: 'boolean',
						defaultStyle: {
							bgcolor: 0x009900,
						},
						options: [
							{
								type: 'dropdown',
								label: 'Matrix Option',
								id: 'matrix',
								choices: [
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
								],
								default: 'MagentaSaturation',
							},
							{
								type: 'textinput',
								label: 'Value',
								id: 'value',
								default: '0',
								useVariables: true,
							},
						],
						callback: (feedback: CompanionFeedbackBooleanEvent) => {
							const matrixOption = feedback.options.matrix as keyof PictureInfo
							const value = parseInt(feedback.options.value as string)
							if (isNaN(value)) return false
							const currentValue = self.camera?.getState().pictureInfo?.[matrixOption] as number
							return currentValue === value
						},
					}
				}
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

				createToggleFeedback('lowLatency', 'Encode - Low Latency', 'Low latency encoding is enabled', () => {
					return self.camera?.getState().encodeInfo?.LowLatency?.Enable ?? false
				})

				createValueFeedback(
					'mfSpeed',
					'Lens - MF Speed',
					'MF speed matches selected value',
					0,
					() => self.camera?.getState().lensInfo?.MFSpeed ?? 0,
				)
				feedbacks['afSensitivity'] = {
					name: 'Lens - AF Sensitivity',
					description: 'AF sensitivity matches selected value',
					type: 'boolean',
					defaultStyle: {
						bgcolor: 0x009900,
					},
					options: [
						{
							type: 'dropdown',
							label: 'Sensitivity',
							id: 'sensitivity',
							choices: [
								{ label: 'Low', id: 'Low' },
								{ label: 'Middle', id: 'Middle' },
								{ label: 'High', id: 'High' },
							],
							default: 'Middle',
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const sensitivity = feedback.options.sensitivity as string
						return self.camera?.getState().lensInfo?.AFSensitivity === sensitivity
					},
				}
			},
		},
		{
			capabilities: ['GammaInfo'],
			createFeedbacks: () => {
				createToggleFeedback('wdr', 'Gamma - WDR', 'WDR is enabled', () => {
					return self.camera?.getState().gammaInfo?.WDR ?? false
				})
				feedbacks['gammaLevel'] = {
					name: 'Gamma - Level',
					description: 'Gamma level matches selected value',
					type: 'boolean',
					defaultStyle: {
						bgcolor: 0x009900,
					},
					options: [
						{
							type: 'dropdown',
							label: 'Level',
							id: 'level',
							choices: [
								{ label: 'Default', id: 0 },
								{ label: '0.45', id: 1 },
								{ label: '0.50', id: 2 },
								{ label: '0.55', id: 3 },
								{ label: '0.63', id: 4 },
							],
							default: 0,
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const levelNumber = feedback.options.level as number
						const currentLevel = self.camera?.getState().gammaInfo?.Level
						// Convert current level string to number for comparison
						const levelMap: Record<string, number> = {
							Default: 0,
							'0.45': 1,
							'0.50': 2,
							'0.55': 3,
							'0.63': 4,
						}
						const currentLevelNumber = typeof currentLevel === 'string' ? (levelMap[currentLevel] ?? -1) : currentLevel
						return currentLevelNumber === levelNumber
					},
				}
				createValueFeedback(
					'gammaBright',
					'Gamma - Bright',
					'Gamma brightness matches selected value',
					50,
					() => self.camera?.getState().gammaInfo?.Bright ?? 0,
				)
				createValueFeedback(
					'wdrLevel',
					'Gamma - WDR Level',
					'WDR level matches selected value',
					50,
					() => self.camera?.getState().gammaInfo?.WDRLevel ?? 0,
				)
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
		{
			capabilities: ['RTSPInfo'],
			createFeedbacks: () => {
				feedbacks['rtspEnabled'] = {
					name: 'Stream - RTSP Enabled',
					description: 'RTSP stream is enabled for selected channel',
					type: 'boolean',
					defaultStyle: {
						bgcolor: 0x009900,
					},
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							choices: [
								{ label: 'Main Stream', id: 0 },
								{ label: 'Sub Stream', id: 1 },
							],
							default: 0,
							id: 'channel',
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const channel = feedback.options.channel as number
						const rtspInfo = self.camera?.getState().rtspInfo
						if (!rtspInfo) return false
						const stream = rtspInfo.find((s) => s.Channel === channel)
						return stream?.Enable ?? false
					},
				}
			},
		},
		{
			capabilities: ['RTMPInfo'],
			createFeedbacks: () => {
				feedbacks['rtmpEnabled'] = {
					name: 'Stream - RTMP Enabled',
					description: 'RTMP stream is enabled for selected channel',
					type: 'boolean',
					defaultStyle: {
						bgcolor: 0x009900,
					},
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							choices: [
								{ label: 'Main Stream', id: 0 },
								{ label: 'Sub Stream', id: 1 },
							],
							default: 0,
							id: 'channel',
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const channel = feedback.options.channel as number
						const rtmpInfo = self.camera?.getState().rtmpInfo
						if (!rtmpInfo) return false
						const stream = rtmpInfo.find((s) => s.Channel === channel)
						return stream?.Enable ?? false
					},
				}
			},
		},
		{
			capabilities: ['AVOverUDPInfo'],
			createFeedbacks: () => {
				feedbacks['avOverUDPEnabled'] = {
					name: 'Stream - AV Over UDP Enabled',
					description: 'AV over UDP stream is enabled for selected channel',
					type: 'boolean',
					defaultStyle: {
						bgcolor: 0x009900,
					},
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							choices: [
								{ label: 'Main Stream', id: 0 },
								{ label: 'Sub Stream', id: 1 },
							],
							default: 0,
							id: 'channel',
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const channel = feedback.options.channel as number
						const avOverUDPInfo = self.camera?.getState().avOverUDPInfo
						if (!avOverUDPInfo) return false
						const stream = avOverUDPInfo.find((s) => s.Channel === channel)
						return stream?.Enable ?? false
					},
				}
			},
		},
		{
			capabilities: ['AVOverRTPInfo'],
			createFeedbacks: () => {
				feedbacks['avOverRTPEnabled'] = {
					name: 'Stream - AV Over RTP Enabled',
					description: 'AV over RTP stream is enabled for selected channel',
					type: 'boolean',
					defaultStyle: {
						bgcolor: 0x009900,
					},
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							choices: [
								{ label: 'Main Stream', id: 0 },
								{ label: 'Sub Stream', id: 1 },
							],
							default: 0,
							id: 'channel',
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const channel = feedback.options.channel as number
						const avOverRTPInfo = self.camera?.getState().avOverRTPInfo
						if (!avOverRTPInfo) return false
						const stream = avOverRTPInfo.find((s) => s.Channel === channel)
						return stream?.Enable ?? false
					},
				}
			},
		},
		{
			capabilities: ['NDIInfo'],
			createFeedbacks: () => {
				createToggleFeedback('ndiEnabled', 'Stream - NDI Enabled', 'NDI stream is enabled', () => {
					return self.camera?.getState().ndiInfo?.NDIEnable ?? false
				})
			},
		},
		{
			capabilities: ['SRTInfo'],
			createFeedbacks: () => {
				feedbacks['srtEnabled'] = {
					name: 'Stream - SRT Enabled',
					description: 'SRT stream is enabled for selected channel',
					type: 'boolean',
					defaultStyle: {
						bgcolor: 0x009900,
					},
					options: [
						{
							type: 'dropdown',
							label: 'Channel',
							choices: [
								{ label: 'Main Stream', id: 0 },
								{ label: 'Sub Stream', id: 1 },
							],
							default: 0,
							id: 'channel',
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const channel = feedback.options.channel as number
						const srtInfo = self.camera?.getState().srtInfo
						if (!srtInfo) return false
						const stream = srtInfo.find((s) => s.Channel === channel)
						return stream?.Enable ?? false
					},
				}
			},
		},
		{
			capabilities: ['AudioInfo'],
			createFeedbacks: () => {
				createToggleFeedback('audioEnabled', 'Audio - Enabled', 'Audio is enabled', () => {
					return self.camera?.getState().audioInfo?.Enable ?? false
				})

				createValueFeedback(
					'audioVolume',
					'Audio - Volume Level',
					'Audio volume level matches selected value',
					50,
					() => self.camera?.getState().audioInfo?.Volume ?? 0,
				)
			},
		},
		{
			capabilities: ['AutoRestartInfo'],
			createFeedbacks: () => {
				feedbacks['autoRestartEnabled'] = {
					name: 'Auto Restart - Mode Active',
					description: 'Auto restart is set to the specified mode',
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
								{ label: 'Never', id: 0 },
								{ label: 'Every Day', id: 1 },
								{ label: 'Every Week', id: 2 },
								{ label: 'Every Month', id: 3 },
							],
							default: 1,
						},
					],
					callback: (feedback: CompanionFeedbackBooleanEvent) => {
						const autoRestartInfo = self.camera?.getState().autoRestartInfo
						const selectedMode = feedback.options.mode as number
						return autoRestartInfo ? autoRestartInfo.Type === selectedMode : false
					},
				}
			},
		},
		{
			capabilities: ['OSDSystemInfo'],
			createFeedbacks: () => {
				createToggleFeedback('tallyMode', 'Tally - Mode', 'Tally mode is enabled', () => {
					return self.camera?.getState()?.osdSystemInfo?.TallyMode ?? false
				})
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
