import fs from 'node:fs'

export default abstract class  Model {
	static readonly table: string
	static readonly primaryKey = 'id'

	static timestamps = true
	static created_at = 'created_at'
	static deleted_at = 'created_at'

	constructor(attributes: Partial<Model>){
		Object.assign(this, attributes)
	}

	static model_name () {
		return this.name
	}

	private static get_db() {
		const ROOT_DIR = process.env.APP_ROOT_DIR 
		if (!ROOT_DIR) {
			console.log(process.env)
			throw new Error('Please define ROOT_DIR in env')
		}
		const PATH =  ROOT_DIR + '/api/db/db.json'
		const file = fs.readFileSync(PATH)
		return JSON.parse(file.toString())
	}

	private static get_table<T extends Model>(): T[] {
		return this.get_db()[this.table]
	}

	static async all () {
		this.get_table()
	}

	static async find<T extends Model> ( id: number): Promise<T|undefined> {
		const records = this.get_table<T>()
		return records.find(record => record[this.primaryKey] === id)
	}
}
