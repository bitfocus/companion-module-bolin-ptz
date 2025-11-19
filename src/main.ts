import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { BolinCamera } from './api.js'
import { UpdatePresets } from './presets.js'

export interface ModuleSecrets {
	password: string
}

export class ModuleInstance extends InstanceBase<ModuleConfig, ModuleSecrets> {
	config!: ModuleConfig // Setup in init()
	secrets!: ModuleSecrets // Setup in init()
	public camera: BolinCamera | null = null
	public interval: NodeJS.Timeout | null = null
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
		const password = this.secrets?.password
		if (!this.config.host || !this.config.username || !this.config.port || !password) {
			this.updateStatus(InstanceStatus.BadConfig)
			return
		}

		try {
			this.camera = new BolinCamera(this.config, password, this)
			const token = await this.camera.login()

			if (token) {
				this.updateStatus(InstanceStatus.Ok)

				const systemInfo = await this.camera.getSystemInfo()
				this.log('debug', 'System info: ' + JSON.stringify(systemInfo))

				await this.getCameraInfo()
				this.updateModuleComponents()
				this.pollCameraInfo()
			} else {
				this.updateStatus(InstanceStatus.ConnectionFailure)
			}
		} catch (error) {
			this.camera = null
			const errorMessage = error instanceof Error ? error.message : 'Unknown error'
			this.updateStatus(InstanceStatus.ConnectionFailure)
			this.log('error', `Login error: ${errorMessage}`)
		}
	}

	async getCameraInfo(): Promise<void> {
		if (!this.camera) return

		await Promise.all([
			this.camera.getCurrentPresets(),
			this.camera.getPTZPosition(),
			this.camera.getLensInfo(),
			this.camera.getPictureInfo(),
			this.camera.getGammaInfo(),
			this.camera.getWhiteBalanceInfo(),
			this.camera.getExposureInfo(),
			this.camera.getPositionLimits(),
			this.camera.getVideoOutput(),
			this.camera.getGeneralCapabilities(),
			this.camera.getPresetSpeed(),
			this.camera.getPTInfo(),
			this.camera.getOverlayInfo(),
		])
	}

	pollCameraInfo(): void {
		if (!this.camera) return
		if (this.interval) clearInterval(this.interval)
		this.interval = setInterval(() => {
			void this.getCameraInfo()
		}, 1000)
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

	updateModuleComponents(): void {
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		this.updateVariableDefinitions()
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
