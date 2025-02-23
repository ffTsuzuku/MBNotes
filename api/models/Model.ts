import fs from 'node:fs'
import { deep_copy } from '../core/utility/index.ts'
import {DateFormat} from '../types/types.ts'
import dayjs from 'dayjs'
import Log from '../core/utility/Log.ts'
import QueryBuilder from '../core/db/QueryBuilder.ts'
import { JSONTableSchema, JSONFileDB } from '../types/db_types.ts'

export type Cast = Record<string, {get?:Function, set?:Function}>

export type Model = BaseModel & QueryBuilder

export default abstract class  BaseModel {
	//helps remove type warnings when accessing static properties on nonstatic methods
	private readonly STATIC = this.constructor as typeof BaseModel
	protected  static readonly table: string
	protected  static readonly primaryKey = 'id'

	protected static  readonly soft_deletes: boolean = false
	//the values of the BaseModel when instantiated
	protected original: Record<string, any> = {}
	//the current values of the BaseModel
	protected attributes: Record<string, any> = {}
	//changes made to the original values (only the last change persist)
	protected changes: Record<string, any> = {}

	protected static cast: Cast
	protected appends: string[] = []

	protected fillable: string[] = []
	protected guarded: string[] = []

	//does this BaseModel has timestamp fields in db
	static timestamps = true
	//name of the field that records timestamps
	protected static readonly  created_at = 'created_at'
	protected static readonly deleted_at  = 'deleted_at'
	protected static readonly updated_at = 'updated_at'
	//how dates will be persisted to db or formated when BaseModel is serialized
	static dateFormat: DateFormat = 'YYYY-MM-DDTHH:mm:ssZ'
	//the fields in this array will have their values transformed to Date objects
	static dates: string[] = []

	protected async before_delete(): Promise<void> {}
	protected async after_delete(): Promise<void>  {}

	private query_builder: QueryBuilder

	constructor(attributes: Record<string, any>){
		const castedAttributes = this.STATIC.cast_attributes(attributes)
		this.attributes = castedAttributes 
		this.original = deep_copy(attributes)

		this.query_builder = new QueryBuilder()

		return new Proxy(this as BaseModel, {
			get (target, prop) {
				if (prop in target) {
					//@ts-ignore
					return target[prop]
				} else if (prop in target.query_builder) {
					//@ts-ignore
					return target.query_builder[
						prop as keyof QueryBuilder 
						//@ts-ignore
					].bind(target.query_builder)
				}
			}
		}) as BaseModel & QueryBuilder
	}

	//returns the name of the BaseModel
	static model_name () {
		return this.name
	}

	//attempts to resolve the BaseModels corresponding table name
	static table_name () {
		// the fallback is class name + s e.g user becomes users
		return this.table ?? `${this.name.toLowerCase()}s`
	}

	//stores the entire db file into memory
	// @todo: Delete this once added EloquentQuery class created
	protected  static get_db(): JSONFileDB {
		const DB = process.env.DB_DATABASE
		if (!DB) {
			throw new Error('Please define ROOT_DIR in env')
		}
		const file = fs.readFileSync(DB)
		return JSON.parse(file.toString())
	}

	//stores an entire table into memory
	// @todo: Delete this once added EloquentQuery class created
	protected  static get_table(): JSONTableSchema {
		return this.get_db()[this.table_name()] ?? []
	}

	// @todo: Delete this once added EloquentQuery class created
	private static update_db(db: JSONFileDB)  {
		const DB = process.env.DB_DATABASE
		if (!DB) {
			throw new Error('Please define ROOT_DIR in env')
		}
		fs.writeFileSync(DB, JSON.stringify(db))
	}

	//get all the records in a table
	// @todo: Delete this once added EloquentQuery class created
	static all(): BaseModel[] {
		const table = this.get_table()
		const records = table.records
		//@ts-ignore
		return records.map(record => new this(record))
	}

	//find a specific record in a table
	static async find<T extends BaseModel> (
		id: number
	): Promise<(Model)|undefined> {
		const table = this.get_table()
		const records = table.records
		const record = records.find(record => record[this.primaryKey] === id) 
		//@ts-ignore
		if(record) return new this(record)
		return undefined
	}

