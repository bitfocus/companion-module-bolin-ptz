import type { BolinModuleInstance } from './main.js'
import type { CameraState, PictureInfo } from './types.js'
import { convertIrisValueToFStop, calculateNextAutoRestartTime, deepEqual } from './utils.js'

/**
 * Helper function to check if a value has changed between previous and current state
 */
function hasChanged<T>(
	previous: T | null | undefined,
	current: T | null | undefined,
	getValue: (state: T) => unknown,
): boolean {
	return !previous || !current || getValue(previous) !== getValue(current)
}

/**
 * Helper function to update a variable if the value has changed
 */
function updateIfChanged<T>(
	variables: Record<string, number | string | boolean>,
	previous: T | null | undefined,
	current: T | null | undefined,
	getValue: (state: T) => unknown,
	variableId: string,
	defaultValue?: number | string | boolean,
): void {
	if (current && hasChanged(previous, current, getValue)) {
		const value = getValue(current)
		variables[variableId] = (value !== undefined && value !== null ? value : defaultValue) as number | string | boolean
	}
}

/**
 * Helper to update multiple fields from the same state object
 */
function updateFields<T>(
	variables: Record<string, number | string | boolean>,
	previous: T | null | undefined,
	current: T | null | undefined,
	fields: Array<{ getValue: (state: T) => unknown; variableId: string; defaultValue?: number | string | boolean }>,
): void {
	if (!current) return
	for (const field of fields) {
		updateIfChanged(variables, previous, current, field.getValue, field.variableId, field.defaultValue)
	}
}

