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
			Username: string
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
	Speed?: number
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

/**
 * Focus mode enum
 */
export type FocusMode = 'Auto' | 'Manual'

/**
 * Focus area enum
 */
export type FocusArea = 'Default' | 'All' | 'Top' | 'Center' | 'Bottom'

/**
 * Near limit enum
 */
export type NearLimit = '1cm' | '30cm' | '1.0m'

/**
 * AF sensitivity enum
 */
export type AFSensitivity = 'Low' | 'Middle' | 'High'

/**
 * Lens information
 */
export interface LensInfo {
	FocusMode: FocusMode
	FocusArea: FocusArea
	NearLimit: NearLimit
	AFSensitivity: AFSensitivity
	SmartFocus: boolean
	DigitalZoom: boolean
	ZoomRatioOSD: boolean
	MFSpeed: number
}

/**
 * DeFlicker enum
 */
export type DeFlicker = 'OFF' | '50HZ' | '60HZ'

/**
 * Scene enum
 */
export type Scene = 'Standard' | 'Bright' | 'Clarity' | 'Soft'

/**
 * DefogMode enum
 */
export type DefogMode = 'OFF' | 'Auto' | 'Manual'

/**
 * Effect enum
 */
export type Effect = 'Day' | 'Night'

/**
 * Picture information
 */
