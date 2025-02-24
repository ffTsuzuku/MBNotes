import {
	WhereType,
	WhereClause,
	Operator, 
	QuerySchema
} from "../../types/query_builder_types.ts"
import JSONDBAdapter from "./JSONDbAdapter.ts"
import { DBAdapter } from "./DBAdapter.ts"
import {deep_copy} from "../utility/index.ts"

export default class QueryBuilder {
	private db_adapter: DBAdapter 
	private columns: string[] = []
	private _wheres: WhereClause[] = []
	private _table_name: string|undefined

	constructor(table?: string, adapter?: DBAdapter) {
		this._table_name = table
		// @todo: make sure we make this use dependency injection
		// we check env what db type we using and set adapter accordingly
		this.db_adapter = adapter ? adapter : new JSONDBAdapter()
	}

	static from (table: string): QueryBuilder {
		return new QueryBuilder().from(table)
	}

	/**
	 * Alias to static from to be laravel compliant
	 * */
	static table (table: string): QueryBuilder {
		return new QueryBuilder().from(table)
	}

	from (table: string): QueryBuilder {
		this._table_name = table
		return this
	}

	/*
	 * Alias to from to be laravel compliant
	 * */
	table(table: string): QueryBuilder {
		return this.from(table)
	}

	get table_name (): string|undefined {
		return this._table_name
	}

	get wheres(): WhereClause[] {
		return this._wheres
	}

	get (): Record<string, any>[] {
		return this.db_adapter.get(this.generate_schema())
	}

	static select(fields: string[]): QueryBuilder {
		return new QueryBuilder().select(fields)
	}

	select(fields: string[]): QueryBuilder {
		this.columns = fields
		return this
	}

	static add_select(fields: string[]): QueryBuilder {
		return new QueryBuilder().add_select(fields)
	}

	add_select(fields: string[]): QueryBuilder {
		this.columns.push(...fields)
		return this
	}

	static where(
		column: string,
		operatorOrValue: Operator | string | number,
		potentialValue?: string|number,
		boolean: ("and" | "or") = 'and'
	): QueryBuilder {
		return new QueryBuilder().where(
			column, operatorOrValue, potentialValue, boolean
		)
	}

	where(
		column: string,
		operatorOrValue: Operator | string | number,
		potentialValue?: string|number,
		boolean: ("and" | "or") = 'and'
	): QueryBuilder {
		// in laravel the value param is optional and when not used 
		// defaults the comparision operator to =
		const operator = potentialValue !== undefined ? 
			operatorOrValue as Operator : '='
		let value = potentialValue ? potentialValue : operatorOrValue
		
		this._wheres.push({
			type: "Basic",
			column,
			operator,
			value,
			boolean,
		})

		return this
	}

	static orWhere(
		column: string,
		operatorOrValue: Operator | string | number,
		potentialValue?: string|number,
		boolean = 'and'
	): QueryBuilder {
		return new QueryBuilder()
			.where(column, operatorOrValue, potentialValue, 'or')
	}

	orWhere(
		column: string,
		operatorOrValue: Operator | string | number,
		potentialValue?: string|number,
		boolean = 'and'
	): QueryBuilder {
		return this.where(column, operatorOrValue, potentialValue, 'or')
	}

	private whereNullOrNotNull(
		column: string,
		type: WhereType = 'Null',
		boolean: ("and" | "or") = 'and'
	): QueryBuilder {
		this._wheres.push({
			type,
			column,
			boolean
		})
		return this
	}

	static whereNull(column: string): QueryBuilder {
		return new QueryBuilder().whereNull(column)
	}

	whereNull(column: string): QueryBuilder {
		return this.whereNullOrNotNull(column)
	}

	static whereNotNull(column: string): QueryBuilder {
		return new QueryBuilder().whereNotNull(column)
	}

	whereNotNull(column: string): QueryBuilder {
		return this.whereNullOrNotNull(column, 'NotNull')
	}

	static orWhereNull(column: string): QueryBuilder {
		return new QueryBuilder().orWhereNull(column)
	}

	orWhereNull(column: string): QueryBuilder {
		return this.whereNullOrNotNull(column, 'Null', 'or')
	}

	static orWhereNotNull(column: string): QueryBuilder {
		return new QueryBuilder().orWhereNull(column)
	}

	orWhereNotNull(column: string): QueryBuilder {
		return this.whereNullOrNotNull(column, 'NotNull', 'or')
	}

	private whereInOrNotIn(
		column: string,
		values: (string|number)[],
		type: WhereType = 'In',
		boolean: 'and'|'or' = 'and'
	) {
		this._wheres.push({
			type,
			column,
			value: values,
			boolean
		})
		return this
	}

	static whereIn(column: string, values: (string|number)[]) {
		return new QueryBuilder().whereIn(column, values)
	}

