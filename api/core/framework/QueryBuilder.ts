class QueryBuilder {
	protected columns: string[] = []

	select(fields): QueryBuilder {
		this.columns = fields
		return this
	}
}
