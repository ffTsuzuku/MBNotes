import {Request, Response} from "express";
import Ticket from "../models/Ticket.ts";

export default class DebugController {
	static async index(request: Request, response: Response) {
		const ticket = new Ticket({title: 'Update Test', id: 1})
		ticket.save()

		const all = Ticket.all()
		console.log(all)
		response.json(all)
	}
}
