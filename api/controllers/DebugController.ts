import {Request, Response} from "express";
import Ticket from "../models/Ticket.ts";
import QueryBuilder from "../core/utility/QueryBuilder.ts";

export default class DebugController {
	static async index(request: Request, response: Response) {
		const query = new QueryBuilder()
		query.select(['test', 'world'])
			.from('meow')
			.where('title', 'meow')
			.where('created_at', '>', '10')
			.orWhere('deleted_at', '<', '10')
			.whereNull('created_at')
			.whereNotNull('created_at')
			.orWhereNull('title')
			.orWhereNotNull('title')
			.whereIn('title', ['meow', 'howdy'])
			.whereNotIn('title', ['meow', 'howdy'])
			.orWhereIn('title', ['meow', 'howdy'])
			.orWhereNotIn('title', ['meow', 'howdy'])

		response.json(query)
	}
}
