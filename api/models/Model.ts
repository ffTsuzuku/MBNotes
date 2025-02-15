import fs from 'node:fs'

export default abstract class  Model {
	static readonly table: string
	readonly primaryKey = 'id'

	static timestamps = true
	static created_at = 'created_at'
	static deleted_at = 'created_at'

	constructor(attributes: Partial<Model>){
		Object.assign(this, attributes)
	}

	static async all () {
		const ROOT_DIR = process.env.APP_ROOT_DIR 
		if (!ROOT_DIR) {
			console.log(process.env)
			throw new Error('Please define ROOT_DIR in env')
		}
		const PATH =  ROOT_DIR + '/api/db/db.json'
		const file = fs.readFileSync(PATH)
		const db = JSON.parse(file.toString())
		return db[this.table]
	}
}
