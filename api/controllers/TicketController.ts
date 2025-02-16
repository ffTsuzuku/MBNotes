import {Request, Response} from "express";
import Ticket from "../models/Ticket.ts";

export default class TicketController {
	public static async all(request: Request, response: Response) {
		try {
			const tickets = await Ticket.all()
			response.json({data: tickets})
		} catch (e: any) {
			response.json({error: e.message})
		}
	}

	public static async find(request: Request, response: Response) {
		const params = request.params
		const ticketId =  parseInt(params.ticket)
		try {
			const ticket = await Ticket.find(ticketId)
			if(!ticket) throw new Error(`${Ticket.model_name()} not found`)
			response.json({data: ticket})
		} catch (e: any) {
			response.status(404).json({error: e.message})
		}
	}
}
