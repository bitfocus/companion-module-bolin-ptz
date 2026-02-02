/**
 * Enum conversion maps and type-safe lookup helpers
 * These maps convert numeric enum values from the camera API to typed string literals
 */

// Enum conversion maps - using 'as const satisfies' for better type safety and inference
export const FOCUS_AREA_MAP = {
	0: 'Default',
	1: 'All',
	2: 'Top',
	3: 'Center',
	4: 'Bottom',
} as const satisfies Record<number, 'Default' | 'All' | 'Top' | 'Center' | 'Bottom'>

export const NEAR_LIMIT_MAP = {
	0: '1cm',
	1: '30cm',
	4: '1.0m',
} as const satisfies Record<number, '1cm' | '30cm' | '1.0m'>

export const AF_SENSITIVITY_MAP = {
	0: 'Low',
	1: 'Middle',
	2: 'High',
} as const satisfies Record<number, 'Low' | 'Middle' | 'High'>

export const DE_FLICKER_MAP = {
	0: 'OFF',
	1: '50HZ',
	2: '60HZ',
} as const satisfies Record<number, 'OFF' | '50HZ' | '60HZ'>

export const SCENE_MAP = {
	1: 'Standard',
	3: 'Bright',
	4: 'Clarity',
	5: 'Soft',
} as const satisfies Record<number, 'Standard' | 'Bright' | 'Clarity' | 'Soft'>

export const DEFOG_MODE_MAP = {
	0: 'OFF',
	1: 'Auto',
	2: 'Manual',
} as const satisfies Record<number, 'OFF' | 'Auto' | 'Manual'>

export const EFFECT_MAP = {
	0: 'Day',
	1: 'Night',
} as const satisfies Record<number, 'Day' | 'Night'>

export const GAMMA_LEVEL_MAP = {
	0: 'Default',
	1: '0.45',
	2: '0.50',
	3: '0.55',
	4: '0.63',
} as const satisfies Record<number, 'Default' | '0.45' | '0.50' | '0.55' | '0.63'>

export const WHITE_BALANCE_MODE_MAP = {
	0: 'Auto',
	1: 'Indoor',
	2: 'Outdoor',
	3: 'OPW',
	4: 'ATW',
	5: 'User',
	8: 'SVL',
	10: 'ManualColorTemperature',
} as const satisfies Record<
	number,
	'Auto' | 'Indoor' | 'Outdoor' | 'OPW' | 'ATW' | 'User' | 'SVL' | 'ManualColorTemperature'
>

export const EXPOSURE_MODE_MAP = {
	0: 'Auto',
	1: 'Manual',
	2: 'ShutterPri',
	3: 'IrisPri',
} as const satisfies Record<number, 'Auto' | 'Manual' | 'ShutterPri' | 'IrisPri'>

export const SHUTTER_SPEED_MAP = {
	9: '1/60',
	10: '1/90',
	11: '1/100',
	12: '1/125',
	13: '1/180',
	14: '1/195',
	15: '1/215',
	16: '1/230',
	17: '1/250',
	18: '1/350',
	19: '1/500',
	20: '1/725',
	21: '1/1000',
	22: '1/1500',
	23: '1/2000',
	24: '1/3000',
	25: '1/4000',
	26: '1/6000',
	27: '1/10000',
	28: '1/30000',
	29: '1/100000',
} as const satisfies Record<
	number,
	| '1/60'
	| '1/90'
	| '1/100'
	| '1/125'
	| '1/180'
	| '1/195'
	| '1/215'
	| '1/230'
	| '1/250'
	| '1/350'
	| '1/500'
	| '1/725'
	| '1/1000'
	| '1/1500'
	| '1/2000'
	| '1/3000'
	| '1/4000'
	| '1/6000'
	| '1/10000'
	| '1/30000'
	| '1/100000'
>

// Type-safe enum lookup helpers
type EnumMapValue<T> = T extends Record<number, infer V> ? V : never

export function safeEnumLookup<T extends Record<number, string>>(
	map: T,
	value: number,
	defaultValue: EnumMapValue<T>,
): EnumMapValue<T> {
	return (map[value as keyof T] ?? defaultValue) as EnumMapValue<T>
}
