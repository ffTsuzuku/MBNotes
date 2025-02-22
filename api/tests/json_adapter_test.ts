import {assertEquals, assertGreater } from 'jsr:@std/assert'
import { describe, it } from "jsr:@std/testing/bdd";
import QueryBuilder from '../core/db/QueryBuilder.ts';

describe({name: 'like binary where operator', ignore: false}, () => {
	it({name: 'test % at start with bad case', ignore: false}, () => {
		const record = QueryBuilder.from('tickets')
			.where('title', 'like binary', '%aPPle')
			.get()

		assertEquals(record.length, 0)
	})

	it({name: 'test % at start with matching case', ignore: false}, () => {
		const records = QueryBuilder.from('tickets')
			.where('title', 'like binary', '%Apple')
			.get()

		assertEquals(records.length, 0)
	})

	it('test % at end with bad case', () => {
		const record = QueryBuilder.from('tickets')
			.where('title', 'like binary', 'UpdAte%')
			.get()

		assertEquals(record.length, 0)
	})

	it('test % at end with matching case', () => {
		const record = QueryBuilder.from('tickets')
			.where('title', 'like binary', 'Apple%')
			.get()

		assertEquals(record.length, 1)
	})

	it('test word wrapped by %', () => {
		const record = QueryBuilder.from('tickets')
			.where('title', 'like binary', '%apple%')
			.get()

		assertEquals(record.length, 1)
	})

	it('test word wrapped by % with bad case', () => {
		const record = QueryBuilder.from('tickets')
			.where('title', 'like binary', '%phone%')
			.get()

		assertEquals(record.length, 0)
	})
})

describe({name: 'test like where clause', ignore: true}, () => {
	it({name: 'test % is first char', ignore: false}, () => {
		const record = QueryBuilder.from('tickets')
			.where('title', 'like', '%tEst')
			.get()

		assertGreater(record.length, 0)
	})

	it({name: 'test % is last char', ignore: false}, () => {
		const record = QueryBuilder.from('tickets')
			.where('title', 'like', 'apple%')
			.get()

		assertEquals(record.length, 1)
	})

	it({name: 'test string wrapped in % with bad case', ignore: false}, () => {
		const record = QueryBuilder.from('tickets')
			.where('title', 'like', '%phone%')
			.get()

		assertEquals(record.length, 1)
	})

	it({name: 'test string wrapped in % with right case', ignore: false}, () => {
		const record = QueryBuilder.from('tickets')
			.where('title', 'like', '%phone%')
			.get()

		assertEquals(record.length, 1)
	})
})
