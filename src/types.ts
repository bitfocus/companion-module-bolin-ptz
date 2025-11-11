/**
 * Types for Bolin PTZ Camera API
 */

/**
 * Authentication token response from login
 */
export interface AuthToken {
	Value?: string
}

/**
 * Login request body structure
 */
export interface LoginRequest {
	Cmd: 'ReqHttpLogin'
	Version: string
	Content: {
		LoginInfo: {
			UserName: string
			Salt: string
			Sign: string
		}
	}
}

/**
 * Login response from the camera API
 */
export interface LoginResponse {
	Cmd: string
	Version?: string
	Content: {
		Token?: AuthToken
		Status: number
	}
}

/**
 * Generic API response structure
 */
export interface ApiResponse {
	Cmd: string
	Version: string
	Content: {
		Status: number
		[key: string]: unknown
	}
}

/**
 * System information details
 */
export interface SystemInfo {
	AFVersion?: string
	DeviceName?: string
	ModelName?: string
	SerialNumber?: string
	FirmwareVersion?: string
	IPVersion?: string
	MCUVersion?: string
	[key: string]: unknown
}

/**
 * Preset information
 */
export interface PresetInfo {
	Name: string
	Number: number
	FixedName: string
}

export interface PresetRequest {
	Action: string
	Name: string
	Number: number
}
