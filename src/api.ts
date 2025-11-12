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
} from './types.js'
import type { ModuleInstance } from './main.js'

export class BolinCamera {
	private config: ModuleConfig
	private password: string
	private authToken: string | null = null
	private systemInfo: SystemInfo | null = null
	private presets: PresetInfo[] | null = null
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
		return response.Content.PTZFPosition as PTZFPosition
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
	async setPTZRelPosition(position: PTZFRelPosition): Promise<void> {
		await this.sendRequest('/apiv2/ptzctrl', 'ReqSetPTZFRelPosition', {
			PTZFRelPosition: position,
		})
	}
}
