import type { ModuleInstance } from './main.js'
import type { PositionLimitations } from './types.js'
import { CompanionFeedbackDefinitions } from '@companion-module/base'

export function UpdateFeedbacks(self: ModuleInstance): void {
	const feedbacks: CompanionFeedbackDefinitions = {}

	feedbacks['positionLimitEnabled'] = {
		name: 'Position Limit Enabled',
		description: 'Locked position',
		callback: (feedback: any) => {
			const direction = feedback.options.direction as keyof PositionLimitations
			return self.camera?.getState().positionLimitations?.[direction] ?? false
		},
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
	}
	self.setFeedbackDefinitions(feedbacks)
}
