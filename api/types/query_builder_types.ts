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
	query?: QueryBuilder,
	column?: string,
	operator?: Operator,
	value?: string|number|(string|number)[],
	boolean?: "and" | "or"
}
