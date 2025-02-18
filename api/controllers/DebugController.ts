import {Request, Response} from "express";
import Ticket from "../models/Ticket.ts";

export default class DebugController {
	static async index(request: Request, response: Response) {
		const ticket = await Ticket.find(8) as Ticket
		ticket.set_attributes({title: 'Updating My Ticket Title'})
		ticket.delete()

		response.json(Ticket.all())
	}
}
