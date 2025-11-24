import type { ModuleInstance } from './main.js'
import type { CameraState } from './types.js'

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

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const variables: { name: string; variableId: string }[] = []

	// Only check capabilities if they've been loaded, otherwise define all variables
	const capabilitiesLoaded = self.camera?.getStoredCameraCapabilities() !== null

	// Mapping of capability names to their corresponding variable definitions
	const variableMappings: Array<{
		capabilities: string[]
		variables: Array<{ name: string; variableId: string }>
	}> = [
		{
			capabilities: ['OverlayInfo'],
			variables: Array.from({ length: 8 }, (_, i) => ({
				name: `Overlay ${i + 1} Enabled`,
				variableId: `overlay_${i + 1}_enabled`,
			})),
		},
		{
			capabilities: ['PTZFPosition'],
			variables: [
				{ name: 'Pan Position', variableId: 'pan_position' },
				{ name: 'Tilt Position', variableId: 'tilt_position' },
				{ name: 'Zoom Position', variableId: 'zoom_position' },
			],
		},
		{
			capabilities: ['SystemInfo'],
			variables: [
				{ name: 'Device Name', variableId: 'device_name' },
				{ name: 'Model Name', variableId: 'model_name' },
			],
		},
		{
			capabilities: ['LensInfo', 'Lens'],
			variables: [
				{ name: 'Focus Mode', variableId: 'focus_mode' },
				{ name: 'Focus Area', variableId: 'focus_area' },
				{ name: 'Near Limit', variableId: 'near_limit' },
				{ name: 'AF Sensitivity', variableId: 'af_sensitivity' },
				{ name: 'Smart Focus', variableId: 'smart_focus' },
				{ name: 'Digital Zoom', variableId: 'digital_zoom' },
				{ name: 'Zoom Ratio OSD', variableId: 'zoom_ratio_osd' },
				{ name: 'MF Speed', variableId: 'mf_speed' },
			],
		},
		{
			capabilities: ['PTZFPresetSpeed', 'PresetSpeed'],
			variables: [
				{ name: 'Preset Zoom Speed', variableId: 'preset_zoom_speed' },
				{ name: 'Preset Speed', variableId: 'preset_speed' },
			],
		},
		{
			capabilities: ['PictureInfo', 'Picture'],
			variables: [
				{ name: '2DNR', variableId: '2dnr' },
				{ name: '3DNR', variableId: '3dnr' },
				{ name: 'Sharpness', variableId: 'sharpness' },
				{ name: 'Contrast', variableId: 'contrast' },
				{ name: 'Saturation', variableId: 'saturation' },
				{ name: 'Hue', variableId: 'hue' },
				{ name: 'DeFlicker', variableId: 'deflicker' },
				{ name: 'Scene', variableId: 'scene' },
				{ name: 'Defog Mode', variableId: 'defog_mode' },
				{ name: 'Defog Level', variableId: 'defog_level' },
				{ name: 'Effect', variableId: 'effect' },
				{ name: 'Flip', variableId: 'flip' },
				{ name: 'Mirror', variableId: 'mirror' },
				{ name: 'HLC Mode', variableId: 'hlc_mode' },
				{ name: 'BLC', variableId: 'blc' },
			],
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
				{ name: 'Exposure Mode', variableId: 'exposure_mode' },
				{ name: 'Gain', variableId: 'gain' },
				{ name: 'Gain Limit', variableId: 'gain_limit' },
				{ name: 'Exposure Compensation Level', variableId: 'ex_comp_level' },
				{ name: 'Smart Exposure', variableId: 'smart_exposure' },
				{ name: 'Shutter Speed', variableId: 'shutter_speed' },
				{ name: 'Iris', variableId: 'iris' },
			],
		},
		{
			capabilities: ['PositionLimitations'],
			variables: [
				{ name: 'Position Limit - Down', variableId: 'position_limit_down' },
				{ name: 'Position Limit - Up', variableId: 'position_limit_up' },
				{ name: 'Position Limit - Left', variableId: 'position_limit_left' },
				{ name: 'Position Limit - Right', variableId: 'position_limit_right' },
			],
		},
		{
			capabilities: ['VideoOutputInfo'],
			variables: [{ name: 'System Format', variableId: 'system_format' }],
		},
		{
			capabilities: ['VideoOutputInfo.HDMIResolution'],
			variables: [
				{ name: 'HDMI Resolution', variableId: 'hdmi_resolution' },
				{ name: 'HDMI Color Space', variableId: 'hdmi_color_space' },
				{ name: 'HDMI Bit Depth', variableId: 'hdmi_bit_depth' },
			],
		},
		{
			capabilities: ['VideoOutputInfo.SDIResolution'],
			variables: [
				{ name: 'SDI Resolution', variableId: 'sdi_resolution' },
				{ name: 'SDI Bit Depth', variableId: 'sdi_bit_depth' },
				{ name: 'SDI Color Space', variableId: 'sdi_color_space' },
			],
		},
		{
			capabilities: ['PanTiltInfo'],
			variables: [
				{ name: 'Pan Direction', variableId: 'pan_direction' },
				{ name: 'Tilt Direction', variableId: 'tilt_direction' },
			],
		},
	]

	// Filter and collect variables based on capabilities
	for (const mapping of variableMappings) {
		if (!capabilitiesLoaded || mapping.capabilities.some((cap) => self.camera?.hasCapability(cap))) {
			variables.push(...mapping.variables)
		}
	}

	self.setVariableDefinitions(variables)
}

