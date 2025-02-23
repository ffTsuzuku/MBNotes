import {QuerySchema, WhereClause} from "../../types/query_builder_types.ts";

export abstract class DBAdapter {
	abstract get(schema: QuerySchema): Record<string, any>[]

	protected abstract apply_wheres(
		records: Record<string, any>,
		wheres: WhereClause[]
	): void
}
