import QueryBuilder from "./QueryBuilder.ts";
import fs from 'node:fs'
import { DBAdapter } from "./DBAdapter.ts";
import { QuerySchema, WhereClause } from "../../types/query_builder_types.ts";
import { FieldTypes, JSONDBRecord, JSONFileDB, JSONTableSchema } from "../../types/db_types.ts";
import {DateTime} from 'luxon'
import {is_date, parse_hex} from "../utility/index.ts";
import { DateFormat } from "../../types/types.ts";

interface StandardizationFlags {
	case_sensitive?: boolean
	hex_format?: 'string'|'number'|undefined
}
export default class JSONDBAdapter extends DBAdapter {
	private table: JSONTableSchema|undefined = undefined

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

		this.table = table

		//apply joins
		//apply wheres
		if(wheres.length) {
			records = this.apply_wheres(wheres)
		}

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
	 * When an operator is used with operands of different types, type 
	 * conversion occurs to make the operands compatible for comparision.
	 *
	 * @param T: v1 is the first operand
	 * @param V: v2 is the second operand
	 * @return [v1, v2] casted
	 * @docs https://dev.mysql.com/doc/refman/5.7/en/type-conversion.html
	 * */
	private standardize_inputs_for_comparision<T,V>(
		db_val: T, 
		query_val: V,
		db_type: FieldTypes,
		flags: StandardizationFlags =  {
			case_sensitive: false,
		}
	): [any, any] {
		const {case_sensitive} = flags

		if (db_val === undefined || db_val === null) {
			//mix and match so that they never eval to true using direct comparision
			return [null, query_val]
		}
		if (query_val === undefined || query_val === null) {
			return [db_val, null]
		}
		
		if (db_type === 'number' || db_type == 'float') {
			if (typeof query_val === 'number') {
				return [db_val, query_val]
			}

			if (typeof query_val === 'string') {
				const as_float = parseFloat(query_val)
				const as_number = parseInt(query_val)
				if (as_float % 1 === 0) {
					return [db_val, as_float]
				} else if (Number.isInteger(as_number)) {
					return [db_val, as_number]
				}
				return [db_val, 0]
			}
		}

		else if (db_type === 'string') {
			if (parse_hex(db_val as string)) {
				return [
					parse_hex(db_val as string, 'number'),
					parse_hex(query_val as string, 'number')
				]
			}
			if (Number.isInteger(query_val)) {
				return [parseInt(db_val as string), query_val]
			} 
			if (parseFloat(query_val as  string)) {
				return [parseFloat(db_val as string), query_val]
			}
			if (typeof query_val === 'string') {
				if (case_sensitive) {
					return [db_val, query_val]
				}
				return [(db_val as string).toLowerCase(), query_val.toLowerCase()]
			}
		}

		else if (db_type === 'binary') {
			if (parse_hex(db_val as string)) {
				return [
					parse_hex(db_val as string, 'number'),
					parse_hex(query_val as string, 'number')
				]
			}
		}

		else if (db_type === 'json') {

		}

		else if (db_type === 'date') {
			return [
				DateTime.fromISO(db_val as string).toFormat('YYYY-MM-DD'),
				DateTime.fromISO(query_val as string).toFormat('YYYY-MM-DD'),
			]
		}

		else if (db_type === 'timestamp') {
			return [
				DateTime.fromISO(db_val as string).toMillis(),
				DateTime.fromISO(query_val as string).toMillis(),
			]
		}

		else if (db_type === 'datetime') {
			const format: DateFormat = 'YYYY-MM-DD HH:mm:ss'
			return [
				DateTime.fromISO(db_val as string).toFormat(format),
				DateTime.fromISO(query_val as string).toFormat(format),
			]
		}

		else if (db_type === 'time') {
			const format: DateFormat = 'HH:mm:ss'
			return [
				DateTime.fromISO(db_val as string).toFormat(format),
				DateTime.fromISO(query_val as string).toFormat(format),
			]
		}

		else if (db_type === 'year') {
			const format: DateFormat = 'YYYY'
			return [
				DateTime.fromISO(db_val as string).toFormat(format),
				DateTime.fromISO(query_val as string).toFormat(format),
			]
		}

		//blob fields /  cases where conversions arent neded
		return [db_val, query_val]
	}

