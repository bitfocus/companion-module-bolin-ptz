import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { createHash, randomBytes } from 'crypto'

interface LoginResponse {
	Cmd: string
	Version?: string
	Content: {
		Token?: {
			Value?: string
		}
		Status: number
	}
}

export interface ModuleSecrets {
	password: string
}

export class ModuleInstance extends InstanceBase<ModuleConfig, ModuleSecrets> {
	config!: ModuleConfig // Setup in init()
	secrets!: ModuleSecrets // Setup in init()
	private authToken: string | null = null

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig, _isFirstInit: boolean, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets

		await this.performLogin()

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
	}

	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
		this.authToken = null
	}

	async configUpdated(config: ModuleConfig, secrets: ModuleSecrets): Promise<void> {
		this.authToken = null
		this.config = config
		this.secrets = secrets
		await this.performLogin()
	}

	async performLogin(): Promise<void> {
		const password = this.secrets?.password
		console.log('password', password)
		if (!this.config.host || !this.config.username || !password) {
			this.updateStatus(InstanceStatus.BadConfig, `Missing configuration details`)
			return
		}

		try {
			const url = `http://${this.config.host}:${this.config.port}/apiv2/login`

			// Generate random 32-character salt
			const salt = randomBytes(16).toString('hex')

			// Generate sign: MD5(toUpperCase(sha256(password)+Salt))
			const sha256Hash = createHash('sha256').update(password).digest('hex')
			const signInput = (sha256Hash + salt).toUpperCase()
			const sign = createHash('md5').update(signInput).digest('hex')

			const requestBody = {
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
				this.updateStatus(InstanceStatus.ConnectionFailure)
				this.log('error', `Login failed with status: ${response.status}`)
				return
			}

			const data = (await response.json()) as LoginResponse

			if (data.Content.Status === 0 && data.Content.Token) {
				console.log('data.Content.Token', data.Content.Token)
				this.authToken = data.Content.Token.Value ?? null
				this.updateStatus(InstanceStatus.Ok)
				this.log('debug', 'Login successful')

				// Request system capabilities after successful login
				try {
					const systemResponse = await this.makeApiRequest('/apiv2/system', {
						Cmd: 'ReqGetSystemInfo',
						Version: '2.0.000',
					})
					console.log('System Info:', JSON.stringify(systemResponse, null, 2))
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error'
					this.log('warn', `Failed to get system capabilities: ${errorMessage}`)
				}
			} else {
				this.authToken = null
				this.updateStatus(InstanceStatus.ConnectionFailure)
				this.log('error', `Login failed with status: ${data.Content.Status}`)
			}
		} catch (error) {
			this.authToken = null
			const errorMessage = error instanceof Error ? error.message : 'Unknown error'
			this.updateStatus(InstanceStatus.ConnectionFailure)
			this.log('error', `Login error: ${errorMessage}`)
		}
	}

	/**
	 * Gets the authentication cookie string for API requests
	 */
	getAuthCookie(): string | null {
		if (!this.authToken || !this.config.username) {
			return null
		}
		console.log(this.authToken)
		return `Username=${this.config.username};Token=${this.authToken}`
	}

	/**
	 * Makes an authenticated API request to the Bolin camera
	 */
	async makeApiRequest(endpoint: string, requestBody: Record<string, unknown>): Promise<unknown> {
		const cookie = this.getAuthCookie()
		if (!cookie) {
			throw new Error('Not authenticated. Please login first.')
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
		console.log(cookie)
		console.log('requestBody', requestBody)
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		return await response.json()
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
