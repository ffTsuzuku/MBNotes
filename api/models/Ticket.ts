import {DateFormat} from "../global/types.ts"
import Model, {Cast} from "./Model.ts"

export default class Ticket extends Model {
	static readonly table = 'tickets'
	protected static soft_deletes =  true

	static dates = ['created_at', 'updated_at']
	static dateFormat: DateFormat = 'DD-MM-YYYY'
	protected appends: string[] = ['test_append']

	protected static cast:Cast = {
		title: {
			set: (description: string) => description.toLowerCase(),
			get: (description: string) => description.toLocaleUpperCase()
		},
	}

	constructor(attributes: Record<string, any>) {
		super(attributes)
	}

	getTestAppendAttribute() {
		return "test"
	}

	protected async before_delete(): Promise<void> {
		console.log(
			'Deleting' +  Ticket.model_name() + this.attributes[Ticket.primaryKey]
		)
	}
	protected async after_delete(): Promise<void> {
		console.log(
			'Deleted' +  Ticket.model_name() + this.attributes[Ticket.primaryKey]
		)
	}
}