export interface PictureInfo {
	'2DNR': number
	'3DNR': number
	Sharpness: number
	Hue: number
	DeFlicker: DeFlicker
	Flip: boolean
	Mirror: boolean
	HLCMode: boolean
	BLC: boolean
	Contrast: number
	Saturation: number
	Scene: Scene
	DefogMode: DefogMode
	DefogLevel: number
	Effect: Effect
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

/**
 * Gamma level enum
 */
export type GammaLevel = 'Default' | '0.45' | '0.50' | '0.55' | '0.63'

/**
 * Gamma information
 */
export interface GammaInfo {
	Level: GammaLevel
	Bright: number
	WDR: boolean
	WDRLevel: number
}

/**
 * White balance mode enum
 */
export type WhiteBalanceMode = 'Auto' | 'Indoor' | 'Outdoor' | 'OPW' | 'ATW' | 'User' | 'SVL' | 'ManualColorTemperature'

/**
 * Color temperature enum (2500K to 9000K in 100K increments)
 */
export type ColorTemperature =
	| '2500K'
	| '2600K'
	| '2700K'
	| '2800K'
	| '2900K'
	| '3000K'
	| '3100K'
	| '3200K'
	| '3300K'
	| '3400K'
	| '3500K'
	| '3600K'
	| '3700K'
	| '3800K'
	| '3900K'
	| '4000K'
	| '4100K'
	| '4200K'
	| '4300K'
	| '4400K'
	| '4500K'
	| '4600K'
	| '4700K'
	| '4800K'
	| '4900K'
	| '5000K'
	| '5100K'
	| '5200K'
	| '5300K'
	| '5400K'
	| '5500K'
	| '5600K'
	| '5700K'
	| '5800K'
	| '5900K'
	| '6000K'
	| '6100K'
	| '6200K'
	| '6300K'
	| '6400K'
	| '6500K'
	| '6600K'
	| '6700K'
	| '6800K'
	| '6900K'
	| '7000K'
	| '7100K'
	| '7200K'
	| '7300K'
	| '7400K'
	| '7500K'
	| '7600K'
	| '7700K'
	| '7800K'
	| '7900K'
	| '8000K'
	| '8100K'
	| '8200K'
	| '8300K'
	| '8400K'
	| '8500K'
	| '8600K'
	| '8700K'
	| '8800K'
	| '8900K'
	| '9000K'

/**
 * White balance information
 */
export interface WhiteBalanceInfo {
	Mode: WhiteBalanceMode
	WBSensitivity: number
	RGain: number
	BGain: number
	RTuning: number
	GTuning: number
	BTuning: number
	ColorTemperature: number
}

/**
 * Exposure mode enum
 */
export type ExposureMode = 'Auto' | 'Manual' | 'ShutterPri' | 'IrisPri'

/**
 * Exposure information
 */
export interface ExposureInfo {
	Mode: ExposureMode
	Gain: number
	GainLimit: number
	ExCompLevel: number
	SmartExposure: boolean
	ShutterSpeed: string // String value that varies by camera model, dynamically built from capabilities
	Iris: number
}

/**
 * Position limitations information
 */
export interface PositionLimitations {
	DownLimit: boolean
	UpLimit: boolean
	LeftLimit: boolean
	RightLimit: boolean
}

/**
 * OSD menu action enum
 */
export type MenuAction = 'ON' | 'OFF' | 'Up' | 'Down' | 'Left' | 'Right' | 'OK' | 'Menutoggle'

/**
 * Video output information
 */
export interface VideoOutputInfo {
	SystemFormat: string
	HDMIResolution: string
	HDMIColorSpace: number
	HDMIBitDepth: number
	SDIColorSpace: number
	SDIResolution: string
	SDIBitDepth: number
}

/**
 * Capability data value/description pair
 */
export interface CapabilityDataValue {
	Value: string | number
	Description: string
}

/**
 * Capability descriptor for string/enum types
 */
export interface CapabilityDescriptor {
	Type: string
	Readonly: boolean
	Description: string
	Data?: CapabilityDataValue[]
	[key: string]: unknown
}

/**
 * General capabilities information
 */
export interface GeneralCapabilities {
	SystemFormat?: CapabilityDescriptor
	VideoOutputInfo?: {
		SystemFormat?: CapabilityDescriptor
		HDMIResolution?: CapabilityDescriptor
		SDIResolution?: CapabilityDescriptor
		HDMIColorSpace?: CapabilityDescriptor
		HDMIBitDepth?: CapabilityDescriptor
		SDIColorSpace?: CapabilityDescriptor
		SDIBitDepth?: CapabilityDescriptor
		[key: string]: CapabilityDescriptor | undefined
	}
	[key: string]: unknown
}

export interface PresetSpeed {
	PresetZoomSpeed: number
	PresetSpeed: number
}

/**
 * Pan/Tilt information
 */
export interface PanTiltInfo {
	AdaptivePT: boolean
	PTSpeed: number
	PanDirection: number
	TiltDirection: number
	PresetMemory: number
	PresetSpeed: number
	PresetZoomSpeed: number
	MotionlessPreset: boolean
	ReloadPreset1: boolean
}

/**
 * Overlay type enum (0 = text, 1 = date, 2 = logo)
 */
export type OverlayType = 0 | 1 | 2

/**
 * Overlay information
 */
export interface OverlayInfo {
	Channel: number
	Type: OverlayType
	Enable: boolean
	Text?: string
	PosX: number
	PosY: number
	Color?: string
}

/**
 * Camera capabilities - stores object names from capability endpoints
 */
export interface CameraCapabilities {
	systemCapabilities?: string[]
	ptzfCapabilities?: string[]
	imageCapabilities?: string[]
	avStreamCapabilities?: string[]
	networkCapabilities?: string[]
	generalCapabilities?: string[]
	encodeCapabilities?: string[]
}

/**
 * Network fallback information
 */
export interface NetworkFallback {
	IPAddress: string
	Gateway: string
	SubnetMask: string
	Timeout: number
}

/**
 * Network information
 */
export interface NetworkInfo {
	NetworkInfo: {
		Pattern: number
		IPAddress: string
		IPVersion: number
		SubnetMask: string
		NetMAC: string
		Gateway: string
		DNS1: string
		DNS2: string
	}
	Fallback: NetworkFallback
	Status: number
}

/**
 * OSD System information
 */
export interface OSDSystemInfo {
	PelcoID: number
	VISCAID: number
	IRID: number
	IRReceive: boolean
	BaudRate: number
	MonitorInfo: number
	TemperatureDegree: number
	DisplayInfo: boolean
	VideoParametersOSD: boolean
	TallyMode: boolean
	Audio: boolean
	InputType: number
	VolumeLevel: number
	PhantomPower: boolean
	ColorSpace: number
}

/**
 * RTSP stream information
 */
export interface RTSPInfo {
	Channel: number
	Enable: boolean
	Port: number
	Transmode?: string
	MaxClientNum: number
	StreamKey: string
	AuthEnable: boolean
}

/**
 * RTMP stream information
 */
export interface RTMPInfo {
	Channel: number
	Enable: boolean
	Port: number
	VideoTagHeader: number
	Url: string
	StreamKey: string
}

/**
 * AV over UDP stream information
 */
export interface AVOverUDPInfo {
	Channel: number
	Address: string
	Port: number
	Enable: boolean
}

/**
 * AV over RTP stream information
 */
export interface AVOverRTPInfo {
	Channel: number
	Address: string
	Port: number
	Enable: boolean
}

/**
 * NDI stream information
 */
export interface NDIInfo {
	NDIEnable: boolean
	NDISDKVer: string
	NDIName: string
	NDIChnName: string
	NDIHX: number
	NDIHXBandwidth: number
	WebCtrl: boolean
	FailoverEnable: boolean
	FailoverSourceName: string
	FailoverIpAddress: string
	MulticastEnable: boolean
	MulticastIP: string
	MulticastMask: string
	MulticastTTL: number
	GroupName: string
	DiscoverServerEnable: boolean
	DiscoverServerIP: string
	BridgeEnable: boolean
	BridgeName: string
	BridgeIPAddress: string
	BridgePort: number
	BridgeKey: string
}

/**
 * SRT stream information
 */
export interface SRTInfo {
	Channel: number
	Enable: boolean
	Mode: number // 1 = Caller, 2 = Listener
	IPAddress: string
	Port: number
	StreamID: string
	Latency: number
	OverheadBandwidth: number
	Encryption: number
	Passphrase: string
}

/**
 * Encode information for a single channel
 */
export interface EncodeInfoItem {
	Channel: number
	StreamType: number
	Enable: boolean
	VideoCompression: number
	Resolution: string
	FieldType: number
	BPFrameType: number
	FrameRate: number
	BitrateType: number
	BitRate: number
	IFrameInterval: number
}

/**
 * Encode information response
 */
export interface EncodeInfo {
	EncodeInfo: EncodeInfoItem[]
	LowLatency: {
		Enable: boolean
	}
}

/**
 * Audio information
 */
export interface AudioInfo {
	Enable: boolean
	Compression: number
	BitRate: number
	SamplingRate: number
	ChannelNumber: number
	Type: number
	Volume: number
}

/**
 * Camera state tracking
 */
export interface CameraState {
	positionLimitations: PositionLimitations | null
	ptzPosition: PTZFPosition | null
	systemInfo: SystemInfo | null
	presets: PresetInfo[] | null
	presetSpeed: PresetSpeed | null
	lensInfo: LensInfo | null
	pictureInfo: PictureInfo | null
	gammaInfo: GammaInfo | null
	whiteBalanceInfo: WhiteBalanceInfo | null
	exposureInfo: ExposureInfo | null
	videoOutputInfo: VideoOutputInfo | null
	generalCapabilities: GeneralCapabilities | null
	panTiltInfo: PanTiltInfo | null
	overlayInfo: OverlayInfo[] | null
	networkInfo: NetworkInfo | null
	osdSystemInfo: OSDSystemInfo | null
	rtspInfo: RTSPInfo[] | null
	rtmpInfo: RTMPInfo[] | null
	avOverUDPInfo: AVOverUDPInfo[] | null
	avOverRTPInfo: AVOverRTPInfo[] | null
	ndiInfo: NDIInfo | null
	srtInfo: SRTInfo[] | null
	encodeInfo: EncodeInfo | null
	audioInfo: AudioInfo | null
}
