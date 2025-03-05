export type FieldTypes = 'number' | 
	'float' |
	'string' |
	'blob' |
	'binary' |
	'json' |
	'date' |
	'timestamp' |
	'datetime' |
	'time' |
	'year'

export interface JSONTableSchema {
	records: JSONDBRecord[] 
	fields: {name: string, type: FieldTypes}[]
	last_key: number
}

export type JSONFileDB = Record<string, JSONTableSchema>

export type JSONDBRecord = Record<
	string,
	string | number | boolean | null | object | any[]
>;
