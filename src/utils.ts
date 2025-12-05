/**
 * Helper function to recursively search for a capability (enum or range) in an object
 * Checks all levels of nesting to find the capability
 */
export function findCapability(
	obj: unknown,
	capabilityName: string,
	visited = new Set<unknown>(),
): { Type: string; Data?: unknown } | null {
	// Prevent infinite recursion
	if (!obj || typeof obj !== 'object' || visited.has(obj)) {
		return null
	}
	visited.add(obj)

	// If it's an array, search each element
	if (Array.isArray(obj)) {
		for (const item of obj) {
			const result = findCapability(item, capabilityName, visited)
			if (result) return result
		}
		return null
	}

	// If it's an object, check if it's the capability we're looking for
	const record = obj as Record<string, unknown>
	if ((record.Type === 'enum' || record.Type === 'range') && record.Description === capabilityName) {
		return record as { Type: string; Data?: unknown }
	}

	// Check if this object has the capability name as a key
	if (record[capabilityName]) {
		const cap = record[capabilityName] as { Type: string; Data?: unknown } | undefined
		if (cap && (cap.Type === 'enum' || cap.Type === 'range')) {
			return cap
		}
	}

	// Recursively search all properties
	for (const key in record) {
		if (Object.prototype.hasOwnProperty.call(record, key)) {
			const result = findCapability(record[key], capabilityName, visited)
			if (result) return result
		}
	}

	return null
}

/**
 * Lightweight deep equality check
 */
export function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true
	if (a === null || b === null) return a === b
	if (typeof a !== typeof b) return false
	if (typeof a !== 'object') return false

	if (Array.isArray(a) || Array.isArray(b)) {
		if (!Array.isArray(a) || !Array.isArray(b)) return false
		if (a.length !== b.length) return false
		for (let i = 0; i < a.length; i += 1) {
			if (!deepEqual(a[i], b[i])) return false
		}
		return true
	}

	const objA = a as Record<string, unknown>
	const objB = b as Record<string, unknown>
	const keysA = Object.keys(objA)
	const keysB = Object.keys(objB)
	if (keysA.length !== keysB.length) return false

	for (const key of keysA) {
		if (!Object.prototype.hasOwnProperty.call(objB, key)) return false
		if (!deepEqual(objA[key], objB[key])) return false
	}
	return true
}

/**
 * Builds the iris map from capabilities data
 * Handles both enum and range types
 * Filters enum values to only common f-stops
 * @param imageCapabilitiesContent Image capabilities content to extract from
 * @returns Object with irisMap and irisRange, or null values if not found
 */
export function buildIrisMapFromCapabilities(imageCapabilitiesContent: Record<string, unknown>): {
	irisMap: Record<number, string> | null
	irisRange: { min: number; max: number } | null
} {
	const cap = findCapability(imageCapabilitiesContent, 'Iris')

	if (cap?.Type === 'enum' && cap.Data && Array.isArray(cap.Data)) {
		// Handle enum type - filter to common f-stops
		const map: Record<number, string> = {}
		for (const item of cap.Data) {
			const dataItem = item as { Value?: number; Description?: string }
			if (
				typeof dataItem.Value === 'number' &&
				typeof dataItem.Description === 'string' &&
				isCommonFStop(dataItem.Description)
			) {
				map[dataItem.Value] = dataItem.Description
			}
		}
		if (Object.keys(map).length > 0) {
			return { irisMap: map, irisRange: null }
		}
	} else if (cap?.Type === 'range' && cap.Data && typeof cap.Data === 'object') {
		// Handle range type
		const rangeData = cap.Data as { Min?: number; Max?: number }
		if (typeof rangeData.Min === 'number' && typeof rangeData.Max === 'number') {
			return { irisMap: null, irisRange: { min: rangeData.Min, max: rangeData.Max } }
		}
	}

	return { irisMap: null, irisRange: null }
}

/**
 * Builds the shutter speed map from capabilities data
 * @param imageCapabilitiesContent Image capabilities content to extract from
 * @returns Shutter speed map or null if not found
 */
export function buildShutterSpeedMapFromCapabilities(
	imageCapabilitiesContent: Record<string, unknown>,
): Record<number, string> | null {
	const cap = findCapability(imageCapabilitiesContent, 'ShutterSpeed')

	if (cap?.Type === 'enum' && cap.Data && Array.isArray(cap.Data)) {
		const map: Record<number, string> = {}
		for (const item of cap.Data) {
			const dataItem = item as { Value?: number; Description?: string }
			if (typeof dataItem.Value === 'number' && typeof dataItem.Description === 'string') {
				map[dataItem.Value] = dataItem.Description
			}
		}
		if (Object.keys(map).length > 0) {
			return map
		}
	}

	return null
}

