import fs from 'node:fs'
import { deep_copy } from '../core/utility/index.ts'

interface TableSchema {
	records: any[]
	fields: Record<string, string>
}
export type Cast = Record<string, {get?:Function, set?:Function}>

export default abstract class  Model {
	protected  static readonly table: string
	protected  static readonly primaryKey = 'id'

	//the values of the model when instantiated
	protected original: Record<string, any> = {}
	//the current values of the model
	protected attributes: Record<string, any> = {}
	//changes made to the original values (only the last change persist)
	protected changes: Record<string, any> = {}

	protected static cast: Cast

	//does this model has timestamp fields in db
	static timestamps = true
	//name of the field that records timestamps
	static created_at = 'created_at'
	static deleted_at = 'created_at'
	static updated_at = 'updated_at'

	constructor(attributes: Record<string, any>){
		this.attributes = {...attributes}
		this.original = {...attributes}
	}

	//returns the name of the model
	static model_name () {
		return this.name
	}

	static table_name () {
		return this.table ?? this.name
	}

	//stores the entire db file into memory
	protected  static get_db() {
		const ROOT_DIR = process.env.APP_ROOT_DIR 
		if (!ROOT_DIR) {
			console.log(process.env)
			throw new Error('Please define ROOT_DIR in env')
		}
		const PATH =  ROOT_DIR + '/api/db/db.json'
		const file = fs.readFileSync(PATH)
		return JSON.parse(file.toString())
	}

	//stores an entire table into memory
	protected  static get_table(): TableSchema {
		return this.get_db()[this.table_name()] ?? []
	}

	//get all the records in a table
	static async all(): Promise<Model[]> {
		const table = this.get_table()
		//@ts-ignore
		return table.map(record => new this(record))
	}

	//find a specific record in a table
	static async find<T extends Model> (id: number): Promise<T|undefined> {
		const table = this.get_table()
		const records = table.records
		const record = records.find(record => record[this.primaryKey] === id) 
		//@ts-ignore
		if(record) return new this(record)

		return undefined
	}

	//update the value of attributes on a instance
	set_attributes(attributes: Record<string, any>): boolean {
		if (!attributes) return false
		const properties = Object.keys(attributes)
		for(const prop of properties) {
			const caster = (this.constructor.cast as Cast)?.[prop]
			const setter = caster?.set
			const value = setter ? setter(attributes[prop]) : attributes[prop]
			this.changes[prop] = value
			this.attributes[prop] = value
		}
		return true
	}

	//how to display the model
	toJSON(): Object {
		const castedAttributes = deep_copy(this.attributes)
		for (const attribute of Object.keys(this.constructor.cast)) {
			const cast = (this.constructor.cast as Cast)[attribute]
			const getter = cast.get
			const original_value = castedAttributes[attribute]
			const value = getter ? getter(original_value) : original_value
			castedAttributes[attribute] = value 
		}
		return {
			table: this.constructor.table,
			primaryKey: this.constructor.primaryKey,
			original: deep_copy(this.original),
			attributes: castedAttributes,
			changes: deep_copy(this.changes)
		}
	}
}

