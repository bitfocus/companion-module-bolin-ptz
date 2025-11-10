import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	port: number
	username: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Camera IP / Hostname',
			width: 8,
			regex: Regex.HOSTNAME,
		},
		{
			type: 'number',
			id: 'port',
			label: 'HTTP Port',
			width: 4,
			min: 1,
			max: 65535,
			default: 80,
		},
		{
			type: 'textinput',
			id: 'username',
			label: 'Username',
			width: 6,
		},
		{
			type: 'secret-text',
			id: 'password',
			label: 'Password',
			width: 6,
		},
	]
}
