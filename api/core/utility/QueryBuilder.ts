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
	value?: string|number,
	boolean?: "and" | "or"
}

export default class QueryBuilder {
	private columns: string[] = []
	private wheres: WhereClause[] = []

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
}