export function UpdateVariableDefinitions(self: BolinModuleInstance): void {
	const variables: { name: string; variableId: string }[] = []

	// Only check capabilities if they've been loaded, otherwise define all variables
	const capabilitiesLoaded = self.camera?.getStoredCameraCapabilities() !== null

	// Mapping of capability names to their corresponding variable definitions
	const variableMappings: Array<{
		capabilities: string[]
		variables: Array<{ name: string; variableId: string }> | (() => Array<{ name: string; variableId: string }>)
	}> = [
		{
			capabilities: ['OverlayInfo'],
			variables: Array.from({ length: 8 }, (_, i) => ({
				name: `Overlay ${i + 1} Status`,
				variableId: `overlay_${i + 1}_status`,
			})),
		},
		{
			capabilities: ['PTZFPosition'],
			variables: [
				{ name: 'PTZ - Pan Position', variableId: 'pan_position' },
				{ name: 'PTZ - Tilt Position', variableId: 'tilt_position' },
				{ name: 'PTZ - Zoom Position', variableId: 'zoom_position' },
				{ name: 'PTZ - Pan/Tilt Speed', variableId: 'pt_speed' },
				{ name: 'PTZ - Zoom Speed', variableId: 'zoom_speed' },
			],
		},
		{
			capabilities: ['SystemInfo', 'OSDSystemInfo'],
			variables: [
				{ name: 'System - Device Name', variableId: 'device_name' },
				{ name: 'System - Model Name', variableId: 'model_name' },
			],
		},
		{
			capabilities: ['LensInfo', 'Lens'],
			variables: [
				{ name: 'Focus - Mode', variableId: 'focus_mode' },
				{ name: 'Focus - Area', variableId: 'focus_area' },
				{ name: 'Focus - Near Limit', variableId: 'near_limit' },
				{ name: 'Focus - AF Sensitivity', variableId: 'af_sensitivity' },
				{ name: 'Lens - Smart Focus', variableId: 'smart_focus' },
				{ name: 'Lens - Digital Zoom', variableId: 'digital_zoom' },
				{ name: 'Lens - Zoom Ratio OSD', variableId: 'zoom_ratio_osd' },
				{ name: 'Focus - MF Speed', variableId: 'mf_speed' },
			],
		},
		{
			capabilities: ['PTZFPresetSpeed', 'PresetSpeed'],
			variables: [
				{ name: 'Presets - Zoom Speed', variableId: 'preset_zoom_speed' },
				{ name: 'Presets - Speed', variableId: 'preset_speed' },
			],
		},
		{
			capabilities: ['PictureInfo', 'Picture'],
			variables: (() => {
				const baseVariables = [
					{ name: 'Picture - 2DNR', variableId: '2dnr' },
					{ name: 'Picture - 3DNR', variableId: '3dnr' },
					{ name: 'Picture - Sharpness', variableId: 'sharpness' },
					{ name: 'Picture - Contrast', variableId: 'contrast' },
					{ name: 'Picture - Saturation', variableId: 'saturation' },
					{ name: 'Picture - Hue', variableId: 'hue' },
					{ name: 'Picture - DeFlicker', variableId: 'deflicker' },
					{ name: 'Picture - Scene', variableId: 'scene' },
					{ name: 'Picture - Defog Mode', variableId: 'defog_mode' },
					{ name: 'Picture - Defog Level', variableId: 'defog_level' },
					{ name: 'Picture - Effect', variableId: 'effect' },
					{ name: 'Picture - Flip', variableId: 'flip' },
					{ name: 'Picture - Mirror', variableId: 'mirror' },
					{ name: 'Picture - HLC Mode', variableId: 'hlc_mode' },
					{ name: 'Picture - BLC', variableId: 'blc' },
				]

				// Check if camera has color matrix capabilities
				const hasColorMatrixCapability =
					!capabilitiesLoaded ||
					self.camera?.hasCapability('MagentaHue') ||
					self.camera?.hasCapability('RedHue') ||
					self.camera?.hasCapability('PictureInfo.MagentaHue') ||
					self.camera?.hasCapability('PictureInfo.RedHue')

				if (hasColorMatrixCapability) {
					return [
						...baseVariables,
						{ name: 'Picture - Color Matrix - Magenta Hue', variableId: 'color_matrix_magenta_hue' },
						{ name: 'Picture - Color Matrix - Magenta Saturation', variableId: 'color_matrix_magenta_saturation' },
						{ name: 'Picture - Color Matrix - Magenta Value', variableId: 'color_matrix_magenta_value' },
						{ name: 'Picture - Color Matrix - Red Hue', variableId: 'color_matrix_red_hue' },
						{ name: 'Picture - Color Matrix - Red Saturation', variableId: 'color_matrix_red_saturation' },
						{ name: 'Picture - Color Matrix - Red Value', variableId: 'color_matrix_red_value' },
						{ name: 'Picture - Color Matrix - Yellow Hue', variableId: 'color_matrix_yellow_hue' },
						{ name: 'Picture - Color Matrix - Yellow Saturation', variableId: 'color_matrix_yellow_saturation' },
						{ name: 'Picture - Color Matrix - Yellow Value', variableId: 'color_matrix_yellow_value' },
						{ name: 'Picture - Color Matrix - Green Hue', variableId: 'color_matrix_green_hue' },
						{ name: 'Picture - Color Matrix - Green Saturation', variableId: 'color_matrix_green_saturation' },
						{ name: 'Picture - Color Matrix - Green Value', variableId: 'color_matrix_green_value' },
						{ name: 'Picture - Color Matrix - Cyan Hue', variableId: 'color_matrix_cyan_hue' },
						{ name: 'Picture - Color Matrix - Cyan Saturation', variableId: 'color_matrix_cyan_saturation' },
						{ name: 'Picture - Color Matrix - Cyan Value', variableId: 'color_matrix_cyan_value' },
						{ name: 'Picture - Color Matrix - Blue Hue', variableId: 'color_matrix_blue_hue' },
						{ name: 'Picture - Color Matrix - Blue Saturation', variableId: 'color_matrix_blue_saturation' },
						{ name: 'Picture - Color Matrix - Blue Value', variableId: 'color_matrix_blue_value' },
					]
				}

				return baseVariables
			})(),
		},
		{
			capabilities: ['GammaInfo'],
			variables: [
				{ name: 'Gamma - Level', variableId: 'gamma_level' },
				{ name: 'Gamma - Bright', variableId: 'gamma_bright' },
				{ name: 'Gamma - WDR', variableId: 'wdr' },
				{ name: 'Gamma - WDR Level', variableId: 'wdr_level' },
			],
		},
		{
			capabilities: ['WhiteBalanceInfo', 'WhiteBalance'],
			variables: [
				{ name: 'White Balance - Mode', variableId: 'wb_mode' },
				{ name: 'White Balance - Sensitivity', variableId: 'wb_sensitivity' },
				{ name: 'White Balance - Red Gain', variableId: 'wb_r_gain' },
				{ name: 'White Balance - Blue Gain', variableId: 'wb_b_gain' },
				{ name: 'White Balance - Red Tuning', variableId: 'wb_r_tuning' },
				{ name: 'White Balance - Green Tuning', variableId: 'wb_g_tuning' },
				{ name: 'White Balance - Blue Tuning', variableId: 'wb_b_tuning' },
				{ name: 'White Balance - Color Temperature', variableId: 'wb_color_temperature' },
			],
		},
		{
			capabilities: ['ExposureInfo', 'Exposure'],
			variables: [
				{ name: 'Exposure - Mode', variableId: 'exposure_mode' },
				{ name: 'Exposure - Gain', variableId: 'gain' },
				{ name: 'Exposure - Gain Limit', variableId: 'gain_limit' },
				{ name: 'Exposure - Compensation Level', variableId: 'ex_comp_level' },
				{ name: 'Exposure - Smart Exposure', variableId: 'smart_exposure' },
				{ name: 'Exposure - Shutter Speed', variableId: 'shutter_speed' },
				{ name: 'Exposure - Iris', variableId: 'iris' },
			],
		},
		{
			capabilities: ['PositionLimitations'],
			variables: [
				{ name: 'PTZ - Position Limit - Down', variableId: 'position_limit_down' },
				{ name: 'PTZ - Position Limit - Up', variableId: 'position_limit_up' },
				{ name: 'PTZ - Position Limit - Left', variableId: 'position_limit_left' },
				{ name: 'PTZ - Position Limit - Right', variableId: 'position_limit_right' },
			],
		},
		{
			capabilities: ['VideoOutputInfo.SystemFormat'],
			variables: [{ name: 'System - Video Format', variableId: 'system_format' }],
		},
		{
			capabilities: ['VideoOutputInfo.HDMIResolution'],
			variables: [{ name: 'System - HDMI Resolution', variableId: 'hdmi_resolution' }],
		},
		{
			capabilities: ['VideoOutputInfo.SDIResolution'],
			variables: [
				{ name: 'System - SDI Resolution', variableId: 'sdi_resolution' },
				{ name: 'System - SDI Bit Depth', variableId: 'sdi_bit_depth' },
				{ name: 'System - SDI Color Space', variableId: 'sdi_color_space' },
			],
		},
		{
			capabilities: ['PanTiltInfo', 'PTZFMoveInfo'],
			variables: [
				{ name: 'PTZ - Pan Direction', variableId: 'pan_direction' },
				{ name: 'PTZ - Tilt Direction', variableId: 'tilt_direction' },
			],
		},
		{
			capabilities: ['NetworkInfo'],
			variables: [
				{ name: 'Network - IP Address', variableId: 'ip_address' },
				{ name: 'Network - Subnet Mask', variableId: 'subnet_mask' },
				{ name: 'Network - MAC Address', variableId: 'mac_address' },
				{ name: 'Network - Gateway', variableId: 'gateway' },
				{ name: 'Network - Fallback IP Address', variableId: 'fallback_ip_address' },
			],
		},
		{
			capabilities: ['OSDSystemInfo'],
			variables: [
				{ name: 'System - Pelco ID', variableId: 'pelco_id' },
				{ name: 'System - VISCA ID', variableId: 'visca_id' },
				{ name: 'System - Tally Mode', variableId: 'tally_mode' },
			],
		},
		{
			capabilities: ['RTSPInfo'],
			variables: [
				{ name: 'Stream - RTSP Main Enable', variableId: 'rtsp_main_status' },
				{ name: 'Stream - RTSP Main Port', variableId: 'rtsp_main_port' },
				{ name: 'Stream - RTSP Main Stream Key', variableId: 'rtsp_main_stream_key' },
				{ name: 'Stream - RTSP Sub Enable', variableId: 'rtsp_sub_status' },
				{ name: 'Stream - RTSP Sub Port', variableId: 'rtsp_sub_port' },
				{ name: 'Stream - RTSP Sub Stream Key', variableId: 'rtsp_sub_stream_key' },
			],
		},
		{
			capabilities: ['RTMPInfo'],
			variables: [
				{ name: 'Stream - RTMP Main Enable', variableId: 'rtmp_main_status' },
				{ name: 'Stream - RTMP Main Port', variableId: 'rtmp_main_port' },
				{ name: 'Stream - RTMP Main Url', variableId: 'rtmp_main_url' },
				{ name: 'Stream - RTMP Main Stream Key', variableId: 'rtmp_main_stream_key' },
				{ name: 'Stream - RTMP Sub Enable', variableId: 'rtmp_sub_status' },
				{ name: 'Stream - RTMP Sub Port', variableId: 'rtmp_sub_port' },
				{ name: 'Stream - RTMP Sub Url', variableId: 'rtmp_sub_url' },
				{ name: 'Stream - RTMP Sub Stream Key', variableId: 'rtmp_sub_stream_key' },
			],
		},
		{
			capabilities: ['AVOverUDPInfo'],
			variables: [
				{ name: 'Stream - AV Over UDP Main Enable', variableId: 'av_over_udp_main_status' },
				{ name: 'Stream - AV Over UDP Main Address', variableId: 'av_over_udp_main_address' },
				{ name: 'Stream - AV Over UDP Main Port', variableId: 'av_over_udp_main_port' },
				{ name: 'Stream - AV Over UDP Sub Enable', variableId: 'av_over_udp_sub_status' },
				{ name: 'Stream - AV Over UDP Sub Address', variableId: 'av_over_udp_sub_address' },
				{ name: 'Stream - AV Over UDP Sub Port', variableId: 'av_over_udp_sub_port' },
			],
		},
		{
			capabilities: ['AVOverRTPInfo'],
			variables: [
				{ name: 'Stream - AV Over RTP Main Enable', variableId: 'av_over_rtp_main_status' },
				{ name: 'Stream - AV Over RTP Main Address', variableId: 'av_over_rtp_main_address' },
				{ name: 'Stream - AV Over RTP Main Port', variableId: 'av_over_rtp_main_port' },
				{ name: 'Stream - AV Over RTP Sub Enable', variableId: 'av_over_rtp_sub_status' },
				{ name: 'Stream - AV Over RTP Sub Address', variableId: 'av_over_rtp_sub_address' },
				{ name: 'Stream - AV Over RTP Sub Port', variableId: 'av_over_rtp_sub_port' },
			],
		},
		{
			capabilities: ['NDIInfo'],
			variables: [
				{ name: 'Stream - NDI Enable', variableId: 'ndi_status' },
				{ name: 'Stream - NDI Name', variableId: 'ndi_name' },
				{ name: 'Stream - NDI HX Bandwidth', variableId: 'ndi_hx_bandwidth' },
			],
		},
		{
			capabilities: ['SRTInfo'],
			variables: [
				{ name: 'Stream - SRT Main Enable', variableId: 'srt_main_status' },
				{ name: 'Stream - SRT Main Port', variableId: 'srt_main_port' },
				{ name: 'Stream - SRT Main Mode', variableId: 'srt_main_mode' },
				{ name: 'Stream - SRT Main IP Address', variableId: 'srt_main_ip_address' },
				{ name: 'Stream - SRT Main Stream ID', variableId: 'srt_main_stream_id' },
				{ name: 'Stream - SRT Main Latency', variableId: 'srt_main_latency' },
				{ name: 'Stream - SRT Main Overhead Bandwidth', variableId: 'srt_main_overhead_bandwidth' },
				{ name: 'Stream - SRT Sub Enable', variableId: 'srt_sub_status' },
				{ name: 'Stream - SRT Sub Port', variableId: 'srt_sub_port' },
				{ name: 'Stream - SRT Sub Mode', variableId: 'srt_sub_mode' },
				{ name: 'Stream - SRT Sub IP Address', variableId: 'srt_sub_ip_address' },
				{ name: 'Stream - SRT Sub Stream ID', variableId: 'srt_sub_stream_id' },
				{ name: 'Stream - SRT Sub Latency', variableId: 'srt_sub_latency' },
				{ name: 'Stream - SRT Sub Overhead Bandwidth', variableId: 'srt_sub_overhead_bandwidth' },
			],
		},
		{
			capabilities: ['AudioInfo'],
			variables: [
				{ name: 'Audio - Status', variableId: 'audio_status' },
				{ name: 'Audio - Bit Rate', variableId: 'audio_bit_rate' },
				{ name: 'Audio - Sampling Rate', variableId: 'audio_sampling_rate' },
				{ name: 'Audio - Volume', variableId: 'audio_volume' },
			],
		},
		{
			capabilities: ['EncodeInfo.LowLatency'],
			variables: [{ name: 'Encode - Low Latency', variableId: 'low_latency' }],
		},
		{
			capabilities: ['EncodeInfo'],
			variables: [
				{ name: 'Encode - Main Stream - Resolution', variableId: 'encode_main_resolution' },
				{ name: 'Encode - Main Stream - Frame Rate', variableId: 'encode_main_frame_rate' },
				{ name: 'Encode - Main Stream - Bitrate', variableId: 'encode_main_bitrate' },
				{ name: 'Encode - Sub Stream - Resolution', variableId: 'encode_sub_resolution' },
				{ name: 'Encode - Sub Stream - Frame Rate', variableId: 'encode_sub_frame_rate' },
				{ name: 'Encode - Sub Stream - Bitrate', variableId: 'encode_sub_bitrate' },
			],
		},
		{
			capabilities: ['TraceInfo'],
			variables: (() => {
				const variables: Array<{ name: string; variableId: string }> = []

				// Add name variables only for traces that exist
				const traceInfo = self.camera?.getState().traceInfo
				if (traceInfo) {
					for (const trace of traceInfo) {
						variables.push({
							name: `Trace - ${trace.Number} Name`,
							variableId: `trace_${trace.Number}_name`,
						})
					}
				}

				return variables
			})(),
		},
		{
			capabilities: ['ScanningInfo'],
			variables: (() => {
				const variables: Array<{ name: string; variableId: string }> = []

				// Add name variables only for scanning patterns that exist
				const scanningInfo = self.camera?.getState().scanningInfo
				if (scanningInfo) {
					for (const scanning of scanningInfo) {
						variables.push({
							name: `Scanning - ${scanning.Number} Name`,
							variableId: `scanning_${scanning.Number}_name`,
						})
					}
				}

				return variables
			})(),
		},
		{
			capabilities: ['CruiseInfo'],
			variables: (() => {
				const variables: Array<{ name: string; variableId: string }> = []

				// Add name variables only for cruises that exist
				const cruiseInfo = self.camera?.getState().cruiseInfo
				if (cruiseInfo) {
					for (const cruise of cruiseInfo) {
						variables.push({
							name: `Cruise - ${cruise.Number} Name`,
							variableId: `cruise_${cruise.Number}_name`,
						})
					}
				}

				return variables
			})(),
		},
		{
			capabilities: ['AutoRestartInfo'],
			variables: [
				{ name: 'Auto Restart - Next Restart', variableId: 'auto_restart_next' },
				{ name: 'Auto Restart - Frequency', variableId: 'auto_restart_frequency' },
				{ name: 'Auto Restart - Day', variableId: 'auto_restart_day' },
				{ name: 'Auto Restart - Hour', variableId: 'auto_restart_hour' },
				{ name: 'Auto Restart - Minute', variableId: 'auto_restart_minute' },
			],
		},
	]

	// Filter and collect variables based on capabilities
	for (const mapping of variableMappings) {
		if (!capabilitiesLoaded || mapping.capabilities.some((cap) => self.camera?.hasCapability(cap))) {
			// Handle function-based variables (for conditional variables like color matrix)
			if (typeof mapping.variables === 'function') {
				variables.push(...mapping.variables())
			} else {
				variables.push(...mapping.variables)
			}
		}
	}

	self.setVariableDefinitions(variables)
}

