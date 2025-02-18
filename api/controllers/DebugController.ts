import {Request, Response} from "express";
import Ticket from "../models/Ticket.ts";

export default class DebugController {
	static async index(request: Request, response: Response) {
		const ticket = await Ticket.find(1)
		if (!ticket) return response.status(404).send("Not found")
		ticket.set_attributes({fake: 'fake stuff', title: 'No fake stuff'})
		ticket.save()
		response.json(Ticket.all())
	}
}
