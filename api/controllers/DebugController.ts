import {Request, Response} from "express";
import Ticket from "../models/Ticket.ts";

export default class DebugController {
	static async index(request: Request, response: Response) {
		const ticket = new Ticket({title: 'Shouldnt be added', fakeField: 'fake'})
		ticket.save()
		response.json(Ticket.all())
	}
}
