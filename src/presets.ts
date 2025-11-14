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
								override: false,
								speed: 5,
							},
						},
					],
					up: [
						{
							actionId: 'ptMove',
							options: {
								direction: 'Stop',
								override: false,
								speed: 5,
							},
						},
					],
				},
			],
			feedbacks: [],
		}
	}

	self.setPresetDefinitions(presets)
}