	save<T extends BaseModel>(): boolean {
		try {
			const db = this.STATIC.get_db()
			const table = db[this.STATIC.table_name()]
			const records = table.records ?? []

			//are we updating or inserting?
			const primary_key = this.STATIC.primaryKey
			const id = this.attributes[primary_key]
			const exisiting_record = records.find(record => {
				return record[primary_key] === id
			})
			const attributes = this.attributes
			const copy = deep_copy(attributes)

			// not let the BaseModel set / populate fields that are blocked
			// if a field is in fillable but also guarded, guarded take 
			// prescedence
			const fillable_fields = new Set<string>(this.fillable)
			const guarded_fields = new Set<string>(this.guarded)
			const available_fields = new Set<string>(
				table.fields.map(field => field.name)
			)
			for (const property of Object.keys(copy)) {
				const is_guarded = guarded_fields.has(property)
				const is_fillable = fillable_fields.has(property)
				const check_fillable = fillable_fields.size > 0
				const is_db_field = available_fields.has(property)
				if (
					(!is_fillable && check_fillable) ||
					is_guarded ||
					!is_db_field
				) {
					delete copy[property]
				}
			}

			if(this.STATIC.timestamps) {
				const format: DateFormat = 'YYYY-MM-DDTHH:mm:ssZ'
				const now = dayjs().format(format)
				if (!exisiting_record) {
					copy[this.STATIC.created_at] = now
				}
				copy[this.STATIC.updated_at] = now
				copy[this.STATIC.deleted_at] = null 
			}

			if (exisiting_record) {
				Object.assign(exisiting_record, copy)
			} else {
				copy[primary_key] = ++table.last_key
				records.push(copy)
			}
			this.STATIC.update_db(db)
			return true 
		} catch (e) {
			//@ts-ignore
			Log.error(e)
			return false
		}
	}
	
	update(): boolean {
		try {
			const db = this.STATIC.get_db()
			const table = db[this.STATIC.table_name()]
			const records = table.records ?? []

			//are we updating or inserting?
			const primary_key = this.STATIC.primaryKey
			const id = this.attributes[primary_key]
			const exisiting_record = records.find(record => {
				return record[primary_key] === id
			})

			if (!exisiting_record) { 
				throw new Error('Record does not exist')
			}
			const attributes = deep_copy(this.attributes)
			// not let the BaseModel set / populate fields that are blocked
			// if a field is in fillable but also guarded, guarded take 
			// prescedence
			const fillable_fields = new Set<string>(this.fillable)
			const guarded_fields = new Set<string>(this.guarded)
			const available_fields = new Set<string>(
				table.fields.map(field => field.name)
			)
			for (const property of Object.keys(attributes)) {
				const is_guarded = guarded_fields.has(property)
				const is_fillable = fillable_fields.has(property)
				const check_fillable = fillable_fields.size > 0
				const is_db_field = available_fields.has(property)
				if (
					(!is_fillable && check_fillable) ||
					is_guarded ||
					!is_db_field
				) {
					delete attributes[property]
				}
			}
			if(this.STATIC.timestamps) {
				const format: DateFormat = 'YYYY-MM-DDTHH:mm:ssZ'
				const now = dayjs().format(format)
				attributes[this.STATIC.updated_at] = now
			}
			Object.assign(exisiting_record, this.attributes)
			this.STATIC.update_db(db)
			return true
		} catch (e) {
			console.log(e)
			return false
		}
	}

	delete():boolean {
		try {
			const db = this.STATIC.get_db()
			const table = db[this.STATIC.table_name()]
			const records = table.records ?? []

			//are we updating or inserting?
			const primary_key = this.STATIC.primaryKey
			const id = this.attributes[primary_key]
			let existing_record_index: number|undefined = undefined
			const exisiting_record = records.find((record, index) => {
				const match = record[primary_key] === id
				if (match) existing_record_index = index
				return  match
			})

			if (exisiting_record === undefined) { 
				throw new Error('Record does not exist')
			}
			this.before_delete()
			if (this.STATIC.soft_deletes) {
				exisiting_record[this.STATIC.deleted_at] = dayjs().format(
					this.STATIC.dateFormat
				)
			} else {
				records.splice(existing_record_index!, 1)
			}
			this.STATIC.update_db(db)
			this.after_delete()
			return true
		} catch (e) {
			return false
		}
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
	 * Cast the values of the BaseModel based on the casting rules & other factors
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
				continue
				//throw new Error(`${date_field} marked for casting, but does not exist on BaseModel`)
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

	/**
	 * serializes the BaseModel for display purposes
	 * */
	toJSON(): Object {
		// cast whatever attributes specified 
		const castedAttributes = this.STATIC.cast_attributes(
			this.attributes, true
		)
		const data = {
			table: this.STATIC.table_name(),
			primaryKey: this.STATIC.primaryKey,
			attributes: castedAttributes,
		}
		const appendValues = {}
		for(const key of this.appends) {
			const snakeCaseKey = key.split('_').reduce((prev, curr) => {
				return prev + curr.charAt(0).toUpperCase() + curr.slice(1)
			}, '')
			const function_name = `get${snakeCaseKey}Attribute`
			//@ts-ignore
			const value = this[function_name]?.()
			// @ts-ignore
			appendValues[key] = value
		}
		Object.assign(data.attributes, appendValues)
		return data
	}
}

