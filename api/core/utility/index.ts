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

const parse_hex = (
	v: string, as_string: boolean = false
): (number|string|undefined) => {
	//hex can be in format X' or 0x
	const regex_pattern = /^(0[xX])[a-fA-F0-9]+$/
	if (regex_pattern.test(v)) {
		if (as_string) {
			const chars: number[] = []
			const clean_hex = v.slice(2)
			for (let i = 0; i < clean_hex.length - 1; i+=2) {
				const byte = clean_hex[i] + clean_hex[i+1]
				chars.push(parseInt(byte, 16))
			}
			return new TextDecoder().decode(new Uint8Array(chars))
		}
		return parseInt(v, 16)
	}
	const binary_string_pattern = /^([xX]')[a-fA-F0-9]+'$/
	if (binary_string_pattern.test(v)) {
		const clean_hex = v.slice(2, -1)
		if (as_string) {
			const chars: number[] = []
			for (let i = 0; i < clean_hex.length - 1; i+=2) {
				const byte = clean_hex[i] + clean_hex[i+1]
				chars.push(parseInt(byte, 16))
			}
			return new TextDecoder().decode(new Uint8Array(chars))
		}
		return parseInt(clean_hex, 16)
	}
	return undefined 
}

export { deep_copy, parse_hex }