/**
 * Helper function to check if an iris value is a common f-stop
 * Filters to standard camera iris values - only exact matches
 */
export function isCommonFStop(label: string): boolean {
	// Special case for "Close"
	if (label.toLowerCase() === 'close') return true

	// Common f-stop values from F1.0 to F32, plus "Close"
	// Include variations like "F1.0", "F1", "1.0", "1" to handle different formats
	const commonFStops = [
		'Close',
		'F1.0',
		'F1',
		'1.0',
		'1',
		'F1.2',
		'1.2',
		'F1.4',
		'1.4',
		'F1.6',
		'1.6',
		'F1.8',
		'1.8',
		'F2.0',
		'F2',
		'2.0',
		'2',
		'F2.2',
		'2.2',
		'F2.4',
		'2.4',
		'F2.8',
		'2.8',
		'F3.2',
		'3.2',
		'F3.5',
		'3.5',
		'F4.0',
		'F4',
		'4.0',
		'4',
		'F4.5',
		'4.5',
		'F5.0',
		'F5',
		'5.0',
		'5',
		'F5.6',
		'5.6',
		'F6.3',
		'6.3',
		'F7.1',
		'7.1',
		'F8.0',
		'F8',
		'8.0',
		'8',
		'F9.0',
		'F9',
		'9.0',
		'9',
		'F10',
		'10',
		'F11',
		'11',
		'F13',
		'13',
		'F14',
		'14',
		'F16',
		'16',
		'F18',
		'18',
		'F20',
		'20',
		'F22',
		'22',
		'F25',
		'25',
		'F29',
		'29',
		'F32',
		'32',
	]

	// Check exact match (case-insensitive, with/without F prefix)
	const normalizedLabel = label.replace(/^F/i, '').trim().toLowerCase()
	return commonFStops.some((fStop) => fStop.replace(/^F/i, '').trim().toLowerCase() === normalizedLabel)
}

/**
 * Helper function to sort iris choices by f-stop value with "Close" at the end
 */
export function sortIrisChoices<T extends { label: string }>(choices: T[]): T[] {
	return choices.sort((a, b) => {
		// Sort by numeric f-stop value, with "Close" at the end
		if (a.label.toLowerCase() === 'close') return 1
		if (b.label.toLowerCase() === 'close') return -1
		const aMatch = a.label.match(/F?(\d+\.?\d*)/)
		const bMatch = b.label.match(/F?(\d+\.?\d*)/)
		if (aMatch && bMatch) {
			return Number.parseFloat(aMatch[1]) - Number.parseFloat(bMatch[1])
		}
		return a.label.localeCompare(b.label)
	})
}

/**
 * Helper function to get next/previous iris value from sorted choices
 */
export function getAdjacentIrisValue(
	choices: Array<{ id: number }>,
	currentIris: number | undefined,
	direction: 'increase' | 'decrease',
): number {
	if (choices.length === 0) return 0

	const currentIdx = choices.findIndex((c) => c.id === currentIris)
	if (currentIdx >= 0) {
		// Found current value, move to adjacent standard f-stop
		const newIdx = direction === 'increase' ? Math.min(currentIdx + 1, choices.length - 1) : Math.max(currentIdx - 1, 0)
		return choices[newIdx].id
	} else {
		// Current value not in standard list, find closest standard value
		if (direction === 'increase') {
			const nextChoice = choices.find((c) => c.id > (currentIris ?? 0))
			return nextChoice?.id ?? choices[choices.length - 1]?.id ?? 0
		} else {
			const prevChoices = choices.filter((c) => c.id < (currentIris ?? 0))
			return prevChoices.length > 0 ? prevChoices[prevChoices.length - 1].id : (choices[0]?.id ?? 0)
		}
	}
}

/**
 * Helper function to sort shutter speed choices by numeric value
 */
export function sortShutterSpeedChoices<T extends { label: string }>(choices: T[]): T[] {
	return choices.sort((a, b) => {
		// Sort by numeric value from label (e.g., "1/60" -> 60, "1/1000" -> 1000)
		const aNum = Number.parseInt(a.label.split('/')[1] || '0', 10)
		const bNum = Number.parseInt(b.label.split('/')[1] || '0', 10)
		return aNum - bNum
	})
}

/**
 * Helper function to get next/previous shutter speed value from sorted choices
 * @param choices Sorted array of shutter speed choices with id (numeric) and label
 * @param shutterSpeedMap Map of numeric id to string label
 * @param currentShutterSpeed Current shutter speed string value (e.g., "1/60")
 * @param direction 'increase' or 'decrease'
 * @returns Shutter speed string value
 */