export function UpdateVariablesOnStateChange(
	self: ModuleInstance,
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
		if (variables.device_name === undefined) {
			variables.device_name = ''
		}
		updateIfChanged(variables, previousState?.systemInfo, currentState.systemInfo, (s) => s.ModelName, 'model_name')
		if (variables.model_name === undefined) {
			variables.model_name = ''
		}
	}

	// Update lens info variables if changed
	if (currentState.lensInfo) {
		updateIfChanged(variables, previousState?.lensInfo, currentState.lensInfo, (l) => l.FocusMode, 'focus_mode')
		updateIfChanged(variables, previousState?.lensInfo, currentState.lensInfo, (l) => l.FocusArea, 'focus_area')
		updateIfChanged(variables, previousState?.lensInfo, currentState.lensInfo, (l) => l.NearLimit, 'near_limit')
		updateIfChanged(variables, previousState?.lensInfo, currentState.lensInfo, (l) => l.AFSensitivity, 'af_sensitivity')
		updateIfChanged(variables, previousState?.lensInfo, currentState.lensInfo, (l) => l.SmartFocus, 'smart_focus')
		updateIfChanged(variables, previousState?.lensInfo, currentState.lensInfo, (l) => l.DigitalZoom, 'digital_zoom')
		updateIfChanged(variables, previousState?.lensInfo, currentState.lensInfo, (l) => l.ZoomRatioOSD, 'zoom_ratio_osd')
		updateIfChanged(variables, previousState?.lensInfo, currentState.lensInfo, (l) => l.MFSpeed, 'mf_speed')
	}

	// Update picture info variables if changed
	updateFields(variables, previousState?.pictureInfo, currentState.pictureInfo, [
		{ getValue: (p) => p['2DNR'], variableId: '2dnr' },
		{ getValue: (p) => p['3DNR'], variableId: '3dnr' },
		{ getValue: (p) => p.Sharpness, variableId: 'sharpness' },
		{ getValue: (p) => p.Contrast, variableId: 'contrast' },
		{ getValue: (p) => p.Saturation, variableId: 'saturation' },
		{ getValue: (p) => p.Hue, variableId: 'hue' },
		{ getValue: (p) => p.DeFlicker, variableId: 'deflicker' },
		{ getValue: (p) => p.Scene, variableId: 'scene' },
		{ getValue: (p) => p.DefogMode, variableId: 'defog_mode' },
		{ getValue: (p) => p.DefogLevel, variableId: 'defog_level' },
		{ getValue: (p) => p.Effect, variableId: 'effect' },
		{ getValue: (p) => p.Flip, variableId: 'flip' },
		{ getValue: (p) => p.Mirror, variableId: 'mirror' },
		{ getValue: (p) => p.HLCMode, variableId: 'hlc_mode' },
		{ getValue: (p) => p.BLC, variableId: 'blc' },
	])

	// Update gamma info variables if changed
	updateFields(variables, previousState?.gammaInfo, currentState.gammaInfo, [
		{ getValue: (g) => g?.Level, variableId: 'gamma_level' },
		{ getValue: (g) => g.Bright, variableId: 'gamma_bright' },
		{ getValue: (g) => g.WDR, variableId: 'wdr' },
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
			{ getValue: (e) => e.SmartExposure, variableId: 'smart_exposure' },
			{ getValue: (e) => e.ShutterSpeed, variableId: 'shutter_speed' },
		])
		// Special handling for Iris (needs map lookup)
		if (!previousState?.exposureInfo || previousState.exposureInfo.Iris !== currentState.exposureInfo.Iris) {
			const irisMap = self.camera?.getIrisMapForActions() ?? {}
			const irisValue = currentState.exposureInfo.Iris
			variables.iris = irisMap[irisValue] ?? (irisValue !== undefined ? irisValue.toString() : '')
		}
	}

	// Update position limitations variables if changed
	updateFields(variables, previousState?.positionLimitations, currentState.positionLimitations, [
		{ getValue: (p) => p.DownLimit, variableId: 'position_limit_down' },
		{ getValue: (p) => p.UpLimit, variableId: 'position_limit_up' },
		{ getValue: (p) => p.LeftLimit, variableId: 'position_limit_left' },
		{ getValue: (p) => p.RightLimit, variableId: 'position_limit_right' },
	])

	// Update video output info variables if changed
	updateFields(variables, previousState?.videoOutputInfo, currentState.videoOutputInfo, [
		{ getValue: (v) => v.SystemFormat ?? '', variableId: 'system_format', defaultValue: '' },
		{ getValue: (v) => v.HDMIResolution ?? '', variableId: 'hdmi_resolution', defaultValue: '' },
		{ getValue: (v) => v.HDMIColorSpace, variableId: 'hdmi_color_space' },
		{ getValue: (v) => v.HDMIBitDepth, variableId: 'hdmi_bit_depth' },
		{ getValue: (v) => v.SDIResolution, variableId: 'sdi_resolution' },
		{ getValue: (v) => v.SDIBitDepth, variableId: 'sdi_bit_depth' },
		{ getValue: (v) => v.SDIColorSpace, variableId: 'sdi_color_space' },
	])

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
				variables[`overlay_${i}_enabled`] = currentOverlay.Enable
			}
		}
	}

	// Only update variables if something changed
	if (Object.keys(variables).length > 0) {
		self.setVariableValues(variables)
	}

	// Store current state as previous for next comparison
	return { ...currentState }
}
