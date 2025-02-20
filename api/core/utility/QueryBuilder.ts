type Operator = 
  |   "="
  |  "<"
  |  ">"
  |  "<="
  |  ">="
  |  "<>"
  |  "!="
  |  "<=>"
  |  "like"
  |  "like binary"
  |  "not like"
  |  "ilike"
  |  "&"
  |  "|"
  |  "^"
  |  "<<"
  |  ">>"
  |  "&~"
  |  "is"
  |  "is not"
  |  "rlike"
  |  "not rlike"
  |  "regexp"
  |  "not regexp"
  |  "~"
  |  "~*"
  |  "!~"
  |  "!~*"
  |  "similar to"
  |  "not similar to"
  |  "not ilike"

type WhereType =
  | "Basic"
  | "Nested"
  | "Null"
  | "NotNull"
  | "In"
  | "NotIn"
  | "Between"
  | "NotBetween"
  | "Exists"
  | "NotExists"
  | "Column"

type WhereClause = {
	type: WhereType,
	query?: QueryBuilder,
	column?: string,
	operator?: Operator,
	value?: string|number|(string|number)[],
	boolean?: "and" | "or"
}

export default class QueryBuilder {
	private columns: string[] = []
	private wheres: WhereClause[] = []
	private table: string|undefined

	constructor(table?: string) {
		this.table = table
	}

	static from (table: string): QueryBuilder {
		return new QueryBuilder().from(table)
	}

	from (table: string): QueryBuilder {
		this.table = table
		return this
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
		const operator = potentialValue !== undefined ? 
			operatorOrValue as Operator : '='
		let value = potentialValue ? potentialValue : operatorOrValue
		
		this.wheres.push({
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
		this.wheres.push({
			type,
			column,
			boolean
		})
		return this
	}

	static whereNull(column): QueryBuilder {
		return new QueryBuilder().whereNull(column)
	}

	whereNull(column): QueryBuilder {
		return this.whereNullOrNotNull(column)
	}

	static whereNotNull(column: string): QueryBuilder {
		return new QueryBuilder().whereNotNull(column)
	}

	whereNotNull(column: string): QueryBuilder {
		return this.whereNullOrNotNull(column, 'NotNull')
	}

	static orWhereNull(column): QueryBuilder {
		return new QueryBuilder().orWhereNull(column)
	}

	orWhereNull(column): QueryBuilder {
		return this.whereNullOrNotNull(column, 'Null', 'or')
	}

	static orWhereNotNull(column): QueryBuilder {
		return new QueryBuilder().orWhereNull(column)
	}

	orWhereNotNull(column): QueryBuilder {
		return this.whereNullOrNotNull(column, 'NotNull', 'or')
	}

	private whereInOrNotIn(
		column: string,
		values: (string|number)[],
		type: WhereType = 'In',
		boolean: 'and'|'or' = 'and'
	) {
		this.wheres.push({
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
}
