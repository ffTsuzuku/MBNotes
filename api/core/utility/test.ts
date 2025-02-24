import JSONDBAdapter from "../db/JSONDbAdapter.ts";
import default_data from '../../tests/mock_data/sample_data_1.ts'
import QueryBuilder from "../db/QueryBuilder.ts";
import { JSONFileDB, JSONTableSchema } from "../../types/db_types.ts";

/**
 * Decouples testing queries from the database. With this you can
 * provide a json dataset that you can keep static and not worry about
 * test failing when records change in the db
 *
 * @todo: add support for mocking inserts
 * */
export const make_mock_json_db_adapter = (
	data_set: Record<string, JSONTableSchema> = default_data as JSONFileDB
) => {
	const adapter = new JSONDBAdapter()
	return  new Proxy(adapter, {
		get: ((target, prop, proxy) => {
			if (prop === 'get_db') {
				return () => data_set
			}
			return Reflect.get(target, prop, proxy);
		})
	})
}

export const make_mock_query = (
	table_name: string, data_set?: Record<string, JSONTableSchema>
) => {
	const mock_adapter = make_mock_json_db_adapter(data_set)
	return new QueryBuilder(table_name, mock_adapter)
}

