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

				await Promise.all([this.getCameraInfo(), this.camera.getCameraCapabilities()])
				this.updateModuleComponents()
				this.pollCameraInfo()
			} else {
				this.updateStatus(InstanceStatus.ConnectionFailure)
			}
		} catch (error) {
			this.camera = null
			const errorMessage = error instanceof Error ? error.message : 'Unknown error'
			this.updateStatus(InstanceStatus.ConnectionFailure)
			this.log('error', `${errorMessage}`)
		}
	}

	async getCameraInfo(): Promise<void> {
		if (!this.camera) return

		// Only check capabilities if they've been loaded, otherwise try all calls
		const capabilitiesLoaded = this.camera.currentCameraCapabilities() !== null

		// Mapping of capability names to their corresponding method calls
		const capabilityMappings: Array<{
			capabilities: string[]
			method: () => Promise<unknown>
		}> = [
			{ capabilities: ['PresetInfo'], method: async () => this.camera!.getCurrentPresets() },
			{ capabilities: ['PTZFPosition'], method: async () => this.camera!.getPTZPosition() },
			{ capabilities: ['LensInfo', 'Lens'], method: async () => this.camera!.getLensInfo() },
			{ capabilities: ['PictureInfo', 'Picture'], method: async () => this.camera!.getPictureInfo() },
			{ capabilities: ['GammaInfo'], method: async () => this.camera!.getGammaInfo() },
			{ capabilities: ['WhiteBalanceInfo', 'WhiteBalance'], method: async () => this.camera!.getWhiteBalanceInfo() },
			{ capabilities: ['ExposureInfo', 'Exposure'], method: async () => this.camera!.getExposureInfo() },
			{ capabilities: ['PositionLimitations'], method: async () => this.camera!.getPositionLimits() },
			{ capabilities: ['VideoOutputInfo'], method: async () => this.camera!.getVideoOutput() },
			{ capabilities: ['VideoOutputInfo'], method: async () => this.camera!.getGeneralCapabilities() },
			{
				capabilities: ['PTZFPresetSpeed', 'PresetSpeed'],
				method: async () => this.camera!.getPresetSpeed(),
			},
			{ capabilities: ['PanTiltInfo'], method: async () => this.camera!.getPTInfo() },
			{ capabilities: ['OverlayInfo'], method: async () => this.camera!.getOverlayInfo() },
		]

		const promises = capabilityMappings
			.filter((mapping) => {
				// If capabilities aren't loaded, try all calls
				if (!capabilitiesLoaded) return true
				// Otherwise, check if any of the required capabilities exist
				return mapping.capabilities.some((cap) => this.camera!.hasCapability(cap))
			})
			.map(async (mapping) => mapping.method())

		await Promise.all(promises)
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
