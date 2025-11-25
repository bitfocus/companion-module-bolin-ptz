import { createHash, randomBytes } from 'crypto'
import type { ModuleConfig } from './config.js'
import type {
	// API & Request types
	ApiResponse,
	LoginRequest,
	LoginResponse,
	// Command types
	PresetRequest,
	ZoomCommand,
	FocusCommand,
	PTMoveCommand,
	PTZFPosition,
	PTZFPositionSet,
	PTZFRelPosition,
	MenuAction,
	// State types
	CameraState,
	SystemInfo,
	PresetInfo,
	PresetSpeed,
	LensInfo,
	PictureInfo,
	GammaInfo,
	WhiteBalanceInfo,
	ExposureInfo,
	PositionLimitations,
	VideoOutputInfo,
	GeneralCapabilities,
	PanTiltInfo,
	OverlayInfo,
	CameraCapabilities,
} from './types.js'
import type { ModuleInstance } from './main.js'
import { UpdateVariablesOnStateChange } from './variables.js'
import { buildIrisMapFromCapabilities, buildShutterSpeedMapFromCapabilities } from './utils.js'
import {
	AF_SENSITIVITY_MAP,
	DE_FLICKER_MAP,
	DEFOG_MODE_MAP,
	EFFECT_MAP,
	EXPOSURE_MODE_MAP,
	FOCUS_AREA_MAP,
	GAMMA_LEVEL_MAP,
	NEAR_LIMIT_MAP,
	SCENE_MAP,
	SHUTTER_SPEED_MAP,
	WHITE_BALANCE_MODE_MAP,
	safeEnumLookup,
} from './constants.js'

/**
 * Creates an empty camera state object with all properties set to null
 */
function createEmptyState(): CameraState {
	return {
		positionLimitations: null,
		ptzPosition: null,
		systemInfo: null,
		presets: null,
		presetSpeed: null,
		lensInfo: null,
		pictureInfo: null,
		gammaInfo: null,
		whiteBalanceInfo: null,
		exposureInfo: null,
		videoOutputInfo: null,
		generalCapabilities: null,
		panTiltInfo: null,
		overlayInfo: null,
	} satisfies CameraState
}

export class BolinCamera {
	private readonly config: ModuleConfig
	private readonly password: string
	private authToken: string | null = null
	private state: CameraState = createEmptyState()
	private cameraCapabilities: CameraCapabilities | null = null
	private previousState: CameraState | null = null
	private updateVariablesTimeout: NodeJS.Timeout | null = null
	private readonly self: ModuleInstance
	private shutterSpeedMap: Record<number, string> | null = null
	private irisMap: Record<number, string> | null = null
	private irisRange: { min: number; max: number } | null = null

	constructor(config: ModuleConfig, password: string, self: ModuleInstance) {
		this.config = config
		this.password = password
		this.self = self
	}

	/**
	 * Performs login to the Bolin camera and stores the authentication token
	 */
	async login(): Promise<string | null> {
		if (!this.config.host || !this.config.username || !this.config.port || !this.password) {
			throw new Error('Missing configuration details: host, username, or password')
		}

		try {
			const url = `http://${this.config.host}:${this.config.port}/apiv2/login`

			// Generate random 32-character salt
			const salt = randomBytes(16).toString('hex')

			// Generate sign: MD5(toUpperCase(sha256(password)+Salt))
			const sha256Hash = createHash('sha256').update(this.password).digest('hex')
			const signInput = (sha256Hash + salt).toUpperCase()
			const sign = createHash('md5').update(signInput).digest('hex')

			const requestBody: LoginRequest = {
				Cmd: 'ReqHttpLogin',
				Version: '2.00.000',
				Content: {
					LoginInfo: {
						Username: this.config.username,
						Salt: salt,
						Sign: sign,
					},
				},
			}

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			if (!response.ok) {
				throw new Error(`Login failed with status: ${response.status}`)
			}

			const data = (await response.json()) as LoginResponse

			if (data.Content.Status === 0 && data.Content.Token) {
				this.authToken = data.Content.Token.Value ?? null
				return this.authToken
			} else {
				this.authToken = null
				throw new Error(`Login failed with status: ${data.Content.Status}`)
			}
		} catch (error) {
			this.authToken = null
			const errorMessage = error instanceof Error ? error.message : 'Unknown error'
			throw new Error(`${errorMessage}`)
		}
	}

	/**
	 * Gets the current authentication token
	 */
	getAuthToken(): string | null {
		return this.authToken
	}

