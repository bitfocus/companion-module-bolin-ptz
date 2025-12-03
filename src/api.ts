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
	// PTZ mode types
	TraceInfo,
	TraceRequest,
	ScanningInfo,
	ScanningRequest,
	CruiseInfo,
	CruiseRequest,
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
	NetworkInfo,
	OSDSystemInfo,
	CameraCapabilities,
	RTSPInfo,
	RTMPInfo,
	AVOverUDPInfo,
	AVOverRTPInfo,
	NDIInfo,
	SRTInfo,
	EncodeInfo,
	AudioInfo,
	AutoRestartInfo,
	AutoRestartRequest,
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
		networkInfo: null,
		osdSystemInfo: null,
		rtspInfo: null,
		rtmpInfo: null,
		avOverUDPInfo: null,
		avOverRTPInfo: null,
		ndiInfo: null,
		srtInfo: null,
		encodeInfo: null,
		audioInfo: null,
		traceInfo: null,
		scanningInfo: null,
		cruiseInfo: null,
		autoRestartInfo: null,
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
	private capabilitySet: Set<string> | null = null

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
				Version: '2.0.000',
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
			throw new Error(errorMessage)
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
		this.capabilitySet = null
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
	 * Maps state keys to their corresponding feedback IDs
	 */
	private getFeedbackIdsForStateKey(stateKey: keyof CameraState): string[] {
		const feedbackMap: Partial<Record<keyof CameraState, string[]>> = {
			exposureInfo: ['gain', 'smartExposure', 'shutterSpeed', 'iris'],
			whiteBalanceInfo: ['whiteBalanceMode', 'whiteBalanceSensitivity', 'colorTemperature'],
			pictureInfo: ['flip', 'mirror', 'hlcMode', 'blcMode', 'scene', 'defogMode', 'effect', 'colorMatrix'],
			lensInfo: ['smart', 'focusMode', 'digitalZoom', 'zoomRatioOSD', 'afSensitivity', 'mfSpeed'],
			gammaInfo: ['wdr', 'gammaLevel', 'gammaBright', 'wdrLevel'],
			panTiltInfo: ['panDirectionInverted', 'tiltDirectionInverted'],
			positionLimitations: ['positionLimitEnabled'],
			overlayInfo: ['overlayEnabled'],
			rtspInfo: ['rtspEnabled'],
			rtmpInfo: ['rtmpEnabled'],
			avOverUDPInfo: ['avOverUDPEnabled'],
			avOverRTPInfo: ['avOverRTPEnabled'],
			ndiInfo: ['ndiEnabled'],
			audioInfo: ['audioEnabled', 'audioVolume'],
			autoRestartInfo: ['autoRestartEnabled'],
		}
		return feedbackMap[stateKey] ?? []
	}

	/**
	 * Determines which state keys have changed between previous and current state
	 */
	private getChangedStateKeys(currentState: CameraState, previousState: CameraState | null): Array<keyof CameraState> {
		if (!previousState) {
			// If no previous state, all non-null keys are considered "changed"
			return Object.keys(currentState).filter((key) => currentState[key as keyof CameraState] !== null) as Array<
				keyof CameraState
			>
		}

		const changedKeys: Array<keyof CameraState> = []
		for (const key in currentState) {
			const stateKey = key as keyof CameraState
			const current = currentState[stateKey]
			const previous = previousState[stateKey]

			// Check if the value has changed
			if (current !== previous) {
				// For objects/arrays, do a deeper comparison
				if (current !== null && previous !== null && typeof current === 'object' && typeof previous === 'object') {
					if (Array.isArray(current) && Array.isArray(previous)) {
						// For arrays, check if they're different
						if (JSON.stringify(current) !== JSON.stringify(previous)) {
							changedKeys.push(stateKey)
						}
					} else if (!Array.isArray(current) && !Array.isArray(previous)) {
						// For objects, check if they're different
						if (JSON.stringify(current) !== JSON.stringify(previous)) {
							changedKeys.push(stateKey)
						}
					} else {
						// Type mismatch (array vs object)
						changedKeys.push(stateKey)
					}
				} else {
					// Simple value change or null/undefined change
					changedKeys.push(stateKey)
				}
			}
		}
		return changedKeys
	}

	/**
	 * Updates variables when state changes, only updating values that have actually changed
	 * Uses debouncing to batch multiple rapid updates into a single update (500ms delay)
	 * Only checks feedbacks that correspond to changed state properties
	 */
	private updateVariablesOnStateChange(): void {
		// Clear any existing timeout to reset the debounce timer
		if (this.updateVariablesTimeout) {
			clearTimeout(this.updateVariablesTimeout)
		}

		// Schedule the update to run after 500ms
		// This batches multiple rapid calls within 500ms into a single update
		this.updateVariablesTimeout = setTimeout(() => {
			this.updateVariablesTimeout = null

			const currentState = this.getState()
			const changedKeys = this.getChangedStateKeys(currentState, this.previousState)

			// Collect all feedback IDs that need to be checked based on changed state keys
			const feedbackIdsToCheck = new Set<string>()
			for (const stateKey of changedKeys) {
				const feedbackIds = this.getFeedbackIdsForStateKey(stateKey)
				for (const feedbackId of feedbackIds) {
					feedbackIdsToCheck.add(feedbackId)
				}
			}

			// Only check feedbacks that correspond to changed state
			if (feedbackIdsToCheck.size > 0) {
				try {
					this.self.checkFeedbacks(...Array.from(feedbackIdsToCheck))
				} catch (error) {
					this.self.log('debug', `Error checking feedbacks: ${this.getErrorMessage(error)}`)
				}
			}

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
		version: string = '2.0.000',
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
		// Log non-GET requests (commands that modify state)
		if (!requestBody.Cmd.startsWith('ReqGet')) {
			this.self.log('debug', `Sending ${requestBody.Cmd} request to ${url}`)
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
	 * Sets a preset on the camera
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
	}

	/**
	 * Gets trace information from the camera and stores it in state
	 */
	async getTraceInfo(): Promise<TraceInfo[]> {
		const response = await this.sendRequest('/apiv2/ptzctrl', 'ReqGetTraceInfo')
		this.state.traceInfo = response.Content.TraceInfo as TraceInfo[]
		this.updateVariablesOnStateChange()
		return this.state.traceInfo
	}

	/**
	 * Sets trace information on the camera
	 */
	async setTraceInfo(traceRequest: TraceRequest): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetTraceInfo', {
			TraceInfo: traceRequest,
		})
	}

	/**
	 * Gets scanning information from the camera and stores it in state
	 */
	async getScanningInfo(): Promise<ScanningInfo[]> {
		const response = await this.sendRequest('/apiv2/ptzctrl', 'ReqGetScanningInfo')
		this.state.scanningInfo = response.Content.ScanningInfo as ScanningInfo[]
		this.updateVariablesOnStateChange()
		return this.state.scanningInfo
	}

	/**
	 * Sets scanning information on the camera
	 */
	async setScanningInfo(scanningRequest: ScanningRequest): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetScanningInfo', {
			ScanningInfo: scanningRequest,
		})
	}

	/**
	 * Gets cruise information from the camera and stores it in state
	 */
	async getCruiseInfo(): Promise<CruiseInfo[]> {
		const response = await this.sendRequest('/apiv2/ptzctrl', 'ReqGetCruiseInfo')
		this.state.cruiseInfo = response.Content.CruiseInfo as CruiseInfo[]
		this.updateVariablesOnStateChange()
		return this.state.cruiseInfo
	}

	/**
	 * Sets cruise information on the camera
	 */
	async setCruiseInfo(cruiseRequest: CruiseRequest): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetCruiseInfo', {
			CruiseInfo: cruiseRequest,
		})
	}

	/**
	 * Gets auto restart information from the camera and stores it in state
	 */
	async getAutoRestartInfo(): Promise<AutoRestartInfo> {
		const response = await this.sendRequest('/apiv2/system', 'ReqGetAutoRestartInfo')
		this.state.autoRestartInfo = response.Content.AutoRestartInfo as AutoRestartInfo
		this.updateVariablesOnStateChange()
		return this.state.autoRestartInfo
	}

	/**
	 * Sets auto restart type on the camera
	 */
	async setAutoRestartType(autoRestartRequest: AutoRestartRequest): Promise<void> {
		await this.sendRequest('/apiv2/system', 'ReqSetAutoRestartInfo', {
			AutoRestartInfo: autoRestartRequest,
		})
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
		// Convert Level enum string to number if present
		const apiPayload: Partial<{ Level: number; Bright: number; WDR: boolean; WDRLevel: number }> = {}
		if (gammaInfo.Bright !== undefined) apiPayload.Bright = gammaInfo.Bright
		if (gammaInfo.WDR !== undefined) apiPayload.WDR = gammaInfo.WDR
		if (gammaInfo.WDRLevel !== undefined) apiPayload.WDRLevel = gammaInfo.WDRLevel
		if (gammaInfo.Level !== undefined) {
			// Convert string enum to number using reverse lookup, or use number directly
			const levelMap: Record<string, number> = {
				Default: 0,
				'0.45': 1,
				'0.50': 2,
				'0.55': 3,
				'0.63': 4,
			}
			apiPayload.Level = typeof gammaInfo.Level === 'string' ? (levelMap[gammaInfo.Level] ?? 0) : gammaInfo.Level
		}

		await this.sendRequest('/apiv2/image', 'ReqSetGammaInfo', {
			GammaInfo: apiPayload,
		})
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
	}

	async setPictureInfo(pictureInfo: Partial<PictureInfo>): Promise<void> {
		// Convert enum strings to numbers if present
		const apiPayload: Record<string, unknown> = { ...pictureInfo }

		// Convert Scene enum string to number
		if (pictureInfo.Scene !== undefined) {
			const sceneMap: Record<string, number> = {
				Standard: 1,
				Bright: 3,
				Clarity: 4,
				Soft: 5,
			}
			apiPayload.Scene = typeof pictureInfo.Scene === 'string' ? (sceneMap[pictureInfo.Scene] ?? 1) : pictureInfo.Scene
		}

		// Convert DefogMode enum string to number
		if (pictureInfo.DefogMode !== undefined) {
			const defogMap: Record<string, number> = {
				OFF: 0,
				Auto: 1,
				Manual: 2,
			}
			apiPayload.DefogMode =
				typeof pictureInfo.DefogMode === 'string' ? (defogMap[pictureInfo.DefogMode] ?? 0) : pictureInfo.DefogMode
		}

		// Convert Effect enum string to number
		if (pictureInfo.Effect !== undefined) {
			const effectMap: Record<string, number> = {
				Day: 0,
				Night: 1,
			}
			apiPayload.Effect =
				typeof pictureInfo.Effect === 'string' ? (effectMap[pictureInfo.Effect] ?? 0) : pictureInfo.Effect
		}

		await this.sendRequest('/apiv2/image', 'ReqSetPictureInfo', {
			PictureInfo: apiPayload,
		})
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

		// Cache the map lookup to avoid repeated calls
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
	}

	/**
	 * Sets the PTZ position relative to the current position.
	 * @param position The relative PTZ position parameters (all fields optional)
	 */
	async setPTZRelPosition(position: Partial<PTZFRelPosition>): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetPTZFRelPosition', {
			PTZFRelPosition: position,
		})
	}

	/**
	 * Gets the position limitations from the camera.
	 */
	async getPositionLimits(): Promise<PositionLimitations> {
		const response = await this.sendRequest('/apiv2/ptzctrl', 'ReqGetPositionLimitations')
		const positionLimitations = response.Content.PositionLimitations as PositionLimitations
		this.state.positionLimitations = positionLimitations
		this.updateVariablesOnStateChange()
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
		const response = await this.sendRequest('/apiv2/image', 'ReqGetPanTiltInfo')
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
	}
	/**
	 * Builds the shutter speed map from capabilities data
	 * @param imageCapabilitiesContent Optional image capabilities content to extract from
	 */
	private buildShutterSpeedMap(imageCapabilitiesContent?: Record<string, unknown>): void {
		// Check image capabilities if provided
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

		// Check image capabilities if provided
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
	 * Gets network information from the camera and stores it in state
	 */
	async getNetworkInfo(): Promise<NetworkInfo | null> {
		const response = await this.sendRequest('/apiv2/network', 'ReqGetNetworkInfo')
		this.state.networkInfo = {
			NetworkInfo: response.Content.NetworkInfo as NetworkInfo['NetworkInfo'],
			Fallback: response.Content.Fallback as NetworkInfo['Fallback'],
			Status: response.Content.Status,
		}
		this.updateVariablesOnStateChange()
		return this.state.networkInfo
	}

	/**
	 * Gets OSD system information from the camera and stores it in state
	 */
	async getOSDSystemInfo(): Promise<OSDSystemInfo> {
		const response = await this.sendRequest('/apiv2/image', 'ReqGetOSDSystemInfo')
		this.state.osdSystemInfo = response.Content.OSDSystemInfo as OSDSystemInfo
		this.updateVariablesOnStateChange()
		return this.state.osdSystemInfo
	}

	/**
	 * Gets RTSP stream information from the camera and stores it in state
	 */
	async getRTSPInfo(): Promise<RTSPInfo[]> {
		const response = await this.sendRequest('/apiv2/av', 'ReqGetRTSPInfo')
		this.state.rtspInfo = response.Content.RTSPInfo as RTSPInfo[]
		this.updateVariablesOnStateChange()
		return this.state.rtspInfo
	}

	/**
	 * Gets RTMP stream information from the camera and stores it in state
	 */
	async getRTMPInfo(): Promise<RTMPInfo[]> {
		const response = await this.sendRequest('/apiv2/av', 'ReqGetRTMPInfo')
		this.state.rtmpInfo = response.Content.RTMPInfo as RTMPInfo[]
		this.updateVariablesOnStateChange()
		return this.state.rtmpInfo
	}

	/**
	 * Gets AV over UDP stream information from the camera and stores it in state
	 */
	async getAVOverUDPInfo(): Promise<AVOverUDPInfo[]> {
		const response = await this.sendRequest('/apiv2/av', 'ReqGetAVOverUDPInfo')
		this.state.avOverUDPInfo = response.Content.AVOverUDPInfo as AVOverUDPInfo[]
		this.updateVariablesOnStateChange()
		return this.state.avOverUDPInfo
	}

	/**
	 * Gets AV over RTP stream information from the camera and stores it in state
	 */
	async getAVOverRTPInfo(): Promise<AVOverRTPInfo[]> {
		const response = await this.sendRequest('/apiv2/av', 'ReqGetAVOverRTPInfo')
		this.state.avOverRTPInfo = response.Content.AVOverRTPInfo as AVOverRTPInfo[]
		this.updateVariablesOnStateChange()
		return this.state.avOverRTPInfo
	}

	/**
	 * Gets NDI stream information from the camera and stores it in state
	 */
	async getNDIInfo(): Promise<NDIInfo> {
		const response = await this.sendRequest('/apiv2/av', 'ReqGetNDIInfo')
		this.state.ndiInfo = response.Content.NDIInfo as NDIInfo
		this.updateVariablesOnStateChange()
		return this.state.ndiInfo
	}

	/**
	 * Gets SRT stream information from the camera and stores it in state
	 */
	async getSRTInfo(): Promise<SRTInfo[]> {
		const response = await this.sendRequest('/apiv2/av', 'ReqGetSRTInfo')
		this.state.srtInfo = response.Content.SRTInfo as SRTInfo[]
		this.updateVariablesOnStateChange()
		return this.state.srtInfo
	}

	/**
	 * Sets RTSP stream information on the camera
	 * @param channel The channel number (0 = Main Stream, 1 = Substream)
	 * @param info The RTSP stream information parameters (all fields optional)
	 */
	async setRTSPInfo(channel: number, info: Partial<RTSPInfo>): Promise<void> {
		// Only send channel and the fields that are actually being updated
		const payload: Partial<RTSPInfo> = {
			Channel: channel,
			...info,
		}
		await this.sendRequest('/apiv2/av', 'ReqSetRTSPInfo', {
			RTSPInfo: [payload],
		})
	}

	/**
	 * Sets RTMP stream information on the camera
	 * @param channel The channel number (0 = Main Stream, 1 = Substream)
	 * @param info The RTMP stream information parameters (all fields optional)
	 */
	async setRTMPInfo(channel: number, info: Partial<RTMPInfo>): Promise<void> {
		// Only send channel and the fields that are actually being updated
		const payload: Partial<RTMPInfo> = {
			Channel: channel,
			...info,
		}
		await this.sendRequest('/apiv2/av', 'ReqSetRTMPInfo', {
			RTMPInfo: [payload],
		})
	}

	/**
	 * Sets AV over UDP stream information on the camera
	 * @param channel The channel number (0 = Main Stream, 1 = Substream)
	 * @param info The AV over UDP stream information parameters (all fields optional)
	 */
	async setAVOverUDPInfo(channel: number, info: Partial<AVOverUDPInfo>): Promise<void> {
		// Only send channel and the fields that are actually being updated
		const payload: Partial<AVOverUDPInfo> = {
			Channel: channel,
			...info,
		}
		await this.sendRequest('/apiv2/av', 'ReqSetAVOverUDPInfo', {
			AVOverUDPInfo: [payload],
		})
	}

	/**
	 * Sets AV over RTP stream information on the camera
	 * @param channel The channel number (0 = Main Stream, 1 = Substream)
	 * @param info The AV over RTP stream information parameters (all fields optional)
	 */
	async setAVOverRTPInfo(channel: number, info: Partial<AVOverRTPInfo>): Promise<void> {
		// Only send channel and the fields that are actually being updated
		const payload: Partial<AVOverRTPInfo> = {
			Channel: channel,
			...info,
		}
		await this.sendRequest('/apiv2/av', 'ReqSetAVOverRTPInfo', {
			AVOverRTPInfo: [payload],
		})
	}

	/**
	 * Sets NDI stream information on the camera
	 * @param info The NDI stream information parameters (all fields optional)
	 */
	async setNDIInfo(info: Partial<NDIInfo>): Promise<void> {
		await this.sendRequest('/apiv2/av', 'ReqSetNDIInfo', {
			NDIInfo: info,
		})
	}

	/**
	 * Sets SRT stream information on the camera
	 * @param channel The channel number (0 = Main Stream, 1 = Substream)
	 * @param info The SRT stream information parameters (all fields optional)
	 */
	async setSRTInfo(channel: number, info: Partial<SRTInfo>): Promise<void> {
		// Only send channel and the fields that are actually being updated
		const payload: Partial<SRTInfo> = {
			Channel: channel,
			...info,
		}
		await this.sendRequest('/apiv2/av', 'ReqSetSRTInfo', {
			SRTInfo: [payload],
		})
	}

	/**
	 * Sets overlay information on the camera
	 * @param overlayInfo The overlay information array
	 */
	async setOverlayInfo(overlayInfo: Partial<OverlayInfo>): Promise<void> {
		await this.sendRequest('/apiv2/general', 'ReqSetOverlayInfo', {
			OverlayInfo: [overlayInfo],
		})
	}

	/**
	 * Gets encode information from the camera and stores it in state
	 */
	async getEncodeInfo(): Promise<EncodeInfo> {
		const response = await this.sendRequest('/apiv2/av', 'ReqGetEncodeInfo')
		this.state.encodeInfo = {
			EncodeInfo: response.Content.EncodeInfo as EncodeInfo['EncodeInfo'],
			LowLatency: response.Content.LowLatency as EncodeInfo['LowLatency'],
		}
		this.updateVariablesOnStateChange()
		return this.state.encodeInfo
	}

	/**
	 * Sets encode information on the camera
	 * @param encodeInfo The encode information to set
	 */
	async setEncodeInfo(encodeInfo: Partial<EncodeInfo>): Promise<void> {
		await this.sendRequest('/apiv2/av', 'ReqSetEncodeInfo', encodeInfo, '2.0.000')
	}

	/**
	 * Gets audio information from the camera and stores it in state
	 */
	async getAudioInfo(): Promise<AudioInfo> {
		const response = await this.sendRequest('/apiv2/av', 'ReqGetAudioInfo')
		this.state.audioInfo = response.Content.AudioInfo as AudioInfo
		this.updateVariablesOnStateChange()
		return this.state.audioInfo
	}

	/**
	 * Sets audio information on the camera
	 * @param audioInfo The audio information to set
	 */
	async setAudioInfo(audioInfo: Partial<AudioInfo>): Promise<void> {
		await this.sendRequest('/apiv2/av', 'ReqSetAudioInfo', {
			AudioInfo: audioInfo,
		})
	}

	/**
	 * Sets auto scanning on the camera
	 * @param speed The scanning speed (1-255)
	 */
	async setAutoScanning(speed: number): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetAutoScanning', {
			AutoScanningInfo: {
				Speed: speed,
			},
		})
	}

	/**
	 * Extracts object names from a Content object, including nested objects
	 * @param content The content object to extract names from
	 * @param prefix Optional prefix for nested object names (e.g., "VideoOutputInfo")
	 * @returns Array of object names, with nested objects prefixed (e.g., "VideoOutputInfo.SystemFormat")
	 */
	private extractObjectNames(content: Record<string, unknown>, prefix?: string): string[] {
		const names: string[] = []

		if (!content || typeof content !== 'object') {
			return names
		}

		for (const key in content) {
			// Skip Status and Errors as they're not capability objects
			if (key !== 'Status' && key !== 'Errors' && typeof content[key] === 'object' && content[key] !== null) {
				const fullName = prefix ? `${prefix}.${key}` : key
				names.push(fullName)

				// Recursively extract nested object names
				const nestedContent = content[key] as Record<string, unknown>
				if (nestedContent && !Array.isArray(nestedContent)) {
					try {
						const nestedNames = this.extractObjectNames(nestedContent, fullName)
						names.push(...nestedNames)
					} catch (error) {
						this.self.log(
							'debug',
							`Error extracting nested object names for ${fullName}: ${this.getErrorMessage(error)}`,
						)
					}
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
	 * Builds a Set of all capabilities for O(1) lookup performance
	 */
	private buildCapabilitySet(): void {
		if (!this.cameraCapabilities) {
			this.capabilitySet = null
			return
		}

		const set = new Set<string>()
		const categories = [
			this.cameraCapabilities.systemCapabilities,
			this.cameraCapabilities.ptzfCapabilities,
			this.cameraCapabilities.imageCapabilities,
			this.cameraCapabilities.avStreamCapabilities,
			this.cameraCapabilities.networkCapabilities,
			this.cameraCapabilities.generalCapabilities,
			this.cameraCapabilities.encodeCapabilities,
		]

		for (const category of categories) {
			if (category) {
				for (const capability of category) {
					set.add(capability)
				}
			}
		}

		this.capabilitySet = set
	}

	/**
	 * Helper to fetch and extract capabilities with error handling
	 */
	private async fetchCapabilities(
		endpoint: string,
		cmd: string,
		capabilityName: string,
		version?: string,
	): Promise<string[] | null> {
		try {
			const response = await this.sendRequest(endpoint, cmd, undefined, version)
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
			encodeCapabilities,
		] = await Promise.allSettled([
			this.fetchCapabilities('/apiv2/system', 'ReqGetSystemCapabilities', 'system capabilities'),
			this.fetchCapabilities('/apiv2/ptzctrl', 'ReqGetPTZFCapabilities', 'PTZF capabilities'),
			this.sendRequest('/apiv2/image', 'ReqGetImageCapabilities').catch((error) => {
				this.self.log('debug', `Failed to get image capabilities: ${this.getErrorMessage(error)}`)
				return null
			}),
			this.fetchCapabilities('/apiv2/av', 'ReqGetAVStreamCapabilities', 'AV stream capabilities'),
			this.fetchCapabilities('/apiv2/network', 'ReqGetNetworkCapabilities', 'network capabilities'),
			this.fetchCapabilities('/apiv2/general', 'ReqGetGeneralCapabilities', 'general capabilities'),
			this.fetchCapabilities('/apiv2/av', 'ReqGetEncodeCapabilities', 'encode capabilities', '2.0.000'),
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
		if (encodeCapabilities.status === 'fulfilled' && encodeCapabilities.value) {
			capabilities.encodeCapabilities = encodeCapabilities.value
		}

		this.cameraCapabilities = capabilities
		// Build capability set for efficient lookups
		this.buildCapabilitySet()
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
	 * Uses a Set for O(1) lookup performance instead of O(n) array searches
	 * @param capabilityName The name of the capability to check for
	 * @returns true if the capability is found in any category, false otherwise
	 */
	hasCapability(capabilityName: string): boolean {
		if (!this.capabilitySet) {
			return false
		}
		return this.capabilitySet.has(capabilityName)
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
			{ capabilities: [], method: async () => this.getGeneralCapabilities() },
			{
				capabilities: ['PTZFPresetSpeed', 'PresetSpeed'],
				method: async () => this.getPresetSpeed(),
			},
			{ capabilities: ['PanTiltInfo', 'PTZFMoveInfo'], method: async () => this.getPTInfo() },
			{ capabilities: ['OverlayInfo'], method: async () => this.getOverlayInfo() },
			{ capabilities: ['OSDSystemInfo'], method: async () => this.getOSDSystemInfo() },
			{ capabilities: ['RTSPInfo'], method: async () => this.getRTSPInfo() },
			{ capabilities: ['RTMPInfo'], method: async () => this.getRTMPInfo() },
			{ capabilities: ['AVOverUDPInfo'], method: async () => this.getAVOverUDPInfo() },
			{ capabilities: ['AVOverRTPInfo'], method: async () => this.getAVOverRTPInfo() },
			{ capabilities: ['NDIInfo'], method: async () => this.getNDIInfo() },
			{ capabilities: ['SRTInfo'], method: async () => this.getSRTInfo() },
			{ capabilities: ['EncodeInfo'], method: async () => this.getEncodeInfo() },
			{ capabilities: ['AudioInfo'], method: async () => this.getAudioInfo() },
			{ capabilities: ['TraceInfo'], method: async () => this.getTraceInfo() },
			{ capabilities: ['ScanningInfo'], method: async () => this.getScanningInfo() },
			{ capabilities: ['CruiseInfo'], method: async () => this.getCruiseInfo() },
			{ capabilities: ['AutoRestartInfo'], method: async () => this.getAutoRestartInfo() },
		]

		const promises = capabilityMappings
			.filter((mapping) => {
				// If capabilities aren't loaded, try all calls
				if (!capabilitiesLoaded) return true
				// Empty capabilities array means always run
				if (mapping.capabilities.length === 0) return true
				// Otherwise, check if any of the required capabilities exist
				return mapping.capabilities.some((cap) => this.hasCapability(cap))
			})
			.map(async (mapping) => {
				try {
					await mapping.method()
				} catch (error) {
					// Log but don't throw - allow other calls to continue
					this.self.log('debug', `Failed to fetch ${mapping.capabilities.join(', ')}: ${this.getErrorMessage(error)}`)
				}
			})

		await Promise.allSettled(promises)
	}
}
