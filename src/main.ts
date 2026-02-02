import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions, updateSpeedVariables } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { BolinCamera } from './api.js'
import { UpdatePresets } from './presets.js'

export interface ModuleSecrets {
	password: string
}

export class BolinModuleInstance extends InstanceBase<ModuleConfig, ModuleSecrets> {
	config!: ModuleConfig // Setup in init()
	secrets!: ModuleSecrets // Setup in init()
	public camera: BolinCamera | null = null
	public interval: NodeJS.Timeout | null = null
	public reconnectionInterval: NodeJS.Timeout | null = null
	private isReconnecting: boolean = false
	public ptSpeed: number = 128
	public zoomSpeed: number = 5
	// Track active trace states locally since camera API doesn't report this
	public traceRecording: Map<number, boolean> = new Map() // Trace number -> is recording
	public traceActive: Map<number, boolean> = new Map() // Trace number -> is active (playing)

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig, _isFirstInit: boolean, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets
		this.updateVariableDefinitions()

		this.updateModuleComponents()

		// Perform login asynchronously after init completes to avoid timeout
		setImmediate(() => {
			void this.performLogin()
		})
	}

	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
		if (this.interval) clearInterval(this.interval)
		this.interval = null
		this.stopReconnectionPoll()
		if (this.camera) {
			this.camera.clearAuth()
			this.camera = null
		}
	}

	async configUpdated(config: ModuleConfig, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets
		if (this.camera) {
			this.camera.clearAuth()
		}
		this.camera = null
		await this.performLogin()
	}

	async performLogin(): Promise<void> {
		const password = this.secrets?.password ?? this.config?.password //Temp, until Buttons support secret-text
		if (!this.config.host || !this.config.username || !this.config.port || !password) {
			this.updateStatus(InstanceStatus.BadConfig)
			return
		}

		try {
			this.camera = new BolinCamera(this.config, password, this)
			const token = await this.camera.login()

			if (token) {
				// Stop reconnection polling if it was active
				this.stopReconnectionPoll()
				this.isReconnecting = false

				this.updateStatus(InstanceStatus.Ok)

				// Wait for camera to be ready (retry up to 7 times with backoff, up to ~60 seconds)
				for (let attempt = 0; attempt < 7; attempt++) {
					try {
						const systemInfo = await this.camera.getSystemInfo()
						this.log('debug', 'System info: ' + JSON.stringify(systemInfo))
						// Load capabilities first, then fetch all info based on capabilities
						await this.camera.getCameraCapabilities()
						await this.getCameraInfo(true)
						// Fetch network info once during initialization (not polled)
						await this.camera.getNetworkInfo().catch(() => {
							// Silently fail if network info is not supported
						})
						this.updateModuleComponents()
						this.pollCameraInfo()
						return // Success
					} catch (error) {
						if (attempt === 6) {
							// Last attempt failed - rethrow to be caught by outer catch
							const errorMessage = error instanceof Error ? error.message : 'Unknown error'
							this.log('debug', `Camera initialization failed after 7 attempts (~60s): ${errorMessage}`)
							throw error
						}
						const delay = 1000 * Math.pow(2, attempt)
						this.log('debug', `Camera not ready (attempt ${attempt + 1}/7), retrying in ${delay}ms...`)
						await new Promise((resolve) => setTimeout(resolve, delay))
					}
				}
			} else {
				this.updateStatus(InstanceStatus.ConnectionFailure)
			}
		} catch (error) {
			this.camera = null
			const errorMessage = error instanceof Error ? error.message : 'Unknown error'
			this.updateStatus(InstanceStatus.ConnectionFailure)
			// Only log error if we're not already in reconnection mode
			if (!this.isReconnecting) {
				this.log('error', `Camera connection error: ${errorMessage}`)
			}
			// Start reconnection polling if not already active
			this.startReconnectionPoll()
		}
	}

	async getCameraInfo(suppressReconnection: boolean = false): Promise<void> {
		if (!this.camera) return
		try {
			await this.camera.fetchAllCameraInfo()
		} catch (error) {
			// During initialization, rethrow the error so retry logic can handle it
			if (suppressReconnection) {
				throw error
			}

			// Camera is offline or connection lost
			// Stop normal polling immediately to prevent multiple error logs
			if (this.interval) {
				clearInterval(this.interval)
				this.interval = null
			}

			// Only log the first error
			if (!this.isReconnecting) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error'
				this.log('warn', `Camera connection error: ${errorMessage}`)
				this.updateStatus(InstanceStatus.ConnectionFailure)
			}

			this.startReconnectionPoll()
		}
	}

	pollCameraInfo(): void {
		if (!this.camera) return
		if (this.interval) clearInterval(this.interval)
		this.interval = setInterval(() => {
			void this.getCameraInfo()
		}, 1000)
	}

	startReconnectionPoll(): void {
		// Stop normal polling when offline
		if (this.interval) {
			clearInterval(this.interval)
			this.interval = null
		}

		// Don't start multiple reconnection polls
		if (this.reconnectionInterval) return

		this.isReconnecting = true
		this.log('debug', 'Starting reconnection polling')

		this.reconnectionInterval = setInterval(() => {
			void this.performLogin()
		}, 5000) // Poll every 5 seconds
	}

	stopReconnectionPoll(): void {
		if (this.reconnectionInterval) {
			clearInterval(this.reconnectionInterval)
			this.reconnectionInterval = null
			this.isReconnecting = false
			this.log('debug', 'Stopped reconnection polling')
		}
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateSpeedVariables(): void {
		updateSpeedVariables(this)
	}

	updateModuleComponents(): void {
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		this.updateVariableDefinitions()
		this.updateSpeedVariables()
	}
}

runEntrypoint(BolinModuleInstance, UpgradeScripts)
