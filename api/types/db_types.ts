export interface JSONTableSchema {
	records: any[]
	fields: {name: string, type: string}[]
	last_key: number
}

export type JSONFileDB = Record<string, JSONTableSchema>