export function getAdjacentShutterSpeedValue(
	choices: Array<{ id: number; label: string }>,
	shutterSpeedMap: Record<number, string>,
	currentShutterSpeed: string | undefined,
	direction: 'increase' | 'decrease',
): string {
	if (choices.length === 0) return '1/60'

	// Find the numeric ID for the current shutter speed string
	const currentNumeric = Object.entries(shutterSpeedMap).find(([_value, label]) => label === currentShutterSpeed)?.[0]

	if (currentNumeric) {
		const currentIdx = choices.findIndex((c) => c.id === Number.parseInt(currentNumeric, 10))
		if (currentIdx >= 0) {
			// Found current value, move to adjacent shutter speed
			const newIdx =
				direction === 'increase' ? Math.min(currentIdx + 1, choices.length - 1) : Math.max(currentIdx - 1, 0)
			return shutterSpeedMap[choices[newIdx].id] ?? '1/60'
		}
	}

	// Current value not found, return first/last value
	return direction === 'increase'
		? (shutterSpeedMap[choices[choices.length - 1]?.id] ?? '1/60')
		: (shutterSpeedMap[choices[0]?.id] ?? '1/60')
}

/**
 * Converts a numeric iris value to an f-stop label
 * Based on mapping: 0 = F1.8, 119 = F3.2, 224 = F18, 254 = CLOSE
 * @param value Numeric iris value (0-254)
 * @returns F-stop label string
 */
export function convertIrisValueToFStop(value: number): string {
	// Special case for maximum value (CLOSE)
	if (value >= 254) return 'CLOSE'

	// Known mapping points: [numericValue, fStopNumber]
	const mappingPoints: Array<[number, number]> = [
		[0, 1.8], // F1.8
		[119, 3.2], // F3.2
		[224, 18], // F18
		[254, Infinity], // CLOSE (handled above)
	]

	// Find the two points to interpolate between
	let lowerPoint: [number, number] | null = null
	let upperPoint: [number, number] | null = null

	for (let i = 0; i < mappingPoints.length - 1; i++) {
		const current = mappingPoints[i]
		const next = mappingPoints[i + 1]

		if (value >= current[0] && value <= next[0]) {
			lowerPoint = current
			upperPoint = next
			break
		}
	}

	// If value is before first point, use first point
	if (!lowerPoint) {
		lowerPoint = mappingPoints[0]
		upperPoint = mappingPoints[1]
	}

	// Linear interpolation to find f-stop number
	const [lowerValue, lowerFStop] = lowerPoint
	const [upperValue, upperFStop] = upperPoint!

	if (upperFStop === Infinity) {
		// Approaching CLOSE, interpolate to higher f-stops
		const ratio = (value - lowerValue) / (upperValue - lowerValue)
		const fStop = lowerFStop + ratio * (32 - lowerFStop) // Interpolate up to F32
		return `F${fStop.toFixed(1)}`
	}

	const ratio = (value - lowerValue) / (upperValue - lowerValue)
	const fStop = lowerFStop + ratio * (upperFStop - lowerFStop)

	// Round to nearest standard f-stop
	const standardFStops = [
		1.8, 2.0, 2.2, 2.4, 2.8, 3.2, 3.5, 4.0, 4.5, 5.0, 5.6, 6.3, 7.1, 8.0, 9.0, 10, 11, 13, 14, 16, 18, 20, 22, 25, 29,
		32,
	]
	const nearestFStop = standardFStops.reduce((prev, curr) =>
		Math.abs(curr - fStop) < Math.abs(prev - fStop) ? curr : prev,
	)

	// Format the f-stop label
	if (nearestFStop >= 10 && nearestFStop % 1 === 0) {
		return `F${nearestFStop}`
	}
	return `F${nearestFStop.toFixed(1)}`
}

/**
 * Converts an iris range to an iris map by generating standard f-stop values
 * Based on mapping: 0 = F1.8, 119 = F3.2, 224 = F18, 254 = CLOSE
 * @param irisRange Range with min and max values
 * @returns Iris map with numeric values mapped to f-stop labels
 */
