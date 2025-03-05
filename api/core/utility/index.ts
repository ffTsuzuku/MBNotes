import {DateTime} from "luxon"

/**
 * Given a value this function will return a unique copy of that value if the
 * value is not a primative or function
 * @param value: the value to copy
 * @param history: a history of objects that have been parsed to avoid reparsing
 * */
const deep_copy = <T>(value: T, history = new WeakMap()): T => {
    if (
        value === undefined || 
        value === null || 
        typeof value === 'string' || 
        typeof value === 'number' || 
        typeof value === 'boolean' || 
        typeof value === 'bigint' ||
        typeof value === 'symbol' ||
        typeof value === 'function'
    ) {
        return value
    } 

    if (value instanceof Date) {
        return new Date(value.getTime()) as T
    }

    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags) as T
    }

    if (value instanceof Map) {
         const copy = new Map()
         for (const property of value.keys()) {
             const curr = value.get(property)
              copy.set(deep_copy(property, history), deep_copy(curr, history))
         }
         return copy as T       
    }

    if (value instanceof Set) {
        const copy = new Set()
        for (const el of value) {
              if (history.has(el)) {
                   copy.add(el)
              } else {
                   copy.add(deep_copy(el, history))
              }
        }
    } 

    history.set(value, true)

    if (Array.isArray(value)) {
        const copy = []
        for (const el of value) {
            if (history.has(el)) {
                copy.push(el) // Return the existing reference
            } else {
                copy.push(deep_copy(el, history)) // Pass history to the recursive call
            }
        }
        return copy as T
    }

    if (typeof value === 'object') {
        const copy: Record<string, any> = {}
        for (const property of Object.keys(value)) {
			//@ts-ignore
            const original = value[property]
            if (history.has(original)) {
                copy[property] = original // Return the existing reference
            } else {
                copy[property] = deep_copy(original, history) // Pass history to the recursive call
            }
        }

        return copy as T
    }
    return value
}

/**
 * Given a hex value clean up the hex and return a byte array of the hex value
 * */
const parse_hex = (
	hex: string|number, format?: 'string'|'number'|undefined 
): Uint8Array|string|number|undefined  => {
	if (typeof hex === 'number') {
		hex = hex.toString()
	}
	//hex can be in format X' or 0x
	//const regex_pattern = /^(0[xX])[a-fA-F0-9]+$/
	const regex_pattern = /^(0[xX]|[xX]')?([a-fA-F0-9]+)'?$/
	const match = hex.match(regex_pattern) 
	
	if (!match) {
		return undefined
	}

	const [_, prefix_match, hex_match] = match

	let clean_hex = hex_match
	if (prefix_match.toLowerCase() === '0x' && clean_hex.length % 2) {
		clean_hex = clean_hex.padStart(clean_hex.length + 1, "0")
	} else if (prefix_match.toLowerCase() === "x'" && clean_hex.length % 2) {
		// mysql only pads hex starting with 0x. X' should fail when odd length 
		return undefined
	}

	if (format === 'number') {
		return parseInt(clean_hex, 16)
	}

	const bytes = new Uint8Array(clean_hex.length / 2)
	for (let i = 0; i < clean_hex.length; i += 2) {
		bytes[i / 2] = parseInt(clean_hex.substring(i, i + 2), 16)
	}
	if (format === 'string') {
		return new TextDecoder().decode(bytes)
	}
	return bytes
}

/**
 * cleanly compare two hex values to ensure they are equal
 * */
const compare_hex = (v1: string|number, v2: string|number): boolean => {
	const parsed_v1 = parse_hex(v1)
	const parsed_v2= parse_hex(v2)

	if (parsed_v1 === undefined || parsed_v2 === undefined) {
		return false
	}

	if (Array.isArray(parsed_v1) && Array.isArray(parsed_v2)) {
		if(parsed_v1.length !== parsed_v2.length) {
			return false
		}
		for (let i = 0; i < parsed_v1.length; i++) {
			const byte_1 = parsed_v1[i]
			const byte_2 = parsed_v2[i]

			if (byte_1 !== byte_2) {
				return false
			}
		}
	}
	return true
}

const is_date = (value: any): boolean => {
	DateTime.fromISO(value).isValid

	return false
}

export { deep_copy, parse_hex, compare_hex, is_date }