	/**
	 * Gets the authentication cookie string for API requests
	 */
	getAuthCookie(): string | null {
		if (!this.authToken || !this.config.username) {
			return null
		}
		return `Username=${this.config.username};Token=${this.authToken}`
	}

	/**
	 * Clears the authentication token and camera state
	 */
	clearAuth(): void {
		if (this.updateVariablesTimeout) {
			clearTimeout(this.updateVariablesTimeout)
			this.updateVariablesTimeout = null
		}
		this.authToken = null
		this.state = createEmptyState()
		this.cameraCapabilities = null
		this.previousState = null
	}

	/**
	 * Gets the current camera state (returns a shallow copy to prevent external mutations)
	 * Since state properties are objects/arrays, they remain references - this is intentional
	 * for performance. External code should not mutate these objects.
	 */
	getState(): Readonly<CameraState> {
		return { ...this.state }
	}

	/**
	 * Updates variables when state changes, only updating values that have actually changed
	 * Uses debouncing to batch multiple rapid updates into a single update (1 second delay)
	 */
	private updateVariablesOnStateChange(): void {
		// Clear any existing timeout to reset the debounce timer
		if (this.updateVariablesTimeout) {
			clearTimeout(this.updateVariablesTimeout)
		}

		// Schedule the update to run after 1 second
		// This batches multiple rapid calls within 1 second into a single update
		this.updateVariablesTimeout = setTimeout(() => {
			this.updateVariablesTimeout = null

			//lazy feedback check for now
			this.self.checkFeedbacks()

			const currentState = this.getState()
			this.previousState = UpdateVariablesOnStateChange(this.self, currentState, this.previousState)
		}, 500)
	}

