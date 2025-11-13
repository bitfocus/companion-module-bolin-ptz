import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { BolinCamera } from './api.js'

export interface ModuleSecrets {
	password: string
}

export class ModuleInstance extends InstanceBase<ModuleConfig, ModuleSecrets> {
	config!: ModuleConfig // Setup in init()
	secrets!: ModuleSecrets // Setup in init()
	public camera: BolinCamera | null = null

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig, _isFirstInit: boolean, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets
		this.updateVariableDefinitions()

		await this.performLogin()

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
	}

	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
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
				console.log('System info: ' + JSON.stringify(systemInfo))

				//Testing only
				await this.camera.getCurrentPresets()
				await this.camera.getPTZPosition()
				await this.camera.getLensInfo()
				await this.camera.getPictureInfo()
				await this.camera.getGammaInfo()
				await this.camera.getWhiteBalanceInfo()
				await this.camera.getExposureInfo()
				await this.camera.getPositionLimits()
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

	// Return config fields for web config
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
}

runEntrypoint(ModuleInstance, UpgradeScripts)
