import { createHash, randomBytes } from 'crypto'
import type { ModuleConfig } from './config.js'
import type {
	ApiResponse,
	LoginRequest,
	LoginResponse,
	SystemInfo,
	PresetInfo,
	PresetRequest,
	ZoomCommand,
	FocusCommand,
	PTMoveCommand,
	PTZFPosition,
	PTZFPositionSet,
	PTZFRelPosition,
	CameraState,
	LensInfo,
	PictureInfo,
	GammaInfo,
	WhiteBalanceInfo,
	ExposureInfo,
} from './types.js'
import type { ModuleInstance } from './main.js'

export class BolinCamera {
	private config: ModuleConfig
	private password: string
	private authToken: string | null = null
	private systemInfo: SystemInfo | null = null
	private presets: PresetInfo[] | null = null
	private ptzPosition: PTZFPosition | null = null
	private lensInfo: LensInfo | null = null
	private pictureInfo: PictureInfo | null = null
	private gammaInfo: GammaInfo | null = null
	private whiteBalanceInfo: WhiteBalanceInfo | null = null
	private exposureInfo: ExposureInfo | null = null
	private previousState: CameraState | null = null
	private self: ModuleInstance

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
						UserName: this.config.username,
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
			throw new Error(`Login error: ${errorMessage}`)
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
		this.authToken = null
		this.systemInfo = null
		this.presets = null
		this.ptzPosition = null
		this.lensInfo = null
		this.pictureInfo = null
		this.gammaInfo = null
		this.whiteBalanceInfo = null
		this.exposureInfo = null
		this.previousState = null
	}

	/**
	 * Gets the current camera state
	 */
	getState(): CameraState {
		return {
			ptzPosition: this.ptzPosition,
			systemInfo: this.systemInfo,
			presets: this.presets,
			lensInfo: this.lensInfo,
			pictureInfo: this.pictureInfo,
			gammaInfo: this.gammaInfo,
			whiteBalanceInfo: this.whiteBalanceInfo,
			exposureInfo: this.exposureInfo,
		}
	}

	/**
	 * Updates variables when state changes, only updating values that have actually changed
	 */
	private updateVariablesOnStateChange(): void {
		console.log('Updating variables on state change')
		const currentState = this.getState()
		const previousState = this.previousState

		const variables: Record<string, string> = {}

		// Update PTZ position variables if changed
		if (currentState.ptzPosition) {
			if (
				!previousState?.ptzPosition ||
				previousState.ptzPosition.PanPosition !== currentState.ptzPosition.PanPosition
			) {
				variables.pan_position = currentState.ptzPosition.PanPosition.toString()
			}
			if (
				!previousState?.ptzPosition ||
				previousState.ptzPosition.TiltPosition !== currentState.ptzPosition.TiltPosition
			) {
				variables.tilt_position = currentState.ptzPosition.TiltPosition.toString()
			}
			if (
				!previousState?.ptzPosition ||
				previousState.ptzPosition.ZoomPosition !== currentState.ptzPosition.ZoomPosition
			) {
				variables.zoom_position = currentState.ptzPosition.ZoomPosition.toString()
			}
		}

		// Update system info variables if changed
		if (currentState.systemInfo) {
			if (!previousState?.systemInfo || previousState.systemInfo.DeviceName !== currentState.systemInfo.DeviceName) {
				variables.device_name = currentState.systemInfo.DeviceName ?? ''
			}
			if (!previousState?.systemInfo || previousState.systemInfo.ModelName !== currentState.systemInfo.ModelName) {
				variables.model_name = currentState.systemInfo.ModelName ?? ''
			}
		}

		// Update lens info variables if changed
		if (currentState.lensInfo) {
			if (!previousState?.lensInfo || previousState.lensInfo.FocusMode !== currentState.lensInfo.FocusMode) {
				variables.focus_mode = currentState.lensInfo.FocusMode.toString()
			}
			if (!previousState?.lensInfo || previousState.lensInfo.FocusArea !== currentState.lensInfo.FocusArea) {
				variables.focus_area = currentState.lensInfo.FocusArea.toString()
			}
			if (!previousState?.lensInfo || previousState.lensInfo.NearLimit !== currentState.lensInfo.NearLimit) {
				variables.near_limit = currentState.lensInfo.NearLimit.toString()
			}
			if (!previousState?.lensInfo || previousState.lensInfo.AFSensitivity !== currentState.lensInfo.AFSensitivity) {
				variables.af_sensitivity = currentState.lensInfo.AFSensitivity.toString()
			}
			if (!previousState?.lensInfo || previousState.lensInfo.SmartFocus !== currentState.lensInfo.SmartFocus) {
				variables.smart_focus = currentState.lensInfo.SmartFocus.toString()
			}
			if (!previousState?.lensInfo || previousState.lensInfo.DigitalZoom !== currentState.lensInfo.DigitalZoom) {
				variables.digital_zoom = currentState.lensInfo.DigitalZoom.toString()
			}
			if (!previousState?.lensInfo || previousState.lensInfo.ZoomRatioOSD !== currentState.lensInfo.ZoomRatioOSD) {
				variables.zoom_ratio_osd = currentState.lensInfo.ZoomRatioOSD.toString()
			}
			if (!previousState?.lensInfo || previousState.lensInfo.MFSpeed !== currentState.lensInfo.MFSpeed) {
				variables.mf_speed = currentState.lensInfo.MFSpeed.toString()
			}
		}

		// Update picture info variables if changed
		if (currentState.pictureInfo) {
			if (!previousState?.pictureInfo || previousState.pictureInfo['2DNR'] !== currentState.pictureInfo['2DNR']) {
				variables['2dnr'] = currentState.pictureInfo['2DNR'].toString()
			}
			if (!previousState?.pictureInfo || previousState.pictureInfo['3DNR'] !== currentState.pictureInfo['3DNR']) {
				variables['3dnr'] = currentState.pictureInfo['3DNR'].toString()
			}
			if (!previousState?.pictureInfo || previousState.pictureInfo.Sharpness !== currentState.pictureInfo.Sharpness) {
				variables.sharpness = currentState.pictureInfo.Sharpness.toString()
			}
			if (!previousState?.pictureInfo || previousState.pictureInfo.Contrast !== currentState.pictureInfo.Contrast) {
				variables.contrast = currentState.pictureInfo.Contrast.toString()
			}
			if (!previousState?.pictureInfo || previousState.pictureInfo.Saturation !== currentState.pictureInfo.Saturation) {
				variables.saturation = currentState.pictureInfo.Saturation.toString()
			}
			if (!previousState?.pictureInfo || previousState.pictureInfo.Hue !== currentState.pictureInfo.Hue) {
				variables.hue = currentState.pictureInfo.Hue.toString()
			}
			if (!previousState?.pictureInfo || previousState.pictureInfo.DeFlicker !== currentState.pictureInfo.DeFlicker) {
				variables.deflicker = currentState.pictureInfo.DeFlicker
			}
			if (!previousState?.pictureInfo || previousState.pictureInfo.Scene !== currentState.pictureInfo.Scene) {
				variables.scene = currentState.pictureInfo.Scene
			}
			if (!previousState?.pictureInfo || previousState.pictureInfo.DefogMode !== currentState.pictureInfo.DefogMode) {
				variables.defog_mode = currentState.pictureInfo.DefogMode
			}
			if (!previousState?.pictureInfo || previousState.pictureInfo.DefogLevel !== currentState.pictureInfo.DefogLevel) {
				variables.defog_level = currentState.pictureInfo.DefogLevel.toString()
			}
			if (!previousState?.pictureInfo || previousState.pictureInfo.Effect !== currentState.pictureInfo.Effect) {
				variables.effect = currentState.pictureInfo.Effect
			}
			if (!previousState?.pictureInfo || previousState.pictureInfo.Flip !== currentState.pictureInfo.Flip) {
				variables.flip = currentState.pictureInfo.Flip.toString()
			}
			if (!previousState?.pictureInfo || previousState.pictureInfo.Mirror !== currentState.pictureInfo.Mirror) {
				variables.mirror = currentState.pictureInfo.Mirror.toString()
			}
			if (!previousState?.pictureInfo || previousState.pictureInfo.HLCMode !== currentState.pictureInfo.HLCMode) {
				variables.hlc_mode = currentState.pictureInfo.HLCMode.toString()
			}
			if (!previousState?.pictureInfo || previousState.pictureInfo.BLC !== currentState.pictureInfo.BLC) {
				variables.blc = currentState.pictureInfo.BLC.toString()
			}
		}

		// Update gamma info variables if changed
		if (currentState.gammaInfo) {
			if (!previousState?.gammaInfo || previousState.gammaInfo.Level !== currentState.gammaInfo.Level) {
				variables.gamma_level = currentState.gammaInfo.Level
			}
			if (!previousState?.gammaInfo || previousState.gammaInfo.Bright !== currentState.gammaInfo.Bright) {
				variables.gamma_bright = currentState.gammaInfo.Bright.toString()
			}
			if (!previousState?.gammaInfo || previousState.gammaInfo.WDR !== currentState.gammaInfo.WDR) {
				variables.wdr = currentState.gammaInfo.WDR.toString()
			}
			if (!previousState?.gammaInfo || previousState.gammaInfo.WDRLevel !== currentState.gammaInfo.WDRLevel) {
				variables.wdr_level = currentState.gammaInfo.WDRLevel.toString()
			}
		}

		// Update white balance info variables if changed
		if (currentState.whiteBalanceInfo) {
			if (
				!previousState?.whiteBalanceInfo ||
				previousState.whiteBalanceInfo.Mode !== currentState.whiteBalanceInfo.Mode
			) {
				variables.wb_mode = currentState.whiteBalanceInfo.Mode
			}
			if (
				!previousState?.whiteBalanceInfo ||
				previousState.whiteBalanceInfo.WBSensitivity !== currentState.whiteBalanceInfo.WBSensitivity
			) {
				variables.wb_sensitivity = currentState.whiteBalanceInfo.WBSensitivity.toString()
			}
			if (
				!previousState?.whiteBalanceInfo ||
				previousState.whiteBalanceInfo.RGain !== currentState.whiteBalanceInfo.RGain
			) {
				variables.r_gain = currentState.whiteBalanceInfo.RGain.toString()
			}
			if (
				!previousState?.whiteBalanceInfo ||
				previousState.whiteBalanceInfo.BGain !== currentState.whiteBalanceInfo.BGain
			) {
				variables.b_gain = currentState.whiteBalanceInfo.BGain.toString()
			}
			if (
				!previousState?.whiteBalanceInfo ||
				previousState.whiteBalanceInfo.RTuning !== currentState.whiteBalanceInfo.RTuning
			) {
				variables.r_tuning = currentState.whiteBalanceInfo.RTuning.toString()
			}
			if (
				!previousState?.whiteBalanceInfo ||
				previousState.whiteBalanceInfo.GTuning !== currentState.whiteBalanceInfo.GTuning
			) {
				variables.g_tuning = currentState.whiteBalanceInfo.GTuning.toString()
			}
			if (
				!previousState?.whiteBalanceInfo ||
				previousState.whiteBalanceInfo.BTuning !== currentState.whiteBalanceInfo.BTuning
			) {
				variables.b_tuning = currentState.whiteBalanceInfo.BTuning.toString()
			}
			if (
				!previousState?.whiteBalanceInfo ||
				previousState.whiteBalanceInfo.ColorTemperature !== currentState.whiteBalanceInfo.ColorTemperature
			) {
				variables.color_temperature = currentState.whiteBalanceInfo.ColorTemperature
			}
		}

		// Update exposure info variables if changed
		if (currentState.exposureInfo) {
			if (!previousState?.exposureInfo || previousState.exposureInfo.Mode !== currentState.exposureInfo.Mode) {
				variables.exposure_mode = currentState.exposureInfo.Mode
			}
			if (!previousState?.exposureInfo || previousState.exposureInfo.Gain !== currentState.exposureInfo.Gain) {
				variables.gain = currentState.exposureInfo.Gain.toString()
			}
			if (
				!previousState?.exposureInfo ||
				previousState.exposureInfo.GainLimit !== currentState.exposureInfo.GainLimit
			) {
				variables.gain_limit = currentState.exposureInfo.GainLimit.toString()
			}
			if (
				!previousState?.exposureInfo ||
				previousState.exposureInfo.ExCompLevel !== currentState.exposureInfo.ExCompLevel
			) {
				variables.ex_comp_level = currentState.exposureInfo.ExCompLevel.toString()
			}
			if (
				!previousState?.exposureInfo ||
				previousState.exposureInfo.SmartExposure !== currentState.exposureInfo.SmartExposure
			) {
				variables.smart_exposure = currentState.exposureInfo.SmartExposure.toString()
			}
			if (
				!previousState?.exposureInfo ||
				previousState.exposureInfo.ShutterSpeed !== currentState.exposureInfo.ShutterSpeed
			) {
				variables.shutter_speed = currentState.exposureInfo.ShutterSpeed
			}
			if (!previousState?.exposureInfo || previousState.exposureInfo.Iris !== currentState.exposureInfo.Iris) {
				variables.iris = currentState.exposureInfo.Iris.toString()
			}
		}

		// Only update variables if something changed
		if (Object.keys(variables).length > 0) {
			this.self.setVariableValues(variables)
			console.log('Updated variables: ' + JSON.stringify(variables))
		}

		// Store current state as previous for next comparison
		this.previousState = { ...currentState }
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

		this.self.log('debug', `Sending request to ${url} with body: ${JSON.stringify(requestBody)}`)

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}
		const data = (await response.json()) as ApiResponse
		if (typeof data?.Content?.Status === 'number' && data.Content.Status !== 0) {
			this.self.log('warn', `API request failed with status: ${JSON.stringify(data.Content)}`)
		}
		return data
	}

	/**
	 * Gets system information from the camera and stores it in state
	 */
	async getSystemInfo(): Promise<SystemInfo> {
		const response = await this.sendRequest('/apiv2/system', 'ReqGetSystemInfo')
		this.systemInfo = response.Content.SystemInfo as SystemInfo
		this.updateVariablesOnStateChange()
		return this.systemInfo
	}

	/**
	 * Gets the stored system information
	 */
	currentSystemInfo(): SystemInfo | null {
		return this.systemInfo
	}

	/**
	 * Gets the current presets from the camera and stores them in state
	 */
	async getCurrentPresets(): Promise<PresetInfo[]> {
		const response = await this.sendRequest('/apiv2/ptzctrl', 'ReqGetPTZFPreset')
		this.presets = response.Content.PresetInfo as PresetInfo[]
		this.updateVariablesOnStateChange()
		return this.presets
	}

	/**
	 * Gets the current presets from the camera and stores them in state
	 */
	async setPreset(preset: PresetRequest): Promise<void> {
		const response = await this.sendRequest('/apiv2/ptzctrl', 'ReqSetPTZFPreset', {
			PresetInfo: preset,
		})
		console.log('Set preset response: ' + JSON.stringify(response))
	}

	/**
	 * Gets the stored presets
	 */
	currentPresets(): PresetInfo[] | null {
		return this.presets
	}

	/**
	 * Gets the stored PTZ position
	 */
	currentPTZPosition(): PTZFPosition | null {
		return this.ptzPosition
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

		// Convert FocusArea enum: 0 = 'Default', 1 = 'All', 2 = 'Top', 3 = 'Center', 4 = 'Bottom'
		const focusAreaMap: Record<number, 'Default' | 'All' | 'Top' | 'Center' | 'Bottom'> = {
			0: 'Default',
			1: 'All',
			2: 'Top',
			3: 'Center',
			4: 'Bottom',
		}

		// Convert NearLimit enum: 0 = '1cm', 1 = '30cm', 4 = '1.0m'
		const nearLimitMap: Record<number, '1cm' | '30cm' | '1.0m'> = {
			0: '1cm',
			1: '30cm',
			4: '1.0m',
		}

		// Convert AFSensitivity enum: 0 = 'Low', 1 = 'Middle', 2 = 'High'
		const afSensitivityMap: Record<number, 'Low' | 'Middle' | 'High'> = {
			0: 'Low',
			1: 'Middle',
			2: 'High',
		}

		this.lensInfo = {
			...rawLensInfo,
			FocusMode: rawLensInfo.FocusMode === 0 ? 'Auto' : 'Manual',
			FocusArea: focusAreaMap[rawLensInfo.FocusArea] ?? 'Default',
			NearLimit: nearLimitMap[rawLensInfo.NearLimit] ?? '1cm',
			AFSensitivity: afSensitivityMap[rawLensInfo.AFSensitivity] ?? 'Low',
		}
		this.updateVariablesOnStateChange()
		return this.lensInfo
	}

	/**
	 * Gets the stored lens information
	 */
	currentLensInfo(): LensInfo | null {
		return this.lensInfo
	}

	/**
	 * Gets picture information from the camera and stores it in state
	 */
	async getPictureInfo(): Promise<PictureInfo> {
		const response = await this.sendRequest('/apiv2/image', 'ReqGetPictureInfo', undefined, '2.0.000')
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

		// Convert DeFlicker enum: 0 = 'OFF', 1 = '50HZ', 2 = '60HZ'
		const deFlickerMap: Record<number, 'OFF' | '50HZ' | '60HZ'> = {
			0: 'OFF',
			1: '50HZ',
			2: '60HZ',
		}

		// Convert Scene enum: 1 = 'Standard', 3 = 'Bright', 4 = 'Clarity', 5 = 'Soft'
		const sceneMap: Record<number, 'Standard' | 'Bright' | 'Clarity' | 'Soft'> = {
			1: 'Standard',
			3: 'Bright',
			4: 'Clarity',
			5: 'Soft',
		}

		// Convert DefogMode enum: 0 = 'OFF', 1 = 'Auto', 2 = 'Manual'
		const defogModeMap: Record<number, 'OFF' | 'Auto' | 'Manual'> = {
			0: 'OFF',
			1: 'Auto',
			2: 'Manual',
		}

		// Convert Effect enum: 0 = 'Day', 1 = 'Night'
		const effectMap: Record<number, 'Day' | 'Night'> = {
			0: 'Day',
			1: 'Night',
		}

		this.pictureInfo = {
			...rawPictureInfo,
			DeFlicker: deFlickerMap[rawPictureInfo.DeFlicker] ?? 'OFF',
			Scene: sceneMap[rawPictureInfo.Scene] ?? 'Standard',
			DefogMode: defogModeMap[rawPictureInfo.DefogMode] ?? 'OFF',
			Effect: effectMap[rawPictureInfo.Effect] ?? 'Day',
		}
		this.updateVariablesOnStateChange()
		return this.pictureInfo
	}

	/**
	 * Gets the stored picture information
	 */
	currentPictureInfo(): PictureInfo | null {
		return this.pictureInfo
	}

	/**
	 * Gets gamma information from the camera and stores it in state
	 */
	async getGammaInfo(): Promise<GammaInfo> {
		const response = await this.sendRequest('/apiv2/image', 'ReqGetGammaInfo', undefined, '2.0.000')
		const rawGammaInfo = response.Content.GammaInfo as {
			Level: number
			Bright: number
			WDR: boolean
			WDRLevel: number
		}

		// Convert Level enum: 0 = 'Default', 1 = '0.45', 2 = '0.50', 3 = '0.55', 4 = '0.63'
		const gammaLevelMap: Record<number, 'Default' | '0.45' | '0.50' | '0.55' | '0.63'> = {
			0: 'Default',
			1: '0.45',
			2: '0.50',
			3: '0.55',
			4: '0.63',
		}

		this.gammaInfo = {
			...rawGammaInfo,
			Level: gammaLevelMap[rawGammaInfo.Level] ?? 'Default',
		}
		this.updateVariablesOnStateChange()
		return this.gammaInfo
	}

	/**
	 * Gets the stored gamma information
	 */
	currentGammaInfo(): GammaInfo | null {
		return this.gammaInfo
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

		// Convert Mode enum: 0 = 'Auto', 1 = 'Indoor', 2 = 'Outdoor', 3 = 'OPW', 4 = 'ATW', 5 = 'User', 8 = 'SVL', 10 = 'ManualColorTemperature'
		const whiteBalanceModeMap: Record<
			number,
			'Auto' | 'Indoor' | 'Outdoor' | 'OPW' | 'ATW' | 'User' | 'SVL' | 'ManualColorTemperature'
		> = {
			0: 'Auto',
			1: 'Indoor',
			2: 'Outdoor',
			3: 'OPW',
			4: 'ATW',
			5: 'User',
			8: 'SVL',
			10: 'ManualColorTemperature',
		}

		// Convert ColorTemperature: numeric value (2500-9000) to string with 'K' suffix
		const colorTemp = rawWhiteBalanceInfo.ColorTemperature
		const colorTemperatureStr: string =
			colorTemp >= 2500 && colorTemp <= 9000 && colorTemp % 100 === 0 ? `${colorTemp}K` : '5500K' // Default fallback

		this.whiteBalanceInfo = {
			...rawWhiteBalanceInfo,
			Mode: whiteBalanceModeMap[rawWhiteBalanceInfo.Mode] ?? 'Auto',
			ColorTemperature: colorTemperatureStr as WhiteBalanceInfo['ColorTemperature'],
		}
		this.updateVariablesOnStateChange()
		return this.whiteBalanceInfo
	}

	/**
	 * Gets the stored white balance information
	 */
	currentWhiteBalanceInfo(): WhiteBalanceInfo | null {
		return this.whiteBalanceInfo
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

		// Convert Mode enum: 0 = 'Auto', 1 = 'Manual', 2 = 'ShutterPri', 3 = 'IrisPri'
		const exposureModeMap: Record<number, 'Auto' | 'Manual' | 'ShutterPri' | 'IrisPri'> = {
			0: 'Auto',
			1: 'Manual',
			2: 'ShutterPri',
			3: 'IrisPri',
		}

		// Convert ShutterSpeed enum: 9 = '1/60', 10 = '1/90', ..., 29 = '1/100000'
		const shutterSpeedMap: Record<
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
		> = {
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
		}

		this.exposureInfo = {
			...rawExposureInfo,
			Mode: exposureModeMap[rawExposureInfo.Mode] ?? 'Auto',
			ShutterSpeed: shutterSpeedMap[rawExposureInfo.ShutterSpeed] ?? '1/60',
		}
		this.updateVariablesOnStateChange()
		return this.exposureInfo
	}

	/**
	 * Gets the stored exposure information
	 */
	currentExposureInfo(): ExposureInfo | null {
		return this.exposureInfo
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
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetManualRestart')
	}

	/**
	 * Gets the current PTZ position from the camera.
	 */
	async getPTZPosition(): Promise<PTZFPosition> {
		const response = await this.sendRequest('/apiv2/ptzctrl', 'ReqGetPTZFPosition', undefined, '2.0.000')
		const position = response.Content.PTZFPosition as PTZFPosition
		this.ptzPosition = position
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
		if (this.ptzPosition) {
			this.ptzPosition = {
				PanPosition: position.PanPosition ?? this.ptzPosition.PanPosition,
				TiltPosition: position.TiltPosition ?? this.ptzPosition.TiltPosition,
				ZoomPosition: position.ZoomPosition ?? this.ptzPosition.ZoomPosition,
			}
			this.updateVariablesOnStateChange()
		}
	}

	/**
	 * Sets the PTZ position relative to the current position.
	 * @param position The relative PTZ position parameters (all fields optional)
	 */
	async setPTZRelPosition(position: PTZFRelPosition): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetPTZFRelPosition', {
			PTZFRelPosition: position,
		})
		// Update state if we have current position and relative values
		if (this.ptzPosition && (position.PanPosition !== undefined || position.TiltPosition !== undefined)) {
			this.ptzPosition = {
				PanPosition: (this.ptzPosition.PanPosition ?? 0) + (position.PanPosition ?? 0),
				TiltPosition: (this.ptzPosition.TiltPosition ?? 0) + (position.TiltPosition ?? 0),
				ZoomPosition: this.ptzPosition.ZoomPosition,
			}
			this.updateVariablesOnStateChange()
		}
	}
}
