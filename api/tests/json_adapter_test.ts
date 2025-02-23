import {assertEquals, assertGreater } from 'jsr:@std/assert'
import { describe, it } from "jsr:@std/testing/bdd";
import QueryBuilder from '../core/db/QueryBuilder.ts';
import Data from './mock_data/sample_data_1.ts'

const QueryBuilderProxy = new Proxy(QueryBuilder, {
	get: ((target, prop) => {
		if (prop === 'get_table') {
			Data
		} else {
			//@ts-ignore
			return target[prop]
		}
	})
})

describe({name: 'like binary where operator', ignore: false}, () => {
	it({name: 'test % at start with bad case', ignore: false}, () => {
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like binary', '%aPPle')
			.get()

		assertEquals(record.length, 0)
	})

	it({name: 'test % at start with matching case', ignore: false}, () => {
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'like binary', '%Apple')
			.get()

		assertEquals(records.length, 0)
	})

	it('test % at end with bad case', () => {
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like binary', 'UpdAte%')
			.get()

		assertEquals(record.length, 0)
	})

	it('test % at end with matching case', () => {
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like binary', 'Apple%')
			.get()

		assertEquals(record.length, 1)
	})

	it('test word wrapped by %', () => {
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like binary', '%apple%')
			.get()

		assertEquals(record.length, 1)
	})

	it('test word wrapped by % with bad case', () => {
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like binary', '%phone%')
			.get()

		assertEquals(record.length, 0)
	})
})

describe({name: 'test like where clause', ignore: false}, () => {
	it({name: 'test % is first char', ignore: false}, () => {
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like', '%tEst')
			.get()

		assertGreater(record.length, 0)
	})

	it({name: 'test % is last char', ignore: false}, () => {
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like', 'apple%')
			.get()

		assertEquals(record.length, 1)
	})

	it({name: 'test string wrapped in % with bad case', ignore: false}, () => {
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like', '%phone%')
			.get()

		assertEquals(record.length, 1)
	})

	it({name: 'test string wrapped in % with right case', ignore: false}, () => {
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like', '%phone%')
			.get()

		assertEquals(record.length, 1)
	})

	it({name: 'test %%', ignore: false}, () => {
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'like', '%%')
			.get()
		
		const all_records = QueryBuilderProxy.from('tickets') .get()

		assertEquals(records.length, all_records.length)
	})
})

describe({name: 'test not like where clause', ignore: false}, () => {
	it({name: 'test % is first char', ignore: false}, () => {
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'not like', '%tEst%')
			.get()

		const tickets_with_test_text = records.filter(record => {
			return (record.title as string).toLowerCase().includes('test')
		})

		assertEquals(tickets_with_test_text.length, 0)
	})
	
	it({name: 'test empty string not like', ignore: false}, () => {
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'not like', '')
			.get()

		const tickets_with_empty_text = records.filter(record => {
			return (record.title as string) === ''
		})

		assertEquals(tickets_with_empty_text.length, 0)
	})
	
	
	it({name: 'test properly excluding records with matching %substring%', ignore: false}, () => {
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'not like', '%test%')
			.get()

		const tickets_with_test_text = records.filter(record => {
			return (record.title as string).toLowerCase().includes('test')
		})

		assertEquals(tickets_with_test_text.length, 0)
	})

	it({name: 'test %% should return nothing', ignore: false}, () => {
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'not like', '%%')
			.get()

		assertEquals(records.length, 0)
	})

	it({name: 'test %% should return nothing', ignore: false}, () => {
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'not like', '%%')
			.get()

		assertEquals(records.length, 0)
	})

	it({name: 'test %<string>', ignore: false}, () => {
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'not like', '%stuff')
			.get()

		const tickets_ending_with_stuff = records.filter(record => {
			const words_in_title = (record.title as string).split(' ')
			const last_word_in_title = words_in_title[words_in_title.length - 1]

			return last_word_in_title.toLowerCase() === 'stuff'
		})

		assertEquals(tickets_ending_with_stuff.length, 0)
	})

	it({name: 'test <string>%', ignore: false}, () => {
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'not like', 'stuff%')
			.get()

		const tickets_ending_with_stuff = records.filter(record => {
			const words_in_title = (record.title as string).split(' ')
			const first_word_in_title = words_in_title[0]

			return first_word_in_title.toLowerCase() === 'stuff'
		})

		assertEquals(tickets_ending_with_stuff.length, 0)
	})
})

describe({name: 'test rlike where clause', ignore: false}, () => {
	it({name: 'test starts with'}, () => {
		const records = QueryBuilderProxy
			.where('title', 'rlike', '^Apple').from('tickets').get()

		const titles_starting_with_apple = records.filter(record => {
			const words_in_title = record.title.split(' ')
			const [first_word] = words_in_title
			const first_word_starts = first_word.slice(0, first_word.length)
			return first_word_starts === 'Apple'
		})
		assertEquals(titles_starting_with_apple.length, 1)
	})

	it({name: 'test ends  with'}, () => {
		const records = QueryBuilderProxy.where('title', 'rlike', 'apple$')
			.from('tickets').get()

		const titles_ending_with_apple = records.filter(record => {
			const words_in_title = record.title.split(' ')
			const last_word = words_in_title[words_in_title.length -1]
			const last_word_ends_with = last_word.slice(
				last_word.length  - 'apple'.length, last_word.length + 1
			)
			return last_word_ends_with === "apple"
		})
		assertEquals(titles_ending_with_apple.length, 1)
	})
})

describe({name: 'test not rlike where clause', ignore: false}, () => {
	it({name: 'test starts with'}, () => {
		const records = QueryBuilderProxy
			.where('title', 'not rlike', '^Apple').from('tickets').get()

		const titles_starting_with_apple = records.filter(record => {
			const words_in_title = record.title.split(' ')
			const [first_word] = words_in_title
			const first_word_starts = first_word.slice(0, first_word.length)
			return first_word_starts !== 'Apple'
		})
		assertGreater(titles_starting_with_apple.length, 0)
	})

	it({name: 'test ends  with'}, () => {
		const records = QueryBuilderProxy.where('title', 'not rlike', 'apple$')
			.from('tickets').get()

		const titles_ending_with_apple = records.filter(record => {
			const words_in_title = record.title.split(' ')
			const last_word = words_in_title[words_in_title.length -1]
			const last_word_ends_with = last_word.slice(
				last_word.length  - 'apple'.length, last_word.length + 1
			)
			return last_word_ends_with !== "apple"
		})
		assertGreater(titles_ending_with_apple.length, 0)
	})
})
