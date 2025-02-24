export interface JSONTableSchema {
	records: JSONDBRecord[] 
	fields: {name: string, type: string}[]
	last_key: number
}

export type JSONFileDB = Record<string, JSONTableSchema>

export type JSONDBRecord = Record<
	string,
	string | number | boolean | null | object | any[]
>;
