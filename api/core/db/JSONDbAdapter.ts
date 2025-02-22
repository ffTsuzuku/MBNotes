import QueryBuilder from "./QueryBuilder.ts";
import fs from 'node:fs'
import { FileDB, TableSchema } from "../../models/Model.ts";
import { DBAdapter } from "./DBAdapter.ts";
import { WhereClause } from "../../types/query_builder_types.ts";
import {DateTime} from 'luxon'

interface StandardizationFlags {
	case_sensitive?: boolean
}
export default class JSONDBAdapter extends DBAdapter {
	protected query: QueryBuilder
	
	constructor(query: QueryBuilder) {
		super()
		this.query = query
	}

	//stores the entire db file into memory
	private get_db(): FileDB {
		const ROOT_DIR = process.env.APP_ROOT_DIR 
		if (!ROOT_DIR) {
			throw new Error('Please define ROOT_DIR in env')
		}
		const PATH =  ROOT_DIR + '/api/db/db.json'
		const file = fs.readFileSync(PATH)
		return JSON.parse(file.toString())
	}

	private get_table(): TableSchema {
		const table = this.query.table
		if (!table) {
			throw new Error('Please define a table')
		}
		return this.get_db()[table] ?? []
	}

	get(): Record<string, any>[] {
		const table =  this.get_table()
		let records = table.records
		//apply joins
		
		//apply wheres
		if(this.query.wheres.length)
			records = this.apply_wheres(records)

		//apply limit

		//apply order
		
		//apply limit
		return records
	}

	/**
	 * Its not always valid to compare two values directly without formatting.
	 * in sql comparing with where on a string makes both strings lower case
	 * before preparing. this type of formatting is necessary before comparing
	 * values. this function will standardize two values based on their typing
	 *
	 * @param v1: first value
	 * @param v2: second value
	 * @return an array consisting of v1 and v2 in that order
	 * */
	private standardize_values<T,V>(
		v1: T, v2: V, flags: StandardizationFlags =  {case_sensitive: false}
	): [any, any] {
		let standardized_values: [any,any] = [v1, v2]

		standardized_values.forEach((value, index) => {
			const is_date = DateTime.fromISO(value as string).isValid
			const is_number = !isNaN(Number(value)) 
			const is_string = typeof value === 'string'
			if (is_date) {
				standardized_values[index] = DateTime.fromISO(
					value as string
				).toMillis()
			} else if (is_number) {
				standardized_values[index] = Number(value)
			} else if (is_string) {
				const {case_sensitive} = flags
				if (case_sensitive) {
					standardized_values[index] = value
				} else {
					standardized_values[index] = value.toLowerCase()
				}
			}
		})
		return standardized_values 
	}

	/**
	 * A function that emulates the exact spec of mysql Like. 
	 * @WARN: MAKE SURE TO CALL standardize_values on inputs before this
	 * @return: returns true if the like matches false otherwise
	 * */
	private perform_like(
		db_val: string,
		query_val: string,
		case_sensitive: boolean = false,
	): boolean {
		if (query_val === '' && (query_val != '' && query_val != null)) {
			return false 
		}
		if (query_val === '' && (query_val === ''|| query_val === null)) {
			return true 
		}
		if (query_val === '%%') {
			return true
		}
		if (!query_val.includes('%')) {
			return db_val === query_val
		}
		if (query_val.startsWith('%') && query_val.endsWith('%')) {
			const sanitized_query_val = query_val.slice(1, query_val.length - 1)
			return db_val.includes(sanitized_query_val)
		}

		const special_regex_chars = new Set(['.', '^', '$', '*', '+', '?', '(', ')', '[', ']', '{', '}', '\\', '|', '/']);
		const escape_char = '\\'
		const zero_or_more_match = '.*'
		const starts_with_match = '^'
		const ends_with_match = '$'

		let safe_regex_string = ''
		for (let i = 0; i < (query_val as string).length; i++) {
			const char = query_val.charAt(i)
			const next = query_val.charAt(i + 1)
			const prev = query_val.charAt(i - 1)

			if (special_regex_chars.has(char)) {
				safe_regex_string += `${escape_char}${char}`
			} else if (char === '%' && prev && next) {
				safe_regex_string += zero_or_more_match
			} else if (char == '%') {
				// remove the percents
				continue
			} else {
				safe_regex_string += char
			}
		}
		if (query_val.startsWith("%")) {
			safe_regex_string = safe_regex_string + ends_with_match
		}
		if (query_val.endsWith("%")) {
			safe_regex_string = starts_with_match + safe_regex_string
		}
		const flags = case_sensitive ? '' : 'i'
		const regex = new RegExp(safe_regex_string, flags)
		return regex.test(db_val)
	}

	private apply_basic_where(
		original_records: Record<string, any>[],
		records: Record<string, any>[],
		where_clause: WhereClause,
	): Record<string, any>[] {
		const { column, operator, value, boolean } = where_clause
		if (!column || !operator || !value) {
			throw Error(`Trying to apply a where on ${column}`)
		}

		const records_to_filter = boolean === 'or' ? original_records : records
		return  records_to_filter.filter(record => {
			let [db_val, query_val] = this.standardize_values(
				record[column], value
			)
			if (operator === '=') {
				return db_val === query_val
			}
			if (operator === '<') {
				return db_val < query_val
			}
			if (operator === '<=') {
				return db_val <= query_val
			}
			if (operator === '>') {
				return db_val > query_val
			}
			if (operator === '>=') {
				return db_val >= query_val
			}
			if (operator === '!=' || operator === '<>') {
				return db_val !== query_val
			}
			if (operator === 'like') {
				return this.perform_like(db_val, query_val)
			}
			if (operator === 'like binary') {
				[db_val, query_val] = this.standardize_values(
					record[column], value, {case_sensitive: true}
				)
				return this.perform_like(db_val, query_val, true)
			}

			throw new Error('Unsupported operator type')
		})
	}

	private apply_where_null_or_not_null(
		original_records: Record<string, any>[],
		records: Record<string, any>[],
		where_clause: WhereClause,
	): Record<string, any>[] {
		const { column, boolean, type} = where_clause
		if (!column) {
			throw Error(`Trying to apply a where null but column isn't specified`) 
		}
		const records_to_filter = boolean === 'or' ? original_records : records
		return records_to_filter.filter(record => {
			if (type === 'Null') {
				return record[column] === null
			}
			if (type === 'NotNull') {
				return record[column] !== null
			}
			return false
		})
	}

	protected apply_wheres(records: Record<string, any>[]) {
		let result: Record<string, any>[]  = []

		const wheres = this.query.wheres
		for (const where of wheres) {
			const records_to_filter = result.length ? result : records
			if (where.type === 'Basic') {
				result.push(
					...this.apply_basic_where(records, records_to_filter, where)
				)
			} else if (where.type === 'Null' || where.type === 'NotNull') {
				result.push(
					...this.apply_where_null_or_not_null(records, records_to_filter, where)
				)
			}
		}
		return result
	}
}
