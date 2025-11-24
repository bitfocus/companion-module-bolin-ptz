/**
 * Utility functions for iris and shutter speed operations
 */

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