	/**
	 * A function that emulates the exact spec of mysql Like. 
	 * @WARN: MAKE SURE TO CALL standardize_values on inputs before this
	 * @return: returns true if the like matches false otherwise
	 * */
	private perform_like(
		db_val: string|undefined,
		query_val: string|undefined,
		flags: {
			case_sensitive?: boolean,
			not_like?: boolean,
			rlike?: boolean
		} = {
			case_sensitive: false, not_like: false, rlike: false
		}
	): boolean {
		if (db_val === undefined || query_val === undefined) {
			return false
		}
		const {case_sensitive = false, not_like = false, rlike = false} = flags

		if (!rlike && typeof query_val === 'number') {
			if (not_like) {
				return db_val !== query_val
			}
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
		return regex.test(db_val)
	}

	private get_field_type(column: string): FieldTypes {
		if(!this.table) {
			throw new Error("Table isn't set. Cannot retrieve field type")
		}

		const { fields } = this.table
		const field_info = fields.find(field => {
			return  field.name === column
		})

		if (!field_info) {
			throw new Error(`Table Schema is missing field information for ${column}`)
		}
		const { type: field_type } = field_info!
		return field_type
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

		if (!this.table) {
			throw new Error('JSONDBAdapter missing table data')
		}

		const field_type = this.get_field_type(column)
		const records_to_filter = boolean === 'or' ? original_records : records
		return  records_to_filter.filter(record => {
			let [db_val, query_val] = this.standardize_inputs_for_comparision(
				record[column], value, field_type
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
			if (operator === 'not like' || operator === 'not ilike') {
				return this.perform_like(db_val, query_val, {not_like: true})
			}
			if (operator === 'like binary') {
				[db_val, query_val] = this.standardize_inputs_for_comparision(
					record[column], value, field_type, {case_sensitive: true}
				)
				return this.perform_like(
					db_val, query_val, {case_sensitive: true}
				)
			}
			if (
				operator === 'rlike' ||
				operator === 'similar to' ||
				operator == 'regexp'
			) {
				[db_val, query_val] = this.standardize_inputs_for_comparision(
					record[column], value, field_type
				)
				return this.perform_like(
					db_val, query_val, {rlike: true}
				)
			}
			if (
				operator === 'not rlike' ||
				operator === 'not similar to' ||
				operator === 'not regexp' ||
				operator === '!~'
			) {
				[db_val, query_val] = this.standardize_inputs_for_comparision(
					record[column], value, field_type
				)
				return this.perform_like(
					db_val, query_val, {rlike: true, not_like: true}
				)
			}
			if (operator === '!~*') {
				[db_val, query_val] = this.standardize_inputs_for_comparision(
					record[column], value, field_type
				)
				return this.perform_like(
					db_val, query_val, {
						rlike: true,
						not_like: true,
						case_sensitive: true
					}
				)
			}
			if (operator === '&') {
				return db_val & query_val
			}
			if (operator === '|') {
				return db_val | query_val
			}
			if (operator === '^') {
				return db_val ^ query_val
			}
			if (operator === '<<') {
				return db_val << query_val
			}
			if (operator === '>>') {
				return db_val << query_val
			}
			if (operator === '&~') {
				return db_val &~ query_val
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

	private apply_where_between_or_not_between(
		original_records: JSONDBRecord[],
		records: JSONDBRecord[],
		where_clause: WhereClause,
	): JSONDBRecord[] {
		const { boolean, column, type, value } = where_clause

		if (!column) {
			throw new Error('Please specify column for whereIn clause')
		}

		let records_to_filter = boolean === 'or'  ? original_records : records
		if (!Array.isArray(value)) {
			throw new Error(`${type} clause expects an array value`)
		}
		const [min, max] = value
		const field_type = this.get_field_type(column)
		return records_to_filter.filter(record => {
			const value = record[column]
			const [db_val, standard_max] = this.standardize_inputs_for_comparision(
				value, max, field_type
			)
			const [_, standard_min] = this.standardize_inputs_for_comparision(
				value, min, field_type
			)
			if (db_val === null || db_val === undefined) {
				return false
			}
			if (type === 'Between') {
				return db_val >= standard_min && db_val <= standard_max
			}
			return db_val < standard_min && db_val > standard_max
		})
	}

	protected apply_wheres(
		wheres: WhereClause[]
	) {
		if (!this.table) {
			throw new Error('JSONDBAdapter missing table data')
		}
		const {records} = this.table

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
			} else if (where.type === 'NotIn') {
				filter_result = this.apply_where_in_or_not_in(
					records, records_to_filter, where
				)
			} else if (where.type === 'Between') {
				filter_result = this.apply_where_between_or_not_between(
					records, records_to_filter, where
				)
			} else {
				throw new Error('Unsupported where clause')
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
