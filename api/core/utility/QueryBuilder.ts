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

	from (table: string): QueryBuilder {
		this.table = table
		return this
	}

	select(fields: string[]): QueryBuilder {
		this.columns = fields
		return this
	}

	add_select(fields: string[]): QueryBuilder {
		this.columns.push(...fields)
		return this
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

	whereNull(column): QueryBuilder {
		return this.whereNullOrNotNull(column)
	}

	whereNotNull(column: string): QueryBuilder {
		return this.whereNullOrNotNull(column, 'NotNull')
	}

	orWhereNull(column): QueryBuilder {
		return this.whereNullOrNotNull(column, 'Null', 'or')
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

	whereIn(column: string, values: (string|number)[]) {
		return this.whereInOrNotIn(column, values)
	}

	whereNotIn(column: string, values: (string|number)[]): QueryBuilder {
		return this.whereInOrNotIn(column, values, 'NotIn')
	}

	orWhereIn(column: string, values: (string|number)[]) {
		return this.whereInOrNotIn(column, values, 'In', 'or')
	}

	orWhereNotIn(column: string, values: (string|number)[]): QueryBuilder {
		return this.whereInOrNotIn(column, values, 'NotIn', 'or')
	}
}
