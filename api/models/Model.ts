import fs from 'node:fs'
import { deep_copy } from '../core/utility/index.ts'
import {DateFormat} from '../global/types.ts'
import dayjs from 'dayjs'

interface TableSchema {
	records: any[]
	fields: Record<string, string>
}
export type Cast = Record<string, {get?:Function, set?:Function}>

export default abstract class  Model {
	//helps remove type warnings when accessing static properties on nonstatic methods
	private STATIC = this.constructor as typeof Model
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
	//how dates will be persisted to db or formated when model is serialized
	static dateFormat: DateFormat = 'YYYY-MM-DDTHH:mm:ssZ'
	static dates: string[] = []

	constructor(attributes: Record<string, any>){
		const castedAttributes = this.STATIC.cast_attributes(attributes)
		this.attributes = castedAttributes 
		this.original = deep_copy(attributes)
	}

	//returns the name of the model
	static model_name () {
		return this.name
	}

	//attempts to resolve the models corresponding table name
	static table_name () {
		// the fallback is class name + s e.g user becomes users
		return this.table ?? `${this.name.toLowerCase()}s`
	}
	//stores the entire db file into memory
	protected  static get_db() {
		const ROOT_DIR = process.env.APP_ROOT_DIR 
		if (!ROOT_DIR) {
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
			const caster = (this.STATIC.cast)?.[prop]
			const setter = caster?.set
			const value = setter ? setter(attributes[prop]) : attributes[prop]
			this.changes[prop] = value
			this.attributes[prop] = value
		}
		return true
	}

	/**
	 * Cast the values of the model based on the casting rules & other factors
	 * @param attributes: the attributes to cast
	 * @param forSerialization: when true it changes how casting is done 
	 * for example the dates property will be ignored and instead the dateFormat
	 * property will be used
	 * */
	protected static cast_attributes(
		attributes: Record<string, any>,
		forSerialization = false
	): (Record<string, any>|Error) {
		if (!Object.keys(attributes).length) return {}

		const copy = deep_copy(attributes)

		// first we follow the casting rules
		const cast = this.cast as Cast
		const castables = Object.keys(cast ?? {})
		for (const castable of castables) {
			const getter = cast[castable].get
			const original = copy[castable]
			copy[castable] =  getter ? getter(original) : original
		}

		//next we transform any dates specified in the dates property
		for (const date_field of this.dates) {
			if (!(date_field in copy)) {
				throw new Error(`${date_field} marked for casting, but does not exist on model`)
			}
			if (forSerialization) {
				copy[date_field] = dayjs(new Date(copy[date_field])).format(
					this.dateFormat
				)
			} else {
				copy[date_field] = new Date(copy[date_field])
			}
		}

		return copy
	}

	//how to display the model
	toJSON(): Object {
		// cast whatever attributes specified 
		const castedAttributes = this.STATIC.cast_attributes(
			this.attributes, true
		)
		return {
			table: this.STATIC.table_name(),
			primaryKey: this.STATIC.primaryKey,
			attributes: castedAttributes,
		}
	}
}

