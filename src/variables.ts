import type { ModuleInstance } from './main.js'
import type { CameraState } from './types.js'

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions([
		{
			name: 'Pan Position',
			variableId: 'pan_position',
		},
		{
			name: 'Tilt Position',
			variableId: 'tilt_position',
		},
		{
			name: 'Zoom Position',
			variableId: 'zoom_position',
		},
		{
			name: 'Device Name',
			variableId: 'device_name',
		},
		{
			name: 'Model Name',
			variableId: 'model_name',
		},
		{
			name: 'Focus Mode',
			variableId: 'focus_mode',
		},
		{
			name: 'Focus Area',
			variableId: 'focus_area',
		},
		{
			name: 'Near Limit',
			variableId: 'near_limit',
		},
		{
			name: 'AF Sensitivity',
			variableId: 'af_sensitivity',
		},
		{
			name: 'Smart Focus',
			variableId: 'smart_focus',
		},
		{
			name: 'Digital Zoom',
			variableId: 'digital_zoom',
		},
		{
			name: 'Zoom Ratio OSD',
			variableId: 'zoom_ratio_osd',
		},
		{
			name: 'MF Speed',
			variableId: 'mf_speed',
		},
		{
			name: 'Preset Zoom Speed',
			variableId: 'preset_zoom_speed',
		},
		{
			name: 'Preset Speed',
			variableId: 'preset_speed',
		},
		{
			name: '2DNR',
			variableId: '2dnr',
		},
		{
			name: '3DNR',
			variableId: '3dnr',
		},
		{
			name: 'Sharpness',
			variableId: 'sharpness',
		},
		{
			name: 'Contrast',
			variableId: 'contrast',
		},
		{
			name: 'Saturation',
			variableId: 'saturation',
		},
		{
			name: 'Hue',
			variableId: 'hue',
		},
		{
			name: 'DeFlicker',
			variableId: 'deflicker',
		},
		{
			name: 'Scene',
			variableId: 'scene',
		},
		{
			name: 'Defog Mode',
			variableId: 'defog_mode',
		},
		{
			name: 'Defog Level',
			variableId: 'defog_level',
		},
		{
			name: 'Effect',
			variableId: 'effect',
		},
		{
			name: 'Flip',
			variableId: 'flip',
		},
		{
			name: 'Mirror',
			variableId: 'mirror',
		},
		{
			name: 'HLC Mode',
			variableId: 'hlc_mode',
		},
		{
			name: 'BLC',
			variableId: 'blc',
		},
		{
			name: 'Gamma Level',
			variableId: 'gamma_level',
		},
		{
			name: 'Gamma Bright',
			variableId: 'gamma_bright',
		},
		{
			name: 'WDR',
			variableId: 'wdr',
		},
		{
			name: 'WDR Level',
			variableId: 'wdr_level',
		},
		{
			name: 'White Balance - Mode',
			variableId: 'wb_mode',
		},
		{
			name: 'White Balance - Sensitivity',
			variableId: 'wb_sensitivity',
		},
		{
			name: 'White Balance - Red Gain',
			variableId: 'wb_r_gain',
		},
		{
			name: 'White Balance - Blue Gain',
			variableId: 'wb_b_gain',
		},
		{
			name: 'White Balance - Red Tuning',
			variableId: 'wb_r_tuning',
		},
		{
			name: 'White Balance - Green Tuning',
			variableId: 'wb_g_tuning',
		},
		{
			name: 'White Balance - Blue Tuning',
			variableId: 'wb_b_tuning',
		},
		{
			name: 'White Balance - Color Temperature',
			variableId: 'wb_color_temperature',
		},
		{
			name: 'Exposure Mode',
			variableId: 'exposure_mode',
		},
		{
			name: 'Gain',
			variableId: 'gain',
		},
		{
			name: 'Gain Limit',
			variableId: 'gain_limit',
		},
		{
			name: 'Exposure Compensation Level',
			variableId: 'ex_comp_level',
		},
		{
			name: 'Smart Exposure',
			variableId: 'smart_exposure',
		},
		{
			name: 'Shutter Speed',
			variableId: 'shutter_speed',
		},
		{
			name: 'Iris',
			variableId: 'iris',
		},
		{
			name: 'Position Limit - Down',
			variableId: 'position_limit_down',
		},
		{
			name: 'Position Limit - Up',
			variableId: 'position_limit_up',
		},
		{
			name: 'Position Limit - Left',
			variableId: 'position_limit_left',
		},
		{
			name: 'Position Limit - Right',
			variableId: 'position_limit_right',
		},
		{
			name: 'System Format',
			variableId: 'system_format',
		},
		{
			name: 'HDMI Resolution',
			variableId: 'hdmi_resolution',
		},
		{
			name: 'HDMI Color Space',
			variableId: 'hdmi_color_space',
		},
		{
			name: 'HDMI Bit Depth',
			variableId: 'hdmi_bit_depth',
		},
		{
			name: 'SDI Resolution',
			variableId: 'sdi_resolution',
		},
		{
			name: 'SDI Bit Depth',
			variableId: 'sdi_bit_depth',
		},
		{
			name: 'SDI Color Space',
			variableId: 'sdi_color_space',
		},
	])
}

