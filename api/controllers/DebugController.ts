import {Request, Response} from "express";
import Ticket from "../models/Ticket.ts";
import QueryBuilder from "../core/db/QueryBuilder.ts";

export default class DebugController {
	static async index(request: Request, response: Response) {
	}
}
