import {DateFormat} from "../global/types.ts"
import Model, {Cast} from "./Model.ts"

export default class Ticket extends Model {
	static readonly table = 'tickets'

	constructor(attributes: Record<string, any>) {
		super(attributes)
	}
	
	static dates = ['created_at', 'updated_at']
	static dateFormat: DateFormat = 'DD-MM-YYYY'
	protected appends: string[] = ['test_append']


	protected static cast:Cast = {
		title: {
			set: (description: string) => description.toLowerCase(),
			get: (description: string) => description.toLocaleUpperCase()
		},
	}

	getTestAppendAttribute() {
		return "test"
	}
}
