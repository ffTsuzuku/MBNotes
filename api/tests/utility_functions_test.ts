import {assertEquals, assertGreater, assert } from 'jsr:@std/assert'
import { describe, it } from "jsr:@std/testing/bdd";
import { parse_hex } from '../core/utility/index.ts';

describe({name: 'parse_hex', ignore: false}, () => {
	it({name: 'fake hex', ignore: false}, () => {
		const result = parse_hex('0x1AFG2', 'number')
		assertEquals(result, undefined)
	})
	it({name: '15 as hex', ignore: false}, () => {
		const result = parse_hex('0xF', 'number')
		assertEquals(result, 15)
	})
	it({name: '15 as bad binary string', ignore: false}, () => {
		const result = parse_hex("X'F'", 'number')
		assertEquals(result, undefined)
	})
	it({name: '15 as binary string', ignore: false}, () => {
		const result = parse_hex("X'0F'", 'number')
		assertEquals(result, 15)
	})
	it({name: 'AB as binary string', ignore: false}, () => {
		const result = parse_hex("X'4142'", 'string')
		assertEquals(result, "AB")
	})
	it({name: 'AB as binary string', ignore: false}, () => {
		const result = parse_hex("0x4142", 'string')
		assertEquals(result, "AB")
	})
	it({name: 'chat gpt test', ignore: false}, () => {
		assert(parse_hex("0x48656c6c6f", 'string') === 'Hello');  // "Hello" ✅
		assertEquals(parse_hex("0x48656c6c6f", 'number'),310939249775); // 310939249775 (Decimal) ✅
		assertEquals(parse_hex("X'48656c6c6f'", 'string'), "Hello"); // "Hello" ✅
		assertEquals(parse_hex("X'48656c6c6f'", 'number'), 310939249775); // 310939249775 (Decimal) ✅

		assertEquals((parse_hex("0x41", 'string')), "A");  // "A" ✅
		assertEquals(parse_hex("X'41'", 'string'), "A"); // "A" ✅

		//console.log(parse_hex("0xGHIJKL", false)); // undefined ✅
		//console.log(parse_hex("X'123'", false));   // undefined (odd-length hex should be invalid) ✅
		//console.log(parse_hex("123456", false));   // undefined ✅
	})
})
