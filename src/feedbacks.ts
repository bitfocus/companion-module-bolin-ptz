import type { ModuleInstance } from './main.js'
import type { PositionLimitations } from './types.js'
import { CompanionFeedbackDefinitions } from '@companion-module/base'

export function UpdateFeedbacks(self: ModuleInstance): void {
	const feedbacks: CompanionFeedbackDefinitions = {}

	// Only check capabilities if they've been loaded, otherwise create all feedbacks
	const capabilitiesLoaded = self.camera?.currentCameraCapabilities() !== null

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
			callback: (feedback: any) => {
				const comparison = feedback.options.comparison as 'equal' | 'greaterThan' | 'lessThan'
				const value = feedback.options.value as number

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
				createValueFeedback('gain', 'Gain', 'Gain', 50, self.camera?.currentExposureInfo()?.Gain ?? 0)
				createToggleFeedback('smartExposure', 'Smart Exposure', 'Smart exposure enabled', () => {
					return self.camera?.currentExposureInfo()?.SmartExposure ?? false
				})
			},
		},
		{
			capabilities: ['WhiteBalanceInfo', 'WhiteBalance'],
			createFeedbacks: () => {
				createValueFeedback(
					'colorTemperature',
					'Color Temperature',
					'Color temperature',
					5000,
					self.camera?.currentWhiteBalanceInfo()?.ColorTemperature ?? 5500,
				)
				feedbacks['whiteBalanceMode'] = {
					name: 'White Balance Mode',
					description: 'White balance mode',
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
					callback: (feedback: any) => {
						const mode = feedback.options.mode as number
						return self.camera?.currentWhiteBalanceInfo()?.Mode === mode.toString()
					},
				}
			},
		},
		{
			capabilities: ['OverlayInfo'],
			createFeedbacks: () => {
				feedbacks['overlayEnabled'] = {
					name: 'Overlay Enabled',
					description: 'Overlay enabled',
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
					callback: (feedback: any) => {
						const channel = Number(feedback.options.channel)
						const overlayInfo = self.camera?.currentOverlayInfo()
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
				createToggleFeedback('flip', 'Flip', 'Flip enabled', () => {
					return self.camera?.currentPictureInfo()?.Flip ?? false
				})

				createToggleFeedback('mirror', 'Mirror', 'Mirror enabled', () => {
					return self.camera?.currentPictureInfo()?.Mirror ?? false
				})

				createToggleFeedback('hlcMode', 'HLC Mode', 'HLC mode enabled', () => {
					return self.camera?.currentPictureInfo()?.HLCMode ?? false
				})

				createToggleFeedback('blcMode', 'BLC Mode', 'BLC mode enabled', () => {
					return self.camera?.currentPictureInfo()?.BLC ?? false
				})
			},
		},
		{
			capabilities: ['LensInfo', 'Lens'],
			createFeedbacks: () => {
				createToggleFeedback('smart', 'Smart Focus', 'Smart focus enabled', () => {
					return self.camera?.currentLensInfo()?.SmartFocus ?? false
				})

				createToggleFeedback('focusMode', 'Auto Focus Enabled', 'Focus mode', () => {
					return self.camera?.currentLensInfo()?.FocusMode === 'Auto' ? true : false
				})

				createToggleFeedback('digitalZoom', 'Digital Zoom', 'Digital zoom enabled', () => {
					return self.camera?.currentLensInfo()?.DigitalZoom ?? false
				})

				createToggleFeedback('zoomRatioOSD', 'Zoom Ratio OSD', 'Zoom ratio OSD enabled', () => {
					return self.camera?.currentLensInfo()?.ZoomRatioOSD ?? false
				})
			},
		},
		{
			capabilities: ['GammaInfo'],
			createFeedbacks: () => {
				createToggleFeedback('wdr', 'Gamma - WDR', 'Gamma - WDR enabled', () => {
					return self.camera?.currentGammaInfo()?.WDR ?? false
				})
			},
		},
		{
			capabilities: ['PanTiltInfo'],
			createFeedbacks: () => {
				createToggleFeedback('panDirectionInverted', 'Pan Direction Inverted', 'Pan direction inverted', () => {
					return self.camera?.currentPTInfo()?.PanDirection === 1
				})

				createToggleFeedback('tiltDirectionInverted', 'Tilt Direction Inverted', 'Tilt direction inverted', () => {
					return self.camera?.currentPTInfo()?.TiltDirection === 1
				})
			},
		},
		{
			capabilities: ['PositionLimitations'],
			createFeedbacks: () => {
				feedbacks['positionLimitEnabled'] = {
					name: 'Position Limit Enabled',
					description: 'Locked position',
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
					callback: (feedback: any) => {
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