export function convertIrisRangeToMap(irisRange: { min: number; max: number }): Record<number, string> {
	const map: Record<number, string> = {}

	// Known exact mapping points: [numericValue, fStopNumber]
	const knownMappings: Array<[number, number]> = [
		[0, 1.8], // F1.8
		[119, 3.2], // F3.2
		[224, 18], // F18
	]

	// Standard f-stop values to include (between known points)
	const standardFStops = [
		1.8, 2.0, 2.2, 2.4, 2.8, 3.2, 3.5, 4.0, 4.5, 5.0, 5.6, 6.3, 7.1, 8.0, 9.0, 10, 11, 13, 14, 16, 18, 20, 22, 25, 29,
		32,
	]

	// Include known exact mappings if within range
	for (const [numericValue, fStop] of knownMappings) {
		if (numericValue >= irisRange.min && numericValue <= irisRange.max) {
			const label = fStop >= 10 && fStop % 1 === 0 ? `F${fStop}` : `F${fStop.toFixed(1)}`
			map[numericValue] = label
		}
	}

	// Mapping points for interpolation (including CLOSE at 254)
	const mappingPoints: Array<[number, number]> = [
		[0, 1.8],
		[119, 3.2],
		[224, 18],
		[254, 32], // Approximate for interpolation to CLOSE
	]

	// For each standard f-stop, find the corresponding numeric value
	for (const fStop of standardFStops) {
		// Skip if already included as a known mapping
		if (knownMappings.some(([, knownFStop]) => Math.abs(knownFStop - fStop) < 0.01)) {
			continue
		}

		// Find interpolation points
		let lowerPoint: [number, number] | null = null
		let upperPoint: [number, number] | null = null

		for (let i = 0; i < mappingPoints.length - 1; i++) {
			const current = mappingPoints[i]
			const next = mappingPoints[i + 1]

			if (fStop >= current[1] && fStop <= next[1]) {
				lowerPoint = current
				upperPoint = next
				break
			}
		}

		if (lowerPoint && upperPoint) {
			// Interpolate to find numeric value
			const [lowerValue, lowerFStop] = lowerPoint
			const [upperValue, upperFStop] = upperPoint
			const ratio = (fStop - lowerFStop) / (upperFStop - lowerFStop)
			const numericValue = Math.round(lowerValue + ratio * (upperValue - lowerValue))

			// Only include if within range and not already mapped
			if (numericValue >= irisRange.min && numericValue <= irisRange.max && !map[numericValue]) {
				const label = fStop >= 10 && fStop % 1 === 0 ? `F${fStop}` : `F${fStop.toFixed(1)}`
				map[numericValue] = label
			}
		}
	}

	// Always include CLOSE at max value (or 254 if max >= 254)
	if (irisRange.max >= 254) {
		map[254] = 'CLOSE'
	} else {
		// If max is less than 254, use max value for CLOSE
		map[irisRange.max] = 'CLOSE'
	}

	return map
}

/**
 * Calculates the next auto restart time based on the auto restart settings
 * @param autoRestartType The type of auto restart (0=Never, 1=Daily, 2=Weekly, 3=Monthly)
 * @param day The day setting (0-31 depending on type)
 * @param hour The hour setting (0-23)
 * @param minute The minute setting (0-59)
 * @returns Formatted string representing the next restart time, or "Never" if disabled
 */
export function calculateNextAutoRestartTime(
	autoRestartType: number,
	day: number,
	hour: number,
	minute: number,
): string {
	// If never restart, return "Never"
	if (autoRestartType === 0) {
		return 'Never'
	}

	const now = new Date()
	let nextRestart = new Date(now)

	switch (autoRestartType) {
		case 1: {
			// Every Day
			nextRestart.setHours(hour, minute, 0, 0)
			if (nextRestart <= now) {
				nextRestart.setDate(nextRestart.getDate() + 1)
			}
			break
		}
		case 2: {
			// Every Week (Day = 0-6, Sunday = 0)
			const targetDay = day
			const currentDay = now.getDay()
			let daysUntilTarget = targetDay - currentDay
			if (daysUntilTarget <= 0) {
				daysUntilTarget += 7
			}
			nextRestart.setDate(now.getDate() + daysUntilTarget)
			nextRestart.setHours(hour, minute, 0, 0)
			break
		}
		case 3: {
			// Every Month (Day = 1-31)
			const targetDate = day
			const currentDate = now.getDate()
			const currentMonth = now.getMonth()
			const currentYear = now.getFullYear()

			let targetMonth = currentMonth
			let targetYear = currentYear

			if (targetDate <= currentDate) {
				targetMonth = currentMonth + 1
				if (targetMonth > 11) {
					targetMonth = 0
					targetYear = currentYear + 1
				}
			}

			// Handle months with fewer days than targetDate
			const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
			const actualTargetDate = Math.min(targetDate, lastDayOfTargetMonth)

			nextRestart = new Date(targetYear, targetMonth, actualTargetDate, hour, minute, 0, 0)
			break
		}
	}

	return nextRestart.toLocaleString()
}
