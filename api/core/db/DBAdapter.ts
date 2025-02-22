import QueryBuilder from "./QueryBuilder.ts"

export abstract class DBAdapter {
	protected abstract query: QueryBuilder
	
	abstract get(): Record<string, any>[]

	protected abstract apply_wheres(records: Record<string, any>): void
}
