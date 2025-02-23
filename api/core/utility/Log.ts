import fs from 'node:fs'

export default class Log {
	constructor() {

	}

	static info(info: string) {
		const ROOT_DIR = process.env.APP_ROOT_DIR 
		if (!ROOT_DIR) {
			console.log(process.env)
			throw new Error('Please define ROOT_DIR in env')
		}
		const PATH =  ROOT_DIR + '/storage/logs/info.log'
		const file = fs.readFileSync(PATH)
	}
	static error(e: Error) {
		const ROOT_DIR = process.env.APP_ROOT_DIR 
		if (!ROOT_DIR) {
			console.log(process.env)
			throw new Error('Please define ROOT_DIR in env')
		}
		const PATH =  ROOT_DIR + '/storage/logs/info.log'
		fs.appendFileSync(PATH, e.message)
		fs.appendFileSync(PATH, e.stack?.toString() ?? '')
	}
}
