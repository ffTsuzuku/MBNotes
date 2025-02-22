import QueryBuilder from "./QueryBuilder.ts";
import fs from 'node:fs'
import { FileDB, TableSchema } from "../../models/Model.ts";
import { DBAdapter } from "./DBAdapter.ts";
import {WhereClause} from "../../types/query_builder_types.ts";
import {DateTime} from 'luxon'
import {DateFormat} from "../../types/types.ts";

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
		records = this.applyWheres(records)

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
	private sandardize_values<T,V>(v1: T, v2: V): [any, any] {
		let standardized_values: [any,any] = [v1, v2]

		standardized_values.forEach((value, index) => {
			const is_date = DateTime.fromISO(value as string).isValid
			const is_number = !isNaN(Number(value)) 
			const is_string = typeof value === 'string'
			if (is_date) {
				const format: DateFormat = 'YYYY-MM-DD HH:mm:ss'
				standardized_values[index] = DateTime.fromFormat(
					value as string, format
				)
			} else if (is_number) {
				standardized_values[index] = Number(value)
			} else if (is_string) {
				standardized_values[index] = value.toLowerCase()
			}
		})
		return standardized_values 
	}

	private applyBasicWhere(
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
			const [db_val, query_val] = this.sandardize_values(
				record[column], value
			)
			if (operator === '=') {
				console.log({db_val, query_val, match: db_val === query_val})
				return db_val === query_val
			}

			if (operator == '<>') {
				return record[column] < value
			}

			return false
		})
	}

	protected applyWheres(records: Record<string, any>[]) {
		let result: Record<string, any>[]  = []

		const wheres = this.query.wheres
		for (const where of wheres) {
			const records_to_filter = result.length ? result : records
			if (where.type === 'Basic') {
				result.push(
					...this.applyBasicWhere(records, records_to_filter, where)
				)
			}
		}

		return result
	}
}
