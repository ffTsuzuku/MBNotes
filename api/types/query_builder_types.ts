import QueryBuilder from "../core/db/QueryBuilder.ts"
export type Operator = 
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

export type WhereType =
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

export type WhereClause = {
	type: WhereType,
	query?: QueryBuilder | (() => QueryBuilder), // nested query
	column?: string,
	operator?: Operator,
	value?: string|number|null|Array<string|number>,
	boolean?: "and" | "or"
}

export type QuerySchema = {
	table: string,
	columns: string[],
	wheres: WhereClause[],
}

