import {assertEquals, assertGreater } from 'jsr:@std/assert'
import { describe, it } from "jsr:@std/testing/bdd";
import { parse_hex } from '../core/utility/index.ts';

describe({name: 'parse_hex', ignore: false}, () => {
	it({name: 'fake hex', ignore: false}, () => {
		const result = parse_hex('0x1AFG2')
		assertEquals(result, undefined)
	})
	it({name: '15 as hex', ignore: false}, () => {
		const result = parse_hex('0xF')
		assertEquals(result, 15)
	})
	it({name: '15 as binary string', ignore: false}, () => {
		const result = parse_hex("X'F'")
		assertEquals(result, 15)
	})
	it({name: 'AB as binary string', ignore: false}, () => {
		const result = parse_hex("X'4142'", true)
		assertEquals(result, "AB")
	})
	it({name: 'AB as binary string', ignore: false}, () => {
		const result = parse_hex("0x4142", true)
		assertEquals(result, "AB")
	})
})
