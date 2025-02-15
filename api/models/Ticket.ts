import Model from "./Model.ts"

export default class Ticket extends Model {
	static readonly table = 'tickets'

	constructor(attributes: Partial<Model>) {
		super(attributes)
	}
}