	/**
	 * Makes an authenticated API request to the Bolin camera
	 */
	async sendRequest(
		endpoint: string,
		cmd: string,
		content?: Record<string, unknown>,
		version: string = '2.00.000',
	): Promise<ApiResponse> {
		const cookie = this.getAuthCookie()
		if (!cookie) {
			throw new Error('Not authenticated. Please login first.')
		}

		const requestBody = {
			Cmd: cmd,
			Version: version,
			...(content && { Content: content }),
		}

		const url = `http://${this.config.host}:${this.config.port}${endpoint}`
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: cookie,
			},
			body: JSON.stringify(requestBody),
		})
		if (!requestBody.Cmd.includes('Get')) {
			this.self.log('debug', `Sending request to ${url} with body: ${JSON.stringify(requestBody)}`)
		}
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}
		const data = (await response.json()) as ApiResponse
		if (typeof data?.Content?.Status === 'number' && data.Content.Status !== 0) {
			const errors = Array.isArray(data?.Content?.Errors) ? data.Content.Errors : []
			if (errors.length > 0 && errors[0]?.ErrorCode === 109) {
				this.self.log('debug', `API request "${cmd}" failed with status: ${JSON.stringify(data.Content)}`)
			} else {
				this.self.log('warn', `API request "${cmd}" failed with status: ${JSON.stringify(data.Content)}`)
			}
		}
		return data
	}

	/**
	 * Gets system information from the camera and stores it in state
	 */
	async getSystemInfo(): Promise<SystemInfo> {
		const response = await this.sendRequest('/apiv2/system', 'ReqGetSystemInfo')
		this.state.systemInfo = response.Content.SystemInfo as SystemInfo
		this.updateVariablesOnStateChange()
		return this.state.systemInfo
	}

	/**
	 * Gets the current presets from the camera and stores them in state
	 */
	async getCurrentPresets(): Promise<PresetInfo[]> {
		const response = await this.sendRequest('/apiv2/ptzctrl', 'ReqGetPTZFPreset')
		this.state.presets = response.Content.PresetInfo as PresetInfo[]
		this.updateVariablesOnStateChange()
		return this.state.presets
	}

	/**
	 * Gets the current presets from the camera and stores them in state
	 */
	async setPreset(preset: PresetRequest): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetPTZFPreset', {
			PresetInfo: preset,
		})
	}

	async getPresetSpeed(): Promise<PresetSpeed> {
		const response = await this.sendRequest('/apiv2/ptzctrl', 'ReqGetPTZFPresetSpeed')
		this.state.presetSpeed = response.Content.PTZFPresetSpeed as PresetSpeed
		this.updateVariablesOnStateChange()
		return this.state.presetSpeed
	}

	/**
	 * Sets the preset speed
	 */
	async setPresetSpeed(presetSpeed: PresetSpeed): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetPTZFPresetSpeed', {
			PTZFPresetSpeed: presetSpeed,
		})
		// Update state optimistically - no need for redundant GET call
		this.state.presetSpeed = presetSpeed
		this.updateVariablesOnStateChange()
	}

	/**
	 * Gets lens information from the camera and stores it in state
	 */
	async getLensInfo(): Promise<LensInfo> {
		const response = await this.sendRequest('/apiv2/image', 'ReqGetLensInfo')
		const rawLensInfo = response.Content.LensInfo as {
			FocusMode: number
			FocusArea: number
			NearLimit: number
			AFSensitivity: number
			SmartFocus: boolean
			DigitalZoom: boolean
			ZoomRatioOSD: boolean
			MFSpeed: number
		}

		this.state.lensInfo = {
			...rawLensInfo,
			FocusMode: rawLensInfo.FocusMode === 0 ? 'Auto' : 'Manual',
			FocusArea: safeEnumLookup(FOCUS_AREA_MAP, rawLensInfo.FocusArea, 'Default'),
			NearLimit: safeEnumLookup(NEAR_LIMIT_MAP, rawLensInfo.NearLimit, '1cm'),
			AFSensitivity: safeEnumLookup(AF_SENSITIVITY_MAP, rawLensInfo.AFSensitivity, 'Low'),
		}
		this.updateVariablesOnStateChange()
		return this.state.lensInfo
	}

	async setLensInfo(lensInfo: Partial<LensInfo>): Promise<void> {
		await this.sendRequest('/apiv2/image', 'ReqSetLensInfo', {
			LensInfo: lensInfo,
		})
		// Update state optimistically - merge with existing state
		if (this.state.lensInfo) {
			this.state.lensInfo = { ...this.state.lensInfo, ...lensInfo }
		}
		this.updateVariablesOnStateChange()
	}

	/**
	 * Gets picture information from the camera and stores it in state
	 */
	async getPictureInfo(): Promise<PictureInfo> {
		const response = await this.sendRequest('/apiv2/image', 'ReqGetPictureInfo')
		const rawPictureInfo = response.Content.PictureInfo as {
			'2DNR': number
			'3DNR': number
			Sharpness: number
			Hue: number
			DeFlicker: number
			Flip: boolean
			Mirror: boolean
			HLCMode: boolean
			BLC: boolean
			Contrast: number
			Saturation: number
			Scene: number
			DefogMode: number
			DefogLevel: number
			Effect: number
			MagentaSaturation: number
			RedSaturation: number
			YellowSaturation: number
			GreenSaturation: number
			CyanSaturation: number
			BlueSaturation: number
			MagentaHue: number
			RedHue: number
			YellowHue: number
			GreenHue: number
			CyanHue: number
			BlueHue: number
			MagentaValue: number
			RedValue: number
			YellowValue: number
			GreenValue: number
			CyanValue: number
			BlueValue: number
		}

		this.state.pictureInfo = {
			...rawPictureInfo,
			DeFlicker: safeEnumLookup(DE_FLICKER_MAP, rawPictureInfo.DeFlicker, 'OFF'),
			Scene: safeEnumLookup(SCENE_MAP, rawPictureInfo.Scene, 'Standard'),
			DefogMode: safeEnumLookup(DEFOG_MODE_MAP, rawPictureInfo.DefogMode, 'OFF'),
			Effect: safeEnumLookup(EFFECT_MAP, rawPictureInfo.Effect, 'Day'),
		}
		this.updateVariablesOnStateChange()
		return this.state.pictureInfo
	}

	/**
	 * Gets gamma information from the camera and stores it in state
	 */
	async getGammaInfo(): Promise<GammaInfo> {
		const response = await this.sendRequest('/apiv2/image', 'ReqGetGammaInfo')
		const rawGammaInfo = response.Content.GammaInfo as {
			Level: number
			Bright: number
			WDR: boolean
			WDRLevel: number
		}

		this.state.gammaInfo = {
			...rawGammaInfo,
			Level: safeEnumLookup(GAMMA_LEVEL_MAP, rawGammaInfo?.Level ?? 0, 'Default'),
		}
		this.updateVariablesOnStateChange()
		return this.state.gammaInfo
	}

	async setGammaInfo(gammaInfo: Partial<GammaInfo>): Promise<void> {
		await this.sendRequest('/apiv2/image', 'ReqSetGammaInfo', {
			GammaInfo: gammaInfo,
		})
		// Update state optimistically - merge with existing state
		if (this.state.gammaInfo) {
			this.state.gammaInfo = { ...this.state.gammaInfo, ...gammaInfo }
		}
		this.updateVariablesOnStateChange()
	}

	/**
	 * Gets white balance information from the camera and stores it in state
	 */
	async getWhiteBalanceInfo(): Promise<WhiteBalanceInfo> {
		const response = await this.sendRequest('/apiv2/image', 'ReqGetWhiteBalanceInfo')
		const rawWhiteBalanceInfo = response.Content.WhiteBalanceInfo as {
			Mode: number
			WBSensitivity: number
			RGain: number
			BGain: number
			RTuning: number
			GTuning: number
			BTuning: number
			ColorTemperature: number
		}

		this.state.whiteBalanceInfo = {
			...rawWhiteBalanceInfo,
			Mode: safeEnumLookup(WHITE_BALANCE_MODE_MAP, rawWhiteBalanceInfo.Mode, 'Auto'),
		}
		this.updateVariablesOnStateChange()
		return this.state.whiteBalanceInfo
	}

	async setWhiteBalanceInfo(whiteBalanceInfo: Partial<WhiteBalanceInfo>): Promise<void> {
		await this.sendRequest('/apiv2/image', 'ReqSetWhiteBalanceInfo', {
			WhiteBalanceInfo: whiteBalanceInfo,
		})
		// Update state optimistically - merge with existing state
		if (this.state.whiteBalanceInfo) {
			this.state.whiteBalanceInfo = { ...this.state.whiteBalanceInfo, ...whiteBalanceInfo }
		}
		this.updateVariablesOnStateChange()
		this.self.checkFeedbacks('whiteBalanceMode')
	}

	async setPictureInfo(pictureInfo: Partial<PictureInfo>): Promise<void> {
		await this.sendRequest('/apiv2/image', 'ReqSetPictureInfo', {
			PictureInfo: pictureInfo,
		})
		// Update state optimistically - merge with existing state
		if (this.state.pictureInfo) {
			this.state.pictureInfo = { ...this.state.pictureInfo, ...pictureInfo }
		}
		this.updateVariablesOnStateChange()
	}

	/**
	 * Gets exposure information from the camera and stores it in state
	 */
	async getExposureInfo(): Promise<ExposureInfo> {
		const response = await this.sendRequest('/apiv2/image', 'ReqGetExposureInfo')
		const rawExposureInfo = response.Content.ExposureInfo as {
			Mode: number
			Gain: number
			GainLimit: number
			ExCompLevel: number
			SmartExposure: boolean
			ShutterSpeed: number
			Iris: number
		}

		const shutterSpeedMap = this.getShutterSpeedMap()
		const shutterSpeedValue = shutterSpeedMap[rawExposureInfo.ShutterSpeed] ?? '1/60'
		this.state.exposureInfo = {
			...rawExposureInfo,
			Mode: safeEnumLookup(EXPOSURE_MODE_MAP, rawExposureInfo.Mode, 'Auto'),
			ShutterSpeed: shutterSpeedValue,
		}
		this.updateVariablesOnStateChange()
		return this.state.exposureInfo
	}

	async setExposureInfo(exposureInfo: Partial<ExposureInfo>): Promise<void> {
		// Prepare the request payload - API expects numeric ShutterSpeed
		const requestPayload: Record<string, unknown> = { ...exposureInfo }

		// If ShutterSpeed is provided as a string, convert it to the numeric enum value
		if (exposureInfo.ShutterSpeed !== undefined && typeof exposureInfo.ShutterSpeed === 'string') {
			const shutterSpeedMap = this.getShutterSpeedMap()
			// Find the numeric key for this string value
			const numericValue = Object.entries(shutterSpeedMap).find(([, value]) => value === exposureInfo.ShutterSpeed)?.[0]
			if (numericValue !== undefined) {
				requestPayload.ShutterSpeed = Number.parseInt(numericValue, 10)
			}
		}

		await this.sendRequest('/apiv2/image', 'ReqSetExposureInfo', {
			ExposureInfo: requestPayload,
		})
		// Update state optimistically - merge with existing state
		if (this.state.exposureInfo) {
			this.state.exposureInfo = { ...this.state.exposureInfo, ...exposureInfo }
		}
		this.updateVariablesOnStateChange()
	}

	/**
	 * Sends a "Go Home" command to the camera.
	 */
	async goHome(): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqGoHome', {
			GoHomeInfo: {
				Action: 'GoHome',
			},
		})
	}

	/**
	 * Sends a zoom command to the camera.
	 * @param zoom The zoom command with direction and speed
	 */
	async zoom(zoom: ZoomCommand): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetPTZFZoom', {
			PTZFZoomInfo: {
				Speed: zoom.Speed,
				Direction: zoom.Direction,
			},
		})
	}

	/**
	 * Sends a focus command to the camera.
	 * @param focus The focus command with direction and speed
	 */
	async focus(focus: FocusCommand): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetPTZFFocus', {
			PTZFFocusInfo: focus,
		})
	}

	/**
	 * Sends a PT (Pan/Tilt) movement command to the camera.
	 * @param move The PT movement command with mode, speed, and direction
	 */
	async ptMove(move: PTMoveCommand): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetPTZFMove', {
			PTZFMoveInfo: move,
		})
	}

	/**
	 * Sends a manual restart command to the camera.
	 */
	async restart(): Promise<void> {
		await this.sendRequest('/apiv2/system', 'ReqSetManualRestart')
	}

	/**
	 * Gets the current PTZ position from the camera.
	 */
	async getPTZPosition(): Promise<PTZFPosition> {
		const response = await this.sendRequest('/apiv2/ptzctrl', 'ReqGetPTZFPosition')
		const position = response.Content.PTZFPosition as PTZFPosition
		this.state.ptzPosition = position
		this.updateVariablesOnStateChange()
		return position
	}

	/**
	 * Sets the PTZ position on the camera.
	 * @param position The PTZ position parameters (all fields optional)
	 */
	async setPTZPosition(position: PTZFPositionSet): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetPTZFPosition', {
			PTZFPosition: position,
		})
		// Update state if we have current position and new values
		if (this.state.ptzPosition) {
			this.state.ptzPosition = {
				PanPosition: position.PanPosition ?? this.state.ptzPosition.PanPosition,
				TiltPosition: position.TiltPosition ?? this.state.ptzPosition.TiltPosition,
				ZoomPosition: position.ZoomPosition ?? this.state.ptzPosition.ZoomPosition,
			}
			this.updateVariablesOnStateChange()
		}
	}

	/**
	 * Sets the PTZ position relative to the current position.
	 * @param position The relative PTZ position parameters (all fields optional)
	 */
	async setPTZRelPosition(position: Partial<PTZFRelPosition>): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetPTZFRelPosition', {
			PTZFRelPosition: position,
		})
		// Update state if we have current position and relative values
		if (this.state.ptzPosition && (position.PanPosition !== undefined || position.TiltPosition !== undefined)) {
			this.state.ptzPosition = {
				PanPosition: (this.state.ptzPosition.PanPosition ?? 0) + (position.PanPosition ?? 0),
				TiltPosition: (this.state.ptzPosition.TiltPosition ?? 0) + (position.TiltPosition ?? 0),
				ZoomPosition: this.state.ptzPosition.ZoomPosition,
			}
			this.updateVariablesOnStateChange()
		}
	}

	/**
	 * Gets the position limitations from the camera.
	 */
	async getPositionLimits(): Promise<PositionLimitations> {
		const response = await this.sendRequest('/apiv2/ptzctrl', 'ReqGetPositionLimitations')
		const positionLimitations = response.Content.PositionLimitations as PositionLimitations
		this.state.positionLimitations = positionLimitations
		this.updateVariablesOnStateChange()
		this.self.checkFeedbacks('positionLimitEnabled')
		return positionLimitations
	}

	/**
	 * Sets the position limitations on the camera.
	 * @param limitations The position limitations parameters (all fields optional)
	 */
	async setPositionLimits(limitations: Partial<PositionLimitations>): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetPositionLimitations', {
			PositionLimitations: limitations,
		})
		// Update state optimistically - merge with existing state
		if (this.state.positionLimitations) {
			this.state.positionLimitations = { ...this.state.positionLimitations, ...limitations }
		}
		this.updateVariablesOnStateChange()
		this.self.checkFeedbacks('positionLimitEnabled')
	}

	/**
	 * Controls the OSD menu on the camera.
	 * @param action The menu action to perform (ON, OFF, Up, Down, Left, Right, OK, Menutoggle)
	 */
	async setOSDMenu(action: MenuAction = 'Menutoggle'): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetMenu', {
			MenuInfo: {
				Action: action,
			},
		})
	}

	/**
	 * Gets pan/tilt information from the camera and stores it in state
	 */
	async getPTInfo(): Promise<PanTiltInfo> {
		const response = await this.sendRequest('/apiv2/image', 'ReqGetPanTiltInfo', undefined, '2.00.000')
		this.state.panTiltInfo = response.Content.PanTiltInfo as PanTiltInfo
		this.updateVariablesOnStateChange()
		return this.state.panTiltInfo
	}

	/**
	 * Sets pan/tilt information on the camera
	 * @param panTiltInfo The pan/tilt information parameters (all fields optional)
	 */
	async setPTInfo(panTiltInfo: Partial<PanTiltInfo>): Promise<void> {
		await this.sendRequest('/apiv2/image', 'ReqSetPanTiltInfo', {
			PanTiltInfo: panTiltInfo,
		})
		// Update state optimistically - merge with existing state
		if (this.state.panTiltInfo) {
			this.state.panTiltInfo = { ...this.state.panTiltInfo, ...panTiltInfo }
		}
		this.updateVariablesOnStateChange()
	}

	/**
	 * Gets video output information from the camera and stores it in state
	 */
	async getVideoOutput(): Promise<VideoOutputInfo> {
		const response = await this.sendRequest('/apiv2/general', 'ReqGetVideoOutputInfo')
		this.state.videoOutputInfo = response.Content.VideoOutputInfo as VideoOutputInfo
		this.updateVariablesOnStateChange()
		return this.state.videoOutputInfo
	}

	async setVideoOutput(output: Partial<VideoOutputInfo>): Promise<void> {
		await this.sendRequest('/apiv2/general', 'ReqSetVideoOutputInfo', {
			VideoOutputInfo: output,
		})
		// Update state optimistically - merge with existing state
		if (this.state.videoOutputInfo) {
			this.state.videoOutputInfo = { ...this.state.videoOutputInfo, ...output }
		}
		this.updateVariablesOnStateChange()
	}
	/**
	 * Builds the shutter speed map from capabilities data
	 * @param imageCapabilitiesContent Optional image capabilities content to extract from
	 */
	private buildShutterSpeedMap(imageCapabilitiesContent?: Record<string, unknown>): void {
		// Check image capabilities first (passed as parameter or from state)
		if (imageCapabilitiesContent) {
			const map = buildShutterSpeedMapFromCapabilities(imageCapabilitiesContent)
			if (map) {
				this.shutterSpeedMap = map
				return
			}
		}

		// If not found, fall back to the static map
		this.shutterSpeedMap = null
	}

	/**
	 * Builds the iris map from capabilities data
	 * Handles both enum and range types
	 * Filters enum values to only common f-stops
	 * @param imageCapabilitiesContent Optional image capabilities content to extract from
	 */
	private buildIrisMap(imageCapabilitiesContent?: Record<string, unknown>): void {
		// Reset both map and range
		this.irisMap = null
		this.irisRange = null

		// Check image capabilities first (passed as parameter or from state)
		if (imageCapabilitiesContent) {
			const result = buildIrisMapFromCapabilities(imageCapabilitiesContent)
			this.irisMap = result.irisMap
			this.irisRange = result.irisRange
		}
	}

	/**
	 * Gets the shutter speed map, building it from capabilities if available
	 * Falls back to the static map if capabilities haven't been loaded
	 */
	private getShutterSpeedMap(): Record<number, string> {
		if (this.shutterSpeedMap) {
			return this.shutterSpeedMap
		}
		// Fall back to static map if capabilities not loaded
		return SHUTTER_SPEED_MAP
	}

	/**
	 * Gets the shutter speed map for use in actions/UI
	 * Public method to access the dynamic shutter speed map
	 */
	getShutterSpeedMapForActions(): Record<number, string> {
		return this.getShutterSpeedMap()
	}

	/**
	 * Gets the iris map, building it from capabilities if available
	 */
	private getIrisMap(): Record<number, string> {
		if (this.irisMap) {
			return this.irisMap
		}
		// Return empty map if capabilities not loaded
		return {}
	}

	/**
	 * Gets the iris map for use in actions/UI
	 * Public method to access the dynamic iris map
	 */
	getIrisMapForActions(): Record<number, string> {
		return this.getIrisMap()
	}

	/**
	 * Gets the iris range for use in actions/UI (if Iris is a range type)
	 * Public method to access the iris range
	 */
	getIrisRangeForActions(): { min: number; max: number } | null {
		return this.irisRange
	}

	/**
	 * Gets general capabilities from the camera and stores it in state
	 */
	async getGeneralCapabilities(): Promise<GeneralCapabilities> {
		const response = await this.sendRequest('/apiv2/general', 'ReqGetGeneralCapabilities')
		const generalCapabilities = response.Content as GeneralCapabilities

		this.state.generalCapabilities = generalCapabilities

		this.updateVariablesOnStateChange()
		return this.state.generalCapabilities
	}

	/**
	 * Gets overlay information from the camera and stores it in state
	 */
	async getOverlayInfo(): Promise<OverlayInfo[]> {
		const response = await this.sendRequest('/apiv2/general', 'ReqGetOverlayInfo')
		this.state.overlayInfo = response.Content.OverlayInfo as OverlayInfo[]
		this.updateVariablesOnStateChange()
		return this.state.overlayInfo
	}

	/**
	 * Sets overlay information on the camera
	 * @param overlayInfo The overlay information array
	 */
	async setOverlayInfo(overlayInfo: Partial<OverlayInfo>): Promise<void> {
		await this.sendRequest('/apiv2/general', 'ReqSetOverlayInfo', {
			OverlayInfo: [overlayInfo],
		})
		// Note: Overlay updates are complex (array-based), so we refresh state
		// This could be optimized further if we track which overlay index was updated
		await this.getOverlayInfo()
	}

	/**
	 * Extracts object names from a Content object, including nested objects
	 * @param content The content object to extract names from
	 * @param prefix Optional prefix for nested object names (e.g., "VideoOutputInfo")
	 * @returns Array of object names, with nested objects prefixed (e.g., "VideoOutputInfo.SystemFormat")
	 */
	private extractObjectNames(content: Record<string, unknown>, prefix?: string): string[] {
		const names: string[] = []
		for (const key in content) {
			// Skip Status and Errors as they're not capability objects
			if (key !== 'Status' && key !== 'Errors' && typeof content[key] === 'object' && content[key] !== null) {
				const fullName = prefix ? `${prefix}.${key}` : key
				names.push(fullName)

				// Recursively extract nested object names
				const nestedContent = content[key] as Record<string, unknown>
				if (nestedContent && !Array.isArray(nestedContent)) {
					const nestedNames = this.extractObjectNames(nestedContent, fullName)
					names.push(...nestedNames)
				}
			}
		}
		return names
	}

	/**
	 * Helper to get error message from error object
	 */
	private getErrorMessage(error: unknown): string {
		return error instanceof Error ? error.message : 'Unknown error'
	}

	/**
	 * Helper to fetch and extract capabilities with error handling
	 */
	private async fetchCapabilities(endpoint: string, cmd: string, capabilityName: string): Promise<string[] | null> {
		try {
			const response = await this.sendRequest(endpoint, cmd)
			return this.extractObjectNames(response.Content)
		} catch (error) {
			this.self.log('debug', `Failed to get ${capabilityName}: ${this.getErrorMessage(error)}`)
			return null
		}
	}

	/**
	 * Gets camera capabilities from all capability endpoints and stores object names
	 */
	async getCameraCapabilities(): Promise<CameraCapabilities> {
		const capabilities: CameraCapabilities = {}

		// Fetch all capabilities in parallel for better performance
		const [
			systemCapabilities,
			ptzfCapabilities,
			imageResponse,
			avStreamCapabilities,
			networkCapabilities,
			generalCapabilities,
		] = await Promise.allSettled([
			this.fetchCapabilities('/apiv2/system', 'ReqGetSystemCapabilities', 'system capabilities'),
			this.fetchCapabilities('/apiv2/ptzctrl', 'ReqGetPTZFCapabilities', 'PTZF capabilities'),
			this.sendRequest('/apiv2/image', 'ReqGetImageCapabilities').catch((error) => {
				this.self.log('debug', `Failed to get image capabilities: ${this.getErrorMessage(error)}`)
				return null
			}),
			this.fetchCapabilities('/apiv2/avstream', 'ReqGetAVStreamCapabilities', 'AV stream capabilities'),
			this.fetchCapabilities('/apiv2/network', 'ReqGetNetworkCapabilities', 'network capabilities'),
			this.fetchCapabilities('/apiv2/general', 'ReqGetGeneralCapabilities', 'general capabilities'),
		])

		if (systemCapabilities.status === 'fulfilled' && systemCapabilities.value) {
			capabilities.systemCapabilities = systemCapabilities.value
		}
		if (ptzfCapabilities.status === 'fulfilled' && ptzfCapabilities.value) {
			capabilities.ptzfCapabilities = ptzfCapabilities.value
		}
		if (imageResponse.status === 'fulfilled' && imageResponse.value) {
			capabilities.imageCapabilities = this.extractObjectNames(imageResponse.value.Content)
			const imageContent = imageResponse.value.Content as Record<string, unknown>
			// Build shutter speed and iris maps - extractEnumMap will search all levels recursively
			this.buildShutterSpeedMap(imageContent)
			this.buildIrisMap(imageContent)
		}
		if (avStreamCapabilities.status === 'fulfilled' && avStreamCapabilities.value) {
			capabilities.avStreamCapabilities = avStreamCapabilities.value
		}
		if (networkCapabilities.status === 'fulfilled' && networkCapabilities.value) {
			capabilities.networkCapabilities = networkCapabilities.value
		}
		if (generalCapabilities.status === 'fulfilled' && generalCapabilities.value) {
			capabilities.generalCapabilities = generalCapabilities.value
		}

		this.cameraCapabilities = capabilities
		// Trigger action update after maps are built so actions can use the dynamic maps
		this.self.updateActions()
		return capabilities
	}

	/**
	 * Gets the stored camera capabilities (does not fetch from camera)
	 */
	getStoredCameraCapabilities(): CameraCapabilities | null {
		return this.cameraCapabilities
	}

	/**
	 * Checks if a specific capability is present in any of the capability categories
	 * @param capabilityName The name of the capability to check for
	 * @returns true if the capability is found in any category, false otherwise
	 */
	hasCapability(capabilityName: string): boolean {
		if (!this.cameraCapabilities) {
			return false
		}

		const categories = [
			this.cameraCapabilities.systemCapabilities,
			this.cameraCapabilities.ptzfCapabilities,
			this.cameraCapabilities.imageCapabilities,
			this.cameraCapabilities.avStreamCapabilities,
			this.cameraCapabilities.networkCapabilities,
			this.cameraCapabilities.generalCapabilities,
		]

		return categories.some((category) => category?.includes(capabilityName) ?? false)
	}

	/**
	 * Fetches all available camera info based on capabilities
	 * Only fetches info for capabilities that are supported by the camera
	 */
	async fetchAllCameraInfo(): Promise<void> {
		const capabilitiesLoaded = this.cameraCapabilities !== null

		// Mapping of capability names to their corresponding method calls
		type CapabilityMapping = {
			capabilities: readonly string[]
			method: () => Promise<unknown>
		}
		const capabilityMappings: readonly CapabilityMapping[] = [
			{ capabilities: ['PresetInfo'], method: async () => this.getCurrentPresets() },
			{ capabilities: ['PTZFPosition'], method: async () => this.getPTZPosition() },
			{ capabilities: ['LensInfo', 'Lens'], method: async () => this.getLensInfo() },
			{ capabilities: ['PictureInfo', 'Picture'], method: async () => this.getPictureInfo() },
			{ capabilities: ['GammaInfo'], method: async () => this.getGammaInfo() },
			{ capabilities: ['WhiteBalanceInfo', 'WhiteBalance'], method: async () => this.getWhiteBalanceInfo() },
			{ capabilities: ['ExposureInfo', 'Exposure'], method: async () => this.getExposureInfo() },
			{ capabilities: ['PositionLimitations'], method: async () => this.getPositionLimits() },
			{ capabilities: ['VideoOutputInfo'], method: async () => this.getVideoOutput() },
			{ capabilities: ['VideoOutputInfo'], method: async () => this.getGeneralCapabilities() },
			{
				capabilities: ['PTZFPresetSpeed', 'PresetSpeed'],
				method: async () => this.getPresetSpeed(),
			},
			{ capabilities: ['PanTiltInfo', 'PTZFMoveInfo'], method: async () => this.getPTInfo() },
			{ capabilities: ['OverlayInfo'], method: async () => this.getOverlayInfo() },
		]

		const promises = capabilityMappings
			.filter((mapping) => {
				// If capabilities aren't loaded, try all calls
				if (!capabilitiesLoaded) return true
				// Otherwise, check if any of the required capabilities exist
				return mapping.capabilities.some((cap) => this.hasCapability(cap))
			})
			.map(async (mapping) => mapping.method())

		await Promise.all(promises)
	}
}
