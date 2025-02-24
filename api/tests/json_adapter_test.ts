import {assertEquals, assertGreater, assertThrows } from 'jsr:@std/assert'
import { describe, it } from "jsr:@std/testing/bdd";
import QueryBuilder from '../core/db/QueryBuilder.ts';
import {make_mock_json_db_adapter, make_mock_query} from '../core/utility/test.ts';

const JSONDBAdapterProxy = make_mock_json_db_adapter()

describe({name: 'like binary where operator', ignore: false}, () => {
	it({name: 'test % at start with bad case', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like binary', '%aPPle')
			.get()

		assertEquals(record.length, 0)
	})

	it({name: 'test % at start with matching case', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'like binary', '%Apple')
			.get()

		assertEquals(records.length, 0)
	})

	it('test % at end with bad case', () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like binary', 'UpdAte%')
			.get()

		assertEquals(record.length, 0)
	})

	it('test % at end with matching case', () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like binary', 'Apple%')
			.get()

		assertEquals(record.length, 1)
	})

	it('test word wrapped by %', () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like binary', '%apple%')
			.get()

		assertEquals(record.length, 1)
	})

	it('test word wrapped by % with bad case', () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like binary', '%phone%')
			.get()

		assertEquals(record.length, 0)
	})
})

describe({name: 'test like where clause', ignore: false}, () => {
	it({name: 'test % is first char', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like', '%tEst')
			.get()

		assertGreater(record.length, 0)
	})

	it({name: 'test % is last char', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like', 'apple%')
			.get()

		assertEquals(record.length, 1)
	})

	it({name: 'test string wrapped in % with bad case', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like', '%phone%')
			.get()

		assertEquals(record.length, 1)
	})

	it({name: 'test string wrapped in % with right case', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const record = QueryBuilderProxy.from('tickets')
			.where('title', 'like', '%phone%')
			.get()

		assertEquals(record.length, 1)
	})

	it({name: 'test %%', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'like', '%%')
			.get()
		
		const all_records = QueryBuilderProxy.from('tickets') .get()

		assertEquals(records.length, all_records.length)
	})

	it({name: 'test like against num val', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const record = QueryBuilderProxy.from('tickets')
			.where('id', 'like', 1)
			.get()

		assertEquals(record.length, 1)
	})
})

describe({name: 'test not like where clause', ignore: false}, () => {
	it({name: 'test % is first char', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'not like', '%tEst%')
			.get()

		const tickets_with_test_text = records.filter(record => {
			return (record.title as string).toLowerCase().includes('test')
		})

		assertEquals(tickets_with_test_text.length, 0)
	})
	
	it({name: 'test empty string not like', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'not like', '')
			.get()

		const tickets_with_empty_text = records.filter(record => {
			return (record.title as string) === ''
		})

		assertEquals(tickets_with_empty_text.length, 0)
	})
	
	
	it({name: 'test properly excluding records with matching %substring%', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'not like', '%test%')
			.get()

		const tickets_with_test_text = records.filter(record => {
			return (record.title as string).toLowerCase().includes('test')
		})

		assertEquals(tickets_with_test_text.length, 0)
	})

	it({name: 'test %% should return nothing', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'not like', '%%')
			.get()

		assertEquals(records.length, 0)
	})

	it({name: 'test %% should return nothing', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const records = QueryBuilderProxy.from('tickets')
			.where('title', 'not like', '%%')
			.get()

		assertEquals(records.length, 0)
	})

	it({name: 'test %<string>', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
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
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
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
	const QueryBuilderProxy = new QueryBuilder(
		'tickets', JSONDBAdapterProxy
	)
	it({name: 'test starts with', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
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

	it({name: 'test ends  with', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
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
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
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
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
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

describe({name: 'test whereIn clause', ignore: false}, () => {
	it({name: 'where shouldnt include bad ids', ignore: false}, () => {
		const QueryBuilder = make_mock_query('tickets')
		const desirable_ticket_ids = [1,2,3,9]
		const records = QueryBuilder.whereIn('id', desirable_ticket_ids).get()

		const tickets_with_wrong_id = records.filter(record => {
			const id_set = new Set(desirable_ticket_ids)
			return !id_set.has(record.id)
		})

		assertEquals(tickets_with_wrong_id.length, 0)
	})
	
	it({name: 'includes the right ids', ignore: false}, () => {
		const QueryBuilder = make_mock_query('tickets')
		const desirable_ticket_ids = [1,2,3,9]
		const records = QueryBuilder.whereIn('id', desirable_ticket_ids).get()

		const tickets_with_wrong_id = records.filter(record => {
			const id_set = new Set(desirable_ticket_ids)
			return id_set.has(record.id)
		})

		assertEquals(tickets_with_wrong_id.length, 3)
	})
})

describe({name: 'test whereNull', ignore: false}, () => {
	it({name: 'all records have null deleted-at', ignore: false}, () => {
		const QueryBuilder = make_mock_query('tickets')

		const records = QueryBuilder.table('tickets')
			.whereNull('deleted_at')
			.get()

		const valid_records = records.filter(
			record => record.deleted_at === null
		)

		assertGreater(valid_records.length, 0)
	})

	it({name: 'all records have null deleted-at v2', ignore: false}, () => {
		const QueryBuilder = make_mock_query('tickets')

		const records = QueryBuilder.table('tickets')
			.whereNull('deleted_at')
			.get()

		const valid_records = records.filter(
			record => record.deleted_at !== null
		)

		assertEquals(valid_records.length, 0)
	})
})

describe({name: 'multiple wheres', ignore: false}, () => {
	it({name: 'whereIn and whereNull', ignore: false}, () => {
		const QueryBuilder = make_mock_query('tickets')
		const desirable_ticket_ids = [1,2,3,9]
		const records = QueryBuilder
			.whereIn('id', desirable_ticket_ids)
			.whereNull('deleted_at')
			.get()

		const tickets_with_wrong_conditions = records.filter(record => {
			const id_set = new Set(desirable_ticket_ids)
			return !id_set.has(record.id) || record.deleted_at !== null
		})

		assertEquals(tickets_with_wrong_conditions.length, 0)
	})

	it({name: 'whereIn and whereNull', ignore: false}, () => {
		const QueryBuilder = make_mock_query('tickets')
		const desirable_ticket_ids = [1,2,3,9]
		const records = QueryBuilder
			.whereIn('id', desirable_ticket_ids)
			.orWhere('title', 'like', '%milk%')
			.get()


		const tickets_with_wrong_conditions = records.filter(record => {
			const id_set = new Set(desirable_ticket_ids)
			return !id_set.has(record.id) ||
				!record.title.toLowerCase().includes('milk')
		})

		assertEquals(tickets_with_wrong_conditions.length, 4)
	})
})

describe({name: 'test db value is null', ignore: false}, () => {
	it({name: 'like clause', ignore: false}, () => {
		const QueryBuilderProxy = new QueryBuilder(
			'tickets', JSONDBAdapterProxy
		)
		const records = QueryBuilderProxy.from('tickets')
			.where('assigned_to', 'like', '%sarah%')
			.get()
		
		assertEquals(records.length, 1)
	})
})

Deno.test({
	name: 'Error is thrown when select non-existent column',
	ignore: false 
}, () => {
	const QueryBuilder = make_mock_query('Ticket')
	const fn = () => QueryBuilder.select(['lied']).get()
	assertThrows(fn)
})