export function updateSpeedVariables(self: BolinModuleInstance): void {
	self.setVariableValues({
		pt_speed: self.ptSpeed,
		zoom_speed: self.zoomSpeed,
	})
}

export function UpdateVariablesOnStateChange(
	self: BolinModuleInstance,
	currentState: CameraState,
	previousState: CameraState | null,
): CameraState {
	const variables: Record<string, number | string | boolean> = {}
	// Update PTZ position variables if changed
	if (currentState.ptzPosition) {
		updateIfChanged(
			variables,
			previousState?.ptzPosition,
			currentState.ptzPosition,
			(p) => p.PanPosition,
			'pan_position',
		)
		updateIfChanged(
			variables,
			previousState?.ptzPosition,
			currentState.ptzPosition,
			(p) => p.TiltPosition,
			'tilt_position',
		)
		updateIfChanged(
			variables,
			previousState?.ptzPosition,
			currentState.ptzPosition,
			(p) => p.ZoomPosition,
			'zoom_position',
		)
	}

	// Update preset speed variables if changed
	if (currentState.presetSpeed) {
		updateIfChanged(
			variables,
			previousState?.presetSpeed,
			currentState.presetSpeed,
			(p) => p.PresetZoomSpeed,
			'preset_zoom_speed',
		)
		updateIfChanged(
			variables,
			previousState?.presetSpeed,
			currentState.presetSpeed,
			(p) => p.PresetSpeed,
			'preset_speed',
		)
	}

	// Update system info variables if changed
	if (currentState.systemInfo) {
		updateIfChanged(variables, previousState?.systemInfo, currentState.systemInfo, (s) => s.DeviceName, 'device_name')
		updateIfChanged(variables, previousState?.systemInfo, currentState.systemInfo, (s) => s.ModelName, 'model_name')
	}

	// Update lens info variables if changed
	if (currentState.lensInfo) {
		updateIfChanged(variables, previousState?.lensInfo, currentState.lensInfo, (l) => l.FocusMode, 'focus_mode')
		updateIfChanged(variables, previousState?.lensInfo, currentState.lensInfo, (l) => l.FocusArea, 'focus_area')
		updateIfChanged(variables, previousState?.lensInfo, currentState.lensInfo, (l) => l.NearLimit, 'near_limit')
		updateIfChanged(variables, previousState?.lensInfo, currentState.lensInfo, (l) => l.AFSensitivity, 'af_sensitivity')
		updateIfChanged(
			variables,
			previousState?.lensInfo,
			currentState.lensInfo,
			(l) => (l.SmartFocus ? 'On' : 'Off'),
			'smart_focus',
		)
		updateIfChanged(
			variables,
			previousState?.lensInfo,
			currentState.lensInfo,
			(l) => (l.DigitalZoom ? 'On' : 'Off'),
			'digital_zoom',
		)
		updateIfChanged(
			variables,
			previousState?.lensInfo,
			currentState.lensInfo,
			(l) => (l.ZoomRatioOSD ? 'On' : 'Off'),
			'zoom_ratio_osd',
		)
		updateIfChanged(variables, previousState?.lensInfo, currentState.lensInfo, (l) => l.MFSpeed, 'mf_speed')
	}

	// Update picture info variables if changed
	const basePictureFields: Array<{
		getValue: (p: PictureInfo) => unknown
		variableId: string
		defaultValue?: number | string | boolean
	}> = [
		{ getValue: (p: PictureInfo) => p['2DNR'], variableId: '2dnr' },
		{ getValue: (p: PictureInfo) => p['3DNR'], variableId: '3dnr' },
		{ getValue: (p: PictureInfo) => p.Sharpness, variableId: 'sharpness' },
		{ getValue: (p: PictureInfo) => p.Contrast, variableId: 'contrast' },
		{ getValue: (p: PictureInfo) => p.Saturation, variableId: 'saturation' },
		{ getValue: (p: PictureInfo) => p.Hue, variableId: 'hue' },
		{ getValue: (p: PictureInfo) => p.DeFlicker, variableId: 'deflicker' },
		{ getValue: (p: PictureInfo) => p.Scene, variableId: 'scene' },
		{ getValue: (p: PictureInfo) => p.DefogMode, variableId: 'defog_mode' },
		{ getValue: (p: PictureInfo) => p.DefogLevel, variableId: 'defog_level' },
		{ getValue: (p: PictureInfo) => p.Effect, variableId: 'effect' },
		{ getValue: (p: PictureInfo) => (p.Flip ? 'On' : 'Off'), variableId: 'flip' },
		{ getValue: (p: PictureInfo) => (p.Mirror ? 'On' : 'Off'), variableId: 'mirror' },
		{ getValue: (p: PictureInfo) => (p.HLCMode ? 'On' : 'Off'), variableId: 'hlc_mode' },
		{ getValue: (p: PictureInfo) => (p.BLC || p.BacklightCom ? 'On' : 'Off'), variableId: 'blc' },
	]

	// Check if camera has color matrix capabilities
	const capabilitiesLoaded = self.camera?.getStoredCameraCapabilities() !== null
	const hasColorMatrixCapability =
		!capabilitiesLoaded ||
		self.camera?.hasCapability('MagentaHue') ||
		self.camera?.hasCapability('RedHue') ||
		self.camera?.hasCapability('PictureInfo.MagentaHue') ||
		self.camera?.hasCapability('PictureInfo.RedHue')

	const pictureFields = hasColorMatrixCapability
		? [
				...basePictureFields,
				{ getValue: (p: PictureInfo) => p.MagentaHue ?? 0, variableId: 'color_matrix_magenta_hue', defaultValue: 0 },
				{
					getValue: (p: PictureInfo) => p.MagentaSaturation ?? 0,
					variableId: 'color_matrix_magenta_saturation',
					defaultValue: 0,
				},
				{
					getValue: (p: PictureInfo) => p.MagentaValue ?? 0,
					variableId: 'color_matrix_magenta_value',
					defaultValue: 0,
				},
				{ getValue: (p: PictureInfo) => p.RedHue ?? 0, variableId: 'color_matrix_red_hue', defaultValue: 0 },
				{
					getValue: (p: PictureInfo) => p.RedSaturation ?? 0,
					variableId: 'color_matrix_red_saturation',
					defaultValue: 0,
				},
				{ getValue: (p: PictureInfo) => p.RedValue ?? 0, variableId: 'color_matrix_red_value', defaultValue: 0 },
				{ getValue: (p: PictureInfo) => p.YellowHue ?? 0, variableId: 'color_matrix_yellow_hue', defaultValue: 0 },
				{
					getValue: (p: PictureInfo) => p.YellowSaturation ?? 0,
					variableId: 'color_matrix_yellow_saturation',
					defaultValue: 0,
				},
				{ getValue: (p: PictureInfo) => p.YellowValue ?? 0, variableId: 'color_matrix_yellow_value', defaultValue: 0 },
				{ getValue: (p: PictureInfo) => p.GreenHue ?? 0, variableId: 'color_matrix_green_hue', defaultValue: 0 },
				{
					getValue: (p: PictureInfo) => p.GreenSaturation ?? 0,
					variableId: 'color_matrix_green_saturation',
					defaultValue: 0,
				},
				{ getValue: (p: PictureInfo) => p.GreenValue ?? 0, variableId: 'color_matrix_green_value', defaultValue: 0 },
				{ getValue: (p: PictureInfo) => p.CyanHue ?? 0, variableId: 'color_matrix_cyan_hue', defaultValue: 0 },
				{
					getValue: (p: PictureInfo) => p.CyanSaturation ?? 0,
					variableId: 'color_matrix_cyan_saturation',
					defaultValue: 0,
				},
				{ getValue: (p: PictureInfo) => p.CyanValue ?? 0, variableId: 'color_matrix_cyan_value', defaultValue: 0 },
				{ getValue: (p: PictureInfo) => p.BlueHue ?? 0, variableId: 'color_matrix_blue_hue', defaultValue: 0 },
				{
					getValue: (p: PictureInfo) => p.BlueSaturation ?? 0,
					variableId: 'color_matrix_blue_saturation',
					defaultValue: 0,
				},
				{ getValue: (p: PictureInfo) => p.BlueValue ?? 0, variableId: 'color_matrix_blue_value', defaultValue: 0 },
			]
		: basePictureFields

	updateFields(variables, previousState?.pictureInfo, currentState.pictureInfo, pictureFields)

	// Update gamma info variables if changed
	updateFields(variables, previousState?.gammaInfo, currentState.gammaInfo, [
		{ getValue: (g) => g?.Level, variableId: 'gamma_level' },
		{ getValue: (g) => g.Bright, variableId: 'gamma_bright' },
		{ getValue: (g) => (g.WDR ? 'On' : 'Off'), variableId: 'wdr' },
		{ getValue: (g) => g.WDRLevel, variableId: 'wdr_level' },
	])

	// Update white balance info variables if changed
	updateFields(variables, previousState?.whiteBalanceInfo, currentState.whiteBalanceInfo, [
		{ getValue: (w) => w.Mode || '', variableId: 'wb_mode', defaultValue: '' },
		{ getValue: (w) => w.WBSensitivity, variableId: 'wb_sensitivity' },
		{ getValue: (w) => w.RGain, variableId: 'wb_r_gain' },
		{ getValue: (w) => w.BGain, variableId: 'wb_b_gain' },
		{ getValue: (w) => w.RTuning, variableId: 'wb_r_tuning' },
		{ getValue: (w) => w.GTuning, variableId: 'wb_g_tuning' },
		{ getValue: (w) => w.BTuning, variableId: 'wb_b_tuning' },
		{ getValue: (w) => w.ColorTemperature, variableId: 'wb_color_temperature' },
	])

	// Update exposure info variables if changed
	if (currentState.exposureInfo) {
		updateFields(variables, previousState?.exposureInfo, currentState.exposureInfo, [
			{ getValue: (e) => e.Mode, variableId: 'exposure_mode' },
			{ getValue: (e) => e.Gain, variableId: 'gain' },
			{ getValue: (e) => e.GainLimit, variableId: 'gain_limit' },
			{ getValue: (e) => e.ExCompLevel, variableId: 'ex_comp_level' },
			{ getValue: (e) => (e.SmartExposure ? 'On' : 'Off'), variableId: 'smart_exposure' },
			{ getValue: (e) => e.ShutterSpeed, variableId: 'shutter_speed' },
		])
		// Special handling for Iris (needs map lookup or range conversion)
		if (!previousState?.exposureInfo || previousState.exposureInfo.Iris !== currentState.exposureInfo.Iris) {
			const irisMap = self.camera?.getIrisMapForActions() ?? {}
			const irisRange = self.camera?.getIrisRangeForActions()
			const irisValue = currentState.exposureInfo.Iris

			if (irisValue !== undefined) {
				// First try the map (for enum types)
				if (irisMap[irisValue]) {
					variables.iris = irisMap[irisValue]
				} else if (irisRange) {
					// If it's a range type, convert to F-stop
					variables.iris = convertIrisValueToFStop(irisValue)
				} else {
					// Fallback to numeric string
					variables.iris = irisValue.toString()
				}
			} else {
				variables.iris = ''
			}
		}
	}

	// Update position limitations variables if changed
	updateFields(variables, previousState?.positionLimitations, currentState.positionLimitations, [
		{ getValue: (p) => (p.DownLimit ? 'Locked' : 'Unlocked'), variableId: 'position_limit_down' },
		{ getValue: (p) => (p.UpLimit ? 'Locked' : 'Unlocked'), variableId: 'position_limit_up' },
		{ getValue: (p) => (p.LeftLimit ? 'Locked' : 'Unlocked'), variableId: 'position_limit_left' },
		{ getValue: (p) => (p.RightLimit ? 'Locked' : 'Unlocked'), variableId: 'position_limit_right' },
	])

	// Update video output info variables if changed
	if (currentState.videoOutputInfo) {
		updateFields(variables, previousState?.videoOutputInfo, currentState.videoOutputInfo, [
			{ getValue: (v) => v.SystemFormat ?? '', variableId: 'system_format', defaultValue: '' },
			{ getValue: (v) => v.HDMIResolution ?? '', variableId: 'hdmi_resolution', defaultValue: '' },
			{ getValue: (v) => v.SDIResolution, variableId: 'sdi_resolution' },
			{ getValue: (v) => v.SDIBitDepth, variableId: 'sdi_bit_depth' },
			{ getValue: (v) => v.SDIColorSpace, variableId: 'sdi_color_space' },
		])
		if (variables.system_format === undefined) {
			variables.system_format = currentState.videoOutputInfo.SystemFormat ?? ''
		}
	}

	// Update pan/tilt info variables if changed
	if (currentState.panTiltInfo) {
		if (
			!previousState?.panTiltInfo ||
			previousState.panTiltInfo.PanDirection !== currentState.panTiltInfo.PanDirection
		) {
			variables.pan_direction = currentState.panTiltInfo.PanDirection === 1 ? 'Inverted' : 'Normal'
		}
		if (
			!previousState?.panTiltInfo ||
			previousState.panTiltInfo.TiltDirection !== currentState.panTiltInfo.TiltDirection
		) {
			variables.tilt_direction = currentState.panTiltInfo.TiltDirection === 1 ? 'Inverted' : 'Normal'
		}
	}

	// Update overlay info variables if changed

	if (currentState.overlayInfo) {
		for (let i = 1; i <= 8; i++) {
			const currentOverlay = currentState.overlayInfo[i - 1]
			if (!currentOverlay) continue

			if (
				!previousState?.overlayInfo ||
				!previousState.overlayInfo[i - 1] ||
				previousState.overlayInfo[i - 1].Enable !== currentOverlay.Enable
			) {
				variables[`overlay_${i}_status`] = currentOverlay.Enable ? 'On' : 'Off'
			}
		}
	}

	// Update network info variables if changed
	if (currentState.networkInfo) {
		updateFields(variables, previousState?.networkInfo, currentState.networkInfo, [
			{ getValue: (n) => n.NetworkInfo?.IPAddress ?? '', variableId: 'ip_address', defaultValue: '' },
			{ getValue: (n) => n.NetworkInfo?.SubnetMask ?? '', variableId: 'subnet_mask', defaultValue: '' },
			{ getValue: (n) => n.NetworkInfo?.NetMAC ?? '', variableId: 'mac_address', defaultValue: '' },
			{ getValue: (n) => n.NetworkInfo?.Gateway ?? '', variableId: 'gateway', defaultValue: '' },
			{ getValue: (n) => n.Fallback?.IPAddress ?? '', variableId: 'fallback_ip_address', defaultValue: '' },
		])
	}

	// Update OSD system info variables if changed
	if (currentState.osdSystemInfo) {
		updateFields(variables, previousState?.osdSystemInfo, currentState.osdSystemInfo, [
			{ getValue: (o) => o.PelcoID, variableId: 'pelco_id' },
			{ getValue: (o) => o.VISCAID, variableId: 'visca_id' },
			{ getValue: (o) => (o.TallyMode ? 'On' : 'Off'), variableId: 'tally_mode' },
		])
	}

	// Update RTSP stream variables if changed
	if (currentState.rtspInfo) {
		for (const stream of currentState.rtspInfo) {
			const channelPrefix = stream.Channel === 0 ? 'rtsp_main' : 'rtsp_sub'
			const previousStream = previousState?.rtspInfo?.find((s) => s.Channel === stream.Channel)

			if (!previousStream || previousStream.Enable !== stream.Enable) {
				variables[`${channelPrefix}_status`] = stream.Enable ? 'On' : 'Off'
			}
			if (!previousStream || previousStream.Port !== stream.Port) {
				variables[`${channelPrefix}_port`] = stream.Port
			}
			if (!previousStream || previousStream.StreamKey !== stream.StreamKey) {
				variables[`${channelPrefix}_stream_key`] = stream.StreamKey ?? ''
			}
		}
	}

	// Update RTMP stream variables if changed
	if (currentState.rtmpInfo) {
		for (const stream of currentState.rtmpInfo) {
			const channelPrefix = stream.Channel === 0 ? 'rtmp_main' : 'rtmp_sub'
			const previousStream = previousState?.rtmpInfo?.find((s) => s.Channel === stream.Channel)

			if (!previousStream || previousStream.Enable !== stream.Enable) {
				variables[`${channelPrefix}_status`] = stream.Enable ? 'On' : 'Off'
			}
			if (!previousStream || previousStream.Port !== stream.Port) {
				variables[`${channelPrefix}_port`] = stream.Port
			}
			if (!previousStream || previousStream.Url !== stream.Url) {
				variables[`${channelPrefix}_url`] = stream.Url ?? ''
			}
			if (!previousStream || previousStream.StreamKey !== stream.StreamKey) {
				variables[`${channelPrefix}_stream_key`] = stream.StreamKey ?? ''
			}
		}
	}

	// Update AV over UDP stream variables if changed
	if (currentState.avOverUDPInfo) {
		for (const stream of currentState.avOverUDPInfo) {
			const channelPrefix = stream.Channel === 0 ? 'av_over_udp_main' : 'av_over_udp_sub'
			const previousStream = previousState?.avOverUDPInfo?.find((s) => s.Channel === stream.Channel)

			if (!previousStream || previousStream.Enable !== stream.Enable) {
				variables[`${channelPrefix}_status`] = stream.Enable ? 'On' : 'Off'
			}
			if (!previousStream || previousStream.Address !== stream.Address) {
				variables[`${channelPrefix}_address`] = stream.Address ?? ''
			}
			if (!previousStream || previousStream.Port !== stream.Port) {
				variables[`${channelPrefix}_port`] = stream.Port
			}
		}
	}

	// Update AV over RTP stream variables if changed
	if (currentState.avOverRTPInfo) {
		for (const stream of currentState.avOverRTPInfo) {
			const channelPrefix = stream.Channel === 0 ? 'av_over_rtp_main' : 'av_over_rtp_sub'
			const previousStream = previousState?.avOverRTPInfo?.find((s) => s.Channel === stream.Channel)

			if (!previousStream || previousStream.Enable !== stream.Enable) {
				variables[`${channelPrefix}_status`] = stream.Enable ? 'On' : 'Off'
			}
			if (!previousStream || previousStream.Address !== stream.Address) {
				variables[`${channelPrefix}_address`] = stream.Address ?? ''
			}
			if (!previousStream || previousStream.Port !== stream.Port) {
				variables[`${channelPrefix}_port`] = stream.Port
			}
		}
	}

	// Update NDI stream variables if changed
	if (currentState.ndiInfo) {
		updateFields(variables, previousState?.ndiInfo, currentState.ndiInfo, [
			{ getValue: (n) => (n.NDIEnable ? 'On' : 'Off'), variableId: 'ndi_status' },
			{ getValue: (n) => n.NDIName ?? '', variableId: 'ndi_name', defaultValue: '' },
			{ getValue: (n) => n.NDIHXBandwidth, variableId: 'ndi_hx_bandwidth' },
		])
	}

	// Update SRT stream variables if changed
	if (currentState.srtInfo) {
		for (const stream of currentState.srtInfo) {
			const channelPrefix = stream.Channel === 0 ? 'srt_main' : 'srt_sub'
			const previousStream = previousState?.srtInfo?.find((s) => s.Channel === stream.Channel)

			if (!previousStream || previousStream.Enable !== stream.Enable) {
				variables[`${channelPrefix}_status`] = stream.Enable ? 'On' : 'Off'
			}
			if (!previousStream || previousStream.Port !== stream.Port) {
				variables[`${channelPrefix}_port`] = stream.Port
			}
			if (!previousStream || previousStream.Mode !== stream.Mode) {
				variables[`${channelPrefix}_mode`] = stream.Mode === 1 || stream.Mode === 2 ? 'Caller' : 'Listener'
			}
			if (!previousStream || previousStream.IPAddress !== stream.IPAddress) {
				variables[`${channelPrefix}_ip_address`] = stream.IPAddress ?? ''
			}
			if (!previousStream || previousStream.StreamID !== stream.StreamID) {
				variables[`${channelPrefix}_stream_id`] = stream.StreamID ?? ''
			}
			if (!previousStream || previousStream.Latency !== stream.Latency) {
				variables[`${channelPrefix}_latency`] = stream.Latency
			}
			if (!previousStream || previousStream.OverheadBandwidth !== stream.OverheadBandwidth) {
				variables[`${channelPrefix}_overhead_bandwidth`] = stream.OverheadBandwidth
			}
		}
	}

	// Update audio info variables if changed
	if (currentState.audioInfo) {
		const previousAudio = previousState?.audioInfo
		const currentAudio = currentState.audioInfo

		// Enable
		if (!previousAudio || previousAudio.Enable !== currentAudio.Enable) {
			variables.audio_status = currentAudio.Enable ? 'On' : 'Off'
		}

		// BitRate - map numeric values to strings
		if (!previousAudio || previousAudio.BitRate !== currentAudio.BitRate) {
			const bitRateMap: Record<number, string> = {
				48000: '48K',
				64000: '64K',
				96000: '96K',
				128000: '128K',
			}
			variables.audio_bit_rate = bitRateMap[currentAudio.BitRate] ?? currentAudio.BitRate.toString()
		}

		// SamplingRate - map numeric values to strings
		if (!previousAudio || previousAudio.SamplingRate !== currentAudio.SamplingRate) {
			const samplingRateMap: Record<number, string> = {
				44100: '44.1KHz',
				48000: '48KHz',
			}
			variables.audio_sampling_rate = samplingRateMap[currentAudio.SamplingRate] ?? currentAudio.SamplingRate.toString()
		}

		// Volume
		if (!previousAudio || previousAudio.Volume !== currentAudio.Volume) {
			variables.audio_volume = currentAudio.Volume
		}
	}

	// Update encode info variables if changed
	if (currentState.encodeInfo) {
		// Low Latency
		updateIfChanged(
			variables,
			previousState?.encodeInfo,
			currentState.encodeInfo,
			(e) => (e.LowLatency?.Enable ? 'On' : 'Off'),
			'low_latency',
		)

		// EncodeInfo array - find main stream (channel 0) and sub stream (channel 1)
		const mainStream = currentState.encodeInfo.EncodeInfo?.find((e) => e.Channel === 0)
		const subStream = currentState.encodeInfo.EncodeInfo?.find((e) => e.Channel === 1)
		const previousMainStream = previousState?.encodeInfo?.EncodeInfo?.find((e) => e.Channel === 0)
		const previousSubStream = previousState?.encodeInfo?.EncodeInfo?.find((e) => e.Channel === 1)

		// Main stream variables
		if (mainStream) {
			if (!previousMainStream || previousMainStream.Resolution !== mainStream.Resolution) {
				variables.encode_main_resolution = mainStream.Resolution ?? ''
			}
			if (!previousMainStream || previousMainStream.FrameRate !== mainStream.FrameRate) {
				variables.encode_main_frame_rate = mainStream.FrameRate ?? 0
			}
			if (!previousMainStream || previousMainStream.BitRate !== mainStream.BitRate) {
				variables.encode_main_bitrate = mainStream.BitRate ?? 0
			}
		}

		// Sub stream variables
		if (subStream) {
			if (!previousSubStream || previousSubStream.Resolution !== subStream.Resolution) {
				variables.encode_sub_resolution = subStream.Resolution ?? ''
			}
			if (!previousSubStream || previousSubStream.FrameRate !== subStream.FrameRate) {
				variables.encode_sub_frame_rate = subStream.FrameRate ?? 0
			}
			if (!previousSubStream || previousSubStream.BitRate !== subStream.BitRate) {
				variables.encode_sub_bitrate = subStream.BitRate ?? 0
			}
		}
	}

	// Update trace info variables if changed
	if (currentState.traceInfo) {
		const previousTraceInfo = previousState?.traceInfo
		if (!previousTraceInfo || !deepEqual(previousTraceInfo, currentState.traceInfo)) {
			// Update trace names only for existing traces
			for (const trace of currentState.traceInfo) {
				variables[`trace_${trace.Number}_name`] = trace.Name
			}
		}
	}

	// Update scanning info variables if changed
	if (currentState.scanningInfo) {
		const previousScanningInfo = previousState?.scanningInfo
		if (!previousScanningInfo || !deepEqual(previousScanningInfo, currentState.scanningInfo)) {
			// Update scanning names only for existing scanning patterns
			for (const scanning of currentState.scanningInfo) {
				variables[`scanning_${scanning.Number}_name`] = scanning.Name
			}
		}
	}

	// Update cruise info variables if changed
	if (currentState.cruiseInfo) {
		const previousCruiseInfo = previousState?.cruiseInfo
		if (!previousCruiseInfo || !deepEqual(previousCruiseInfo, currentState.cruiseInfo)) {
			// Update cruise names only for existing cruises
			for (const cruise of currentState.cruiseInfo) {
				variables[`cruise_${cruise.Number}_name`] = cruise.Name
			}
		}
	}

	// Update auto restart info variables if changed
	if (currentState.autoRestartInfo) {
		const previousAutoRestartInfo = previousState?.autoRestartInfo
		if (
			!previousAutoRestartInfo ||
			JSON.stringify(previousAutoRestartInfo) !== JSON.stringify(currentState.autoRestartInfo)
		) {
			const autoRestart = currentState.autoRestartInfo

			// Set basic variables
			const typeNames: Record<number, string> = {
				0: 'Never',
				1: 'Every Day',
				2: 'Every Week',
				3: 'Every Month',
			}
			variables.auto_restart_frequency = typeNames[autoRestart.Type] ?? `Unknown (${autoRestart.Type})`
			variables.auto_restart_next = calculateNextAutoRestartTime(
				autoRestart.Type,
				autoRestart.Day,
				autoRestart.Hour,
				autoRestart.Minute,
			)
			variables.auto_restart_day = autoRestart.Day.toString()
			variables.auto_restart_hour = autoRestart.Hour.toString()
			variables.auto_restart_minute = autoRestart.Minute.toString()
		}
	}

	// Only update variables if something changed
	if (Object.keys(variables).length > 0) {
		self.setVariableValues(variables)
	}

	// Store current state as previous for next comparison
	return { ...currentState }
}
