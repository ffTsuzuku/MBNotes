import QueryBuilder from "./QueryBuilder.ts";
import fs from 'node:fs'
import { DBAdapter } from "./DBAdapter.ts";
import { QuerySchema, WhereClause } from "../../types/query_builder_types.ts";
import { JSONDBRecord, JSONFileDB, JSONTableSchema } from "../../types/db_types.ts";
import {DateTime} from 'luxon'

interface StandardizationFlags {
	case_sensitive?: boolean
}
export default class JSONDBAdapter extends DBAdapter {
	constructor() {
		super()
	}

	//stores the entire db file into memory
	public get_db(): JSONFileDB {
		const DB = process.env.DB_DATABASE
		if (!DB) {
			throw new Error('Please define ROOT_DIR in env')
		}
		const file = fs.readFileSync(DB)
		return JSON.parse(file.toString())
	}

	get_table(table_name: string): JSONTableSchema {
		if (!table_name) {
			throw new Error('Please define a table')
		}
		return this.get_db()[table_name] ?? []
	}

	get(query_schema: QuerySchema): JSONDBRecord[] {
		const { table: table_name, wheres, columns} = query_schema
		const table =  this.get_table(table_name)
		let records = table.records
		const fields = new Set(Object.keys(table.fields))

		for (const column of columns) {
			if (!fields.has(column)) {
				throw new Error(
					`Field ${column} does not exist on table ${table_name}`
				)
			}
		}


		//apply joins
		//apply wheres
		if(wheres.length)
			records = this.apply_wheres(records, wheres)

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
			const is_number = value !== null && !isNaN(Number(value)) 
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
		flags: {
			case_sensitive?: boolean,
			not_like?: boolean,
			rlike?: boolean
		} = {
			case_sensitive: false, not_like: false, rlike: false
		}
	): boolean {
		const {case_sensitive = false, not_like = false, rlike = false} = flags

		if (!rlike && typeof query_val === 'number') {
			if (not_like) {
				return db_val !== query_val
			}
			console.log({db_val, query_val})
			return db_val === query_val
		}
		if (!rlike && query_val === '' && (db_val != '' && db_val != null)) {
			if (not_like) {
				return true
			}
			return false 
		}
		if (!rlike && query_val === '' && (db_val === ''|| db_val === null)) {
			if (not_like) {
				return false
			}
			return true 
		}
		if (!rlike && query_val === '%%') {
			if (not_like) {
				return false
			}
			return true
		}
		if (!rlike && !query_val.includes('%')) {
			if (not_like) {
				return db_val !== query_val
			}
			return db_val === query_val
		}
		if (!rlike && query_val.startsWith('%') && query_val.endsWith('%')) {
			if (not_like) {
				return false
			}
			const sanitized_query_val = query_val.slice(1, query_val.length - 1)
			return db_val?.includes(sanitized_query_val)
		}

		const special_regex_chars = new Set(['.', '^', '$', '*', '+', '?', '(', ')', '[', ']', '{', '}', '\\', '|', '/']);
		const escape_char = '\\'
		const zero_or_more_match = '.*'
		const starts_with_match = '^'
		const ends_with_match = '$'

		let safe_regex_string = rlike ? query_val : ''
		if (!rlike) {
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
		}
		const regex_flags = case_sensitive ? '' : 'i'
		const regex = new RegExp(safe_regex_string, regex_flags)
		if (not_like) {
			return !regex.test(db_val)
		}
		//console.log({regex_flags, safe_regex_string, db_val, not_like, regex})
		return regex.test(db_val)
	}

	//@todo: we need to make it so that all functions called take in a new 
	//type called StandardizedValue which has properties. 
	// {original_value, standardized_value}
	private apply_basic_where(
		original_records: JSONDBRecord[],
		records: JSONDBRecord[],
		where_clause: WhereClause,
	): JSONDBRecord[] {
		const { column, operator, value, boolean } = where_clause
		if (!column || !operator || value === undefined) {
			throw Error(`Trying to apply a where on ${column}`)
		}

		const records_to_filter = boolean === 'or' ? original_records : records
		return  records_to_filter.filter(record => {
			let [db_val, query_val] = this.standardize_values(
				record[column], value
			)
			if (operator === '=') {
				// equal operator is not null safe, use <=> operator for that
				if (db_val === null && query_val === null) {
					return false
				}
				return db_val === query_val
			}
			if (operator === '<=>') {
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
			if (operator === 'like' || operator === 'ilike') {
				return this.perform_like(db_val, query_val)
			}
			if (operator === 'not like') {
				return this.perform_like(db_val, query_val, {not_like: true})
			}
			if (operator === 'like binary') {
				[db_val, query_val] = this.standardize_values(
					record[column], value, {case_sensitive: true}
				)
				return this.perform_like(
					db_val, query_val, {case_sensitive: true}
				)
			}
			if (operator === 'rlike') {
				[db_val, query_val] = this.standardize_values(
					record[column], value, 
				)
				return this.perform_like(
					db_val, query_val, {rlike: true}
				)
			}

			if (operator === 'not rlike') {
				[db_val, query_val] = this.standardize_values(
					record[column], value, 
				)
				return this.perform_like(
					db_val, query_val, {rlike: true, not_like: true}
				)
			}
			if (operator === 'ilike') {
			}


			throw new Error('Unsupported operator type')
		})
	}

	private apply_where_null_or_not_null(
		original_records: Record<string, any>[],
		records: Record<string, any>[],
		where_clause: WhereClause,
	): JSONDBRecord[] {
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

	private apply_where_in_or_not_in(
		original_records: JSONDBRecord[],
		records: JSONDBRecord[],
		where_clause: WhereClause,
	): JSONDBRecord [] {
		const { boolean, column, type, value } = where_clause

		if (!column) {
			throw new Error('Please specify column for whereIn clause')
		}

		let records_to_filter = boolean === 'or'  ? original_records : records
		if (!Array.isArray(value)) {
			throw new Error(`${type} clause expects an array value`)
		}
		const value_set = new Set(value)
		return records_to_filter.filter(record => {
			if (
				typeof record[column] !== 'number' &&
				typeof record[column]!== 'string'
			) {
				return false
			}
			if (type === 'In') {
				return value_set.has(record[column])
			}
			return !value_set.has(record[column])
		})
	}

	protected apply_wheres(
		records: JSONDBRecord[], wheres: WhereClause[]
	) {
		let result: Record<string, any>[]  = []

		for (const where of wheres) {
			const records_to_filter = result.length ? result : records
			let filter_result: JSONDBRecord[] = []
			if (where.type === 'Basic') {
				filter_result = this.apply_basic_where(
					records, records_to_filter, where
				)
			} else if (where.type === 'Null' || where.type === 'NotNull') {
				filter_result = this.apply_where_null_or_not_null(
					records, records_to_filter, where
				)
			} else if (where.type === 'In') {
				filter_result = this.apply_where_in_or_not_in(
					records, records_to_filter, where
				)
			}

			if (where.boolean === 'or') {
				result.push(...filter_result)
			} else {
				result = filter_result
			}
		}
		return result
	}
}