export function UpdateVariablesOnStateChange(
	self: ModuleInstance,
	currentState: CameraState,
	previousState: CameraState,
): CameraState {
	const variables: Record<string, number | string | boolean> = {}

	// Update PTZ position variables if changed
	if (currentState.ptzPosition) {
		if (!previousState?.ptzPosition || previousState.ptzPosition.PanPosition !== currentState.ptzPosition.PanPosition) {
			variables.pan_position = currentState.ptzPosition.PanPosition
		}
		if (
			!previousState?.ptzPosition ||
			previousState.ptzPosition.TiltPosition !== currentState.ptzPosition.TiltPosition
		) {
			variables.tilt_position = currentState.ptzPosition.TiltPosition
		}
		if (
			!previousState?.ptzPosition ||
			previousState.ptzPosition.ZoomPosition !== currentState.ptzPosition.ZoomPosition
		) {
			variables.zoom_position = currentState.ptzPosition.ZoomPosition
		}
	}

	// Update preset speed variables if changed
	if (currentState.presetSpeed) {
		if (
			!previousState?.presetSpeed ||
			previousState.presetSpeed.PresetZoomSpeed !== currentState.presetSpeed.PresetZoomSpeed
		) {
			variables.preset_zoom_speed = currentState.presetSpeed.PresetZoomSpeed
		}
		if (!previousState?.presetSpeed || previousState.presetSpeed.PresetSpeed !== currentState.presetSpeed.PresetSpeed) {
			variables.preset_speed = currentState.presetSpeed.PresetSpeed
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
			variables.focus_mode = currentState.lensInfo.FocusMode
		}
		if (!previousState?.lensInfo || previousState.lensInfo.FocusArea !== currentState.lensInfo.FocusArea) {
			variables.focus_area = currentState.lensInfo.FocusArea
		}
		if (!previousState?.lensInfo || previousState.lensInfo.NearLimit !== currentState.lensInfo.NearLimit) {
			variables.near_limit = currentState.lensInfo.NearLimit
		}
		if (!previousState?.lensInfo || previousState.lensInfo.AFSensitivity !== currentState.lensInfo.AFSensitivity) {
			variables.af_sensitivity = currentState.lensInfo.AFSensitivity
		}
		if (!previousState?.lensInfo || previousState.lensInfo.SmartFocus !== currentState.lensInfo.SmartFocus) {
			variables.smart_focus = currentState.lensInfo.SmartFocus
		}
		if (!previousState?.lensInfo || previousState.lensInfo.DigitalZoom !== currentState.lensInfo.DigitalZoom) {
			variables.digital_zoom = currentState.lensInfo.DigitalZoom
		}
		if (!previousState?.lensInfo || previousState.lensInfo.ZoomRatioOSD !== currentState.lensInfo.ZoomRatioOSD) {
			variables.zoom_ratio_osd = currentState.lensInfo.ZoomRatioOSD
		}
		if (!previousState?.lensInfo || previousState.lensInfo.MFSpeed !== currentState.lensInfo.MFSpeed) {
			variables.mf_speed = currentState.lensInfo.MFSpeed
		}
	}

	// Update picture info variables if changed
	if (currentState.pictureInfo) {
		if (!previousState?.pictureInfo || previousState.pictureInfo['2DNR'] !== currentState.pictureInfo['2DNR']) {
			variables['2dnr'] = currentState.pictureInfo['2DNR']
		}
		if (!previousState?.pictureInfo || previousState.pictureInfo['3DNR'] !== currentState.pictureInfo['3DNR']) {
			variables['3dnr'] = currentState.pictureInfo['3DNR']
		}
		if (!previousState?.pictureInfo || previousState.pictureInfo.Sharpness !== currentState.pictureInfo.Sharpness) {
			variables.sharpness = currentState.pictureInfo.Sharpness
		}
		if (!previousState?.pictureInfo || previousState.pictureInfo.Contrast !== currentState.pictureInfo.Contrast) {
			variables.contrast = currentState.pictureInfo.Contrast
		}
		if (!previousState?.pictureInfo || previousState.pictureInfo.Saturation !== currentState.pictureInfo.Saturation) {
			variables.saturation = currentState.pictureInfo.Saturation
		}
		if (!previousState?.pictureInfo || previousState.pictureInfo.Hue !== currentState.pictureInfo.Hue) {
			variables.hue = currentState.pictureInfo.Hue
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
			variables.defog_level = currentState.pictureInfo.DefogLevel
		}
		if (!previousState?.pictureInfo || previousState.pictureInfo.Effect !== currentState.pictureInfo.Effect) {
			variables.effect = currentState.pictureInfo.Effect
		}
		if (!previousState?.pictureInfo || previousState.pictureInfo.Flip !== currentState.pictureInfo.Flip) {
			variables.flip = currentState.pictureInfo.Flip
		}
		if (!previousState?.pictureInfo || previousState.pictureInfo.Mirror !== currentState.pictureInfo.Mirror) {
			variables.mirror = currentState.pictureInfo.Mirror
		}
		if (!previousState?.pictureInfo || previousState.pictureInfo.HLCMode !== currentState.pictureInfo.HLCMode) {
			variables.hlc_mode = currentState.pictureInfo.HLCMode
		}
		if (!previousState?.pictureInfo || previousState.pictureInfo.BLC !== currentState.pictureInfo.BLC) {
			variables.blc = currentState.pictureInfo.BLC
		}
	}

	// Update gamma info variables if changed
	if (currentState.gammaInfo) {
		if (!previousState?.gammaInfo || previousState.gammaInfo.Level !== currentState.gammaInfo.Level) {
			variables.gamma_level = currentState.gammaInfo.Level
		}
		if (!previousState?.gammaInfo || previousState.gammaInfo.Bright !== currentState.gammaInfo.Bright) {
			variables.gamma_bright = currentState.gammaInfo.Bright
		}
		if (!previousState?.gammaInfo || previousState.gammaInfo.WDR !== currentState.gammaInfo.WDR) {
			variables.wdr = currentState.gammaInfo.WDR
		}
		if (!previousState?.gammaInfo || previousState.gammaInfo.WDRLevel !== currentState.gammaInfo.WDRLevel) {
			variables.wdr_level = currentState.gammaInfo.WDRLevel
		}
	}

	// Update white balance info variables if changed
	if (currentState.whiteBalanceInfo) {
		if (
			!previousState?.whiteBalanceInfo ||
			previousState.whiteBalanceInfo.Mode !== currentState.whiteBalanceInfo.Mode
		) {
			variables.wb_mode = currentState.whiteBalanceInfo.Mode || ''
		}
		if (
			!previousState?.whiteBalanceInfo ||
			previousState.whiteBalanceInfo.WBSensitivity !== currentState.whiteBalanceInfo.WBSensitivity
		) {
			variables.wb_sensitivity = currentState.whiteBalanceInfo.WBSensitivity
		}
		if (
			!previousState?.whiteBalanceInfo ||
			previousState.whiteBalanceInfo.RGain !== currentState.whiteBalanceInfo.RGain
		) {
			variables.wb_r_gain = currentState.whiteBalanceInfo.RGain
		}
		if (
			!previousState?.whiteBalanceInfo ||
			previousState.whiteBalanceInfo.BGain !== currentState.whiteBalanceInfo.BGain
		) {
			variables.wb_b_gain = currentState.whiteBalanceInfo.BGain
		}
		if (
			!previousState?.whiteBalanceInfo ||
			previousState.whiteBalanceInfo.RTuning !== currentState.whiteBalanceInfo.RTuning
		) {
			variables.wb_r_tuning = currentState.whiteBalanceInfo.RTuning
		}
		if (
			!previousState?.whiteBalanceInfo ||
			previousState.whiteBalanceInfo.GTuning !== currentState.whiteBalanceInfo.GTuning
		) {
			variables.wb_g_tuning = currentState.whiteBalanceInfo.GTuning
		}
		if (
			!previousState?.whiteBalanceInfo ||
			previousState.whiteBalanceInfo.BTuning !== currentState.whiteBalanceInfo.BTuning
		) {
			variables.wb_b_tuning = currentState.whiteBalanceInfo.BTuning
		}
		if (
			!previousState?.whiteBalanceInfo ||
			previousState.whiteBalanceInfo.ColorTemperature !== currentState.whiteBalanceInfo.ColorTemperature
		) {
			variables.wb_color_temperature = currentState.whiteBalanceInfo.ColorTemperature
		}
	}

	// Update exposure info variables if changed
	if (currentState.exposureInfo) {
		if (!previousState?.exposureInfo || previousState.exposureInfo.Mode !== currentState.exposureInfo.Mode) {
			variables.exposure_mode = currentState.exposureInfo.Mode
		}
		if (!previousState?.exposureInfo || previousState.exposureInfo.Gain !== currentState.exposureInfo.Gain) {
			variables.gain = currentState.exposureInfo.Gain
		}
		if (!previousState?.exposureInfo || previousState.exposureInfo.GainLimit !== currentState.exposureInfo.GainLimit) {
			variables.gain_limit = currentState.exposureInfo.GainLimit
		}
		if (
			!previousState?.exposureInfo ||
			previousState.exposureInfo.ExCompLevel !== currentState.exposureInfo.ExCompLevel
		) {
			variables.ex_comp_level = currentState.exposureInfo.ExCompLevel
		}
		if (
			!previousState?.exposureInfo ||
			previousState.exposureInfo.SmartExposure !== currentState.exposureInfo.SmartExposure
		) {
			variables.smart_exposure = currentState.exposureInfo.SmartExposure
		}
		if (
			!previousState?.exposureInfo ||
			previousState.exposureInfo.ShutterSpeed !== currentState.exposureInfo.ShutterSpeed
		) {
			variables.shutter_speed = currentState.exposureInfo.ShutterSpeed
		}
		if (!previousState?.exposureInfo || previousState.exposureInfo.Iris !== currentState.exposureInfo.Iris) {
			variables.iris = currentState.exposureInfo.Iris
		}
	}

	// Update position limitations variables if changed
	if (currentState.positionLimitations) {
		if (
			!previousState?.positionLimitations ||
			previousState.positionLimitations.DownLimit !== currentState.positionLimitations.DownLimit
		) {
			variables.position_limit_down = currentState.positionLimitations.DownLimit
		}
		if (
			!previousState?.positionLimitations ||
			previousState.positionLimitations.UpLimit !== currentState.positionLimitations.UpLimit
		) {
			variables.position_limit_up = currentState.positionLimitations.UpLimit
		}
		if (
			!previousState?.positionLimitations ||
			previousState.positionLimitations.LeftLimit !== currentState.positionLimitations.LeftLimit
		) {
			variables.position_limit_left = currentState.positionLimitations.LeftLimit
		}
		if (
			!previousState?.positionLimitations ||
			previousState.positionLimitations.RightLimit !== currentState.positionLimitations.RightLimit
		) {
			variables.position_limit_right = currentState.positionLimitations.RightLimit
		}
	}

	// Update video output info variables if changed
	if (currentState.videoOutputInfo) {
		if (
			!previousState?.videoOutputInfo ||
			previousState.videoOutputInfo.SystemFormat !== currentState.videoOutputInfo.SystemFormat
		) {
			variables.system_format = currentState.videoOutputInfo.SystemFormat ?? ''
		}
		if (
			!previousState?.videoOutputInfo ||
			previousState.videoOutputInfo.HDMIResolution !== currentState.videoOutputInfo.HDMIResolution
		) {
			variables.hdmi_resolution = currentState.videoOutputInfo.HDMIResolution ?? ''
		}
		if (
			!previousState?.videoOutputInfo ||
			previousState.videoOutputInfo.HDMIColorSpace !== currentState.videoOutputInfo.HDMIColorSpace
		) {
			variables.hdmi_color_space = currentState.videoOutputInfo.HDMIColorSpace
		}
		if (
			!previousState?.videoOutputInfo ||
			previousState.videoOutputInfo.HDMIBitDepth !== currentState.videoOutputInfo.HDMIBitDepth
		) {
			variables.hdmi_bit_depth = currentState.videoOutputInfo.HDMIBitDepth
		}
		if (
			!previousState?.videoOutputInfo ||
			previousState.videoOutputInfo.SDIResolution !== currentState.videoOutputInfo.SDIResolution
		) {
			variables.sdi_resolution = currentState.videoOutputInfo.SDIResolution
		}
		if (
			!previousState?.videoOutputInfo ||
			previousState.videoOutputInfo.SDIBitDepth !== currentState.videoOutputInfo.SDIBitDepth
		) {
			variables.sdi_bit_depth = currentState.videoOutputInfo.SDIBitDepth
		}
		if (
			!previousState?.videoOutputInfo ||
			previousState.videoOutputInfo.SDIColorSpace !== currentState.videoOutputInfo.SDIColorSpace
		) {
			variables.sdi_color_space = currentState.videoOutputInfo.SDIColorSpace
		}
	}

	// Only update variables if something changed
	if (Object.keys(variables).length > 0) {
		self.setVariableValues(variables)
		console.log('Updated variables: ' + JSON.stringify(variables))
	}

	// Store current state as previous for next comparison
	return { ...currentState }
}
