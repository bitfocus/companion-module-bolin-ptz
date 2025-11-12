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

/**
 * Zoom direction for PTZ camera control
 */
export type ZoomDirection = 'Wide' | 'Tele' | 'Stop'

/**
 * Zoom command parameters
 */
export interface ZoomCommand {
	Direction: ZoomDirection
	Speed: number
}

/**
 * Focus direction for PTZ camera control
 */
export type FocusDirection = 'Near' | 'Far' | 'Stop' | 'Manual' | 'Auto'

/**
 * Focus command parameters
 */
export interface FocusCommand {
	Direction: FocusDirection
	Speed?: number
}

/**
 * PT movement mode for camera control
 */
export type PTMoveMode = 1 | 2 // 1 = Standard, 2 = Superfine

/**
 * PT movement direction for camera control
 */
export type PTDirection = 'Up' | 'Down' | 'Left' | 'Right' | 'LeftUp' | 'RightUp' | 'LeftDown' | 'RightDown' | 'Stop'

/**
 * PT movement command parameters
 */
export interface PTMoveCommand {
	Mode: PTMoveMode
	SuperfineSpeed: number
	Direction: PTDirection
}

/**
 * PTZ position information
 */
export interface PTZFPosition {
	PanPosition: number
	TiltPosition: number
	ZoomPosition: number
}

/**
 * PTZ position set command parameters (all fields optional)
 */
export interface PTZFPositionSet {
	PanPosition?: number
	TiltPosition?: number
	ZoomPosition?: number
	PanTiltSpeed?: number
	ZoomSpeed?: number
}

/**
 * PTZ relative position command parameters (all fields optional)
 */
export interface PTZFRelPosition {
	PanPosition?: number
	TiltPosition?: number
	PanTiltSpeed?: number
}
