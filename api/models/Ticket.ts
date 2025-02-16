import Model, {Cast} from "./Model.ts"

export default class Ticket extends Model {
	static readonly table = 'tickets'

	constructor(attributes: Partial<Model>) {
		super(attributes)
	}
	
	protected static cast:Cast = {
		title: {
			set: (description: string) => description.toLowerCase(),
			get: (description: string) => description.toLocaleUpperCase()
		},
		id: {
			get: (id: number) => 1000 + id
		}
	}
}
