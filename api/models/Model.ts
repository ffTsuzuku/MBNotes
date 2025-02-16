import fs from 'node:fs'

export default abstract class  Model {
	protected  static readonly table: string
	protected  static primaryKey = 'id'

	protected  original: Record<string, any>
	protected  attributes: Record<string, any>

	static timestamps = true
	static created_at = 'created_at'
	static deleted_at = 'created_at'


	constructor(attributes: Record<string, any>){
		this.attributes = {...attributes}
		this.original = {...attributes}
	}

	static model_name () {
		return this.name
	}

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

	protected  static get_table(): Record<string, any>[] {
		return this.get_db()[this.table] ?? []
	}

	static async all(): Promise<Model[]> {
		const table = this.get_table()
		//@ts-ignore
		return table.map(record => new this(record))
	}

	static async find<T extends Model> (id: number): Promise<T|undefined> {
		const records = this.get_table()
		const record = records.find(record => record[this.primaryKey] === id) 
		//@ts-ignore
		if(record) return new this(record)

		return undefined
	}
}
