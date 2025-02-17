import {Request, Response} from "express";
import Ticket from "../models/Ticket.ts";

export default class DebugController {
	static async index(request: Request, response: Response) {
		const ticket = await Ticket.find(1) as Ticket
		console.log('find result', ticket)
		ticket.set_attributes({title: 'Updating My Ticket Title'})
		const result = ticket.update()
		console.log('update result', result)

		const all = Ticket.all()
		console.log(all)
		response.json(all)
	}
}