	whereIn(column: string, values: (string|number)[]) {
		return this.whereInOrNotIn(column, values)
	}

	static whereNotIn(column: string, values: (string|number)[]): QueryBuilder {
		return new QueryBuilder().whereNotIn(column, values)
	}

	whereNotIn(column: string, values: (string|number)[]): QueryBuilder {
		return this.whereInOrNotIn(column, values, 'NotIn')
	}

	static orWhereIn(column: string, values: (string|number)[]) {
		return new QueryBuilder().orWhereIn(column, values)
	}

	orWhereIn(column: string, values: (string|number)[]) {
		return this.whereInOrNotIn(column, values, 'In', 'or')
	}

	static orWhereNotIn(column: string, values: (string|number)[]): QueryBuilder {
		return new QueryBuilder().orWhereNotIn(column, values)
	}

	orWhereNotIn(column: string, values: (string|number)[]): QueryBuilder {
		return this.whereInOrNotIn(column, values, 'NotIn', 'or')
	}


	private whereBetweenOrNot(
		column: string,
		min: string|number,
		max: string|number,
		type: WhereType = 'Between',
		boolean: ("and"|"or") = "and"
	) {
		this._wheres.push({
			type,
			column,
			value: [min, max],
			boolean
		})
		return this

	}
	static whereBetween(
		column: string,
		min: string|number,
		max: string|number
	): QueryBuilder {
		return new QueryBuilder().whereBetween(column, min, max)
	}

	whereBetween(
		column: string,
		min: string|number,
		max: string|number
	): QueryBuilder {
		return this.whereBetweenOrNot(column, min, max, 'Between' )
	}

	static whereNotBetween(
		column: string,
		min: string|number,
		max: string|number
	): QueryBuilder {
		return new QueryBuilder().whereNotBetween(column, min, max) 
	}

	whereNotBetween(
		column: string,
		min: string|number,
		max: string|number
	): QueryBuilder {
		return this.whereBetweenOrNot(column, min, max, 'NotBetween' )
	}

	static orWhereBetween(
		column: string,
		min: string|number,
		max: string|number
	): QueryBuilder {
		return new QueryBuilder().orWhereBetween(column, min, max)
	}

	orWhereBetween(
		column: string,
		min: string|number,
		max: string|number
	): QueryBuilder {
		return this.whereBetweenOrNot(column, min, max, 'Between', 'or')
	}

	static orWhereNotBetween(
		column: string,
		min: string|number,
		max: string|number
	): QueryBuilder {
		return new QueryBuilder().orWhereNotBetween(column, min, max) 
	}

	orWhereNotBetween(
		column: string,
		min: string|number,
		max: string|number
	): QueryBuilder {
		return this.whereBetweenOrNot(column, min, max, 'NotBetween', 'or')
	}

	private whereExistOrNotExist (
		fn: () => QueryBuilder,
		type: WhereType = 'Exists',
		boolean: "and" | "or" = 'and',
	) {
		this._wheres.push({query: fn, type, boolean})
		return this
	}

	static whereExist(callback: (query: QueryBuilder) => QueryBuilder): QueryBuilder {
		return new QueryBuilder().whereExist(callback)
	}

	whereExist(callback: (query: QueryBuilder) => QueryBuilder): QueryBuilder {
		const fn = () => callback(new QueryBuilder())
		return this.whereExistOrNotExist(fn)
	}

	static whereNotExist(callback: (query: QueryBuilder) => QueryBuilder): QueryBuilder {
		return new QueryBuilder().whereNotExist(callback)
	}

	whereNotExist(callback: (query: QueryBuilder) => QueryBuilder): QueryBuilder {
		const fn = () => callback(new QueryBuilder())
		return this.whereExistOrNotExist(fn, 'NotExists')
	}

	static orWhereExist(callback: (query: QueryBuilder) => QueryBuilder): QueryBuilder {
		return new QueryBuilder().orWhereExist(callback)
	}

	orWhereExist(callback: (query: QueryBuilder) => QueryBuilder): QueryBuilder {
		const fn = () => callback(new QueryBuilder())
		return this.whereExistOrNotExist(fn, 'Exists', 'or')
	}

	static orWhereNotExist(callback: (query: QueryBuilder) => QueryBuilder): QueryBuilder {
		return new QueryBuilder().orWhereNotExist(callback)
	}

	orWhereNotExist(callback: (query: QueryBuilder) => QueryBuilder): QueryBuilder {
		const fn = () => callback(new QueryBuilder())
		return this.whereExistOrNotExist(fn, 'NotExists', 'or')
	}

	generate_schema(): QuerySchema {
		return {
			table: this.table_name ?? '',
			columns: deep_copy(this.columns),
			wheres: deep_copy(this.wheres),
		}
	}
}

