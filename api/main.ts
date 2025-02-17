import express from 'express'
import dotenv from 'dotenv'
import TicketController from './controllers/TicketController.ts'
import Log from './core/utility/Log.ts'
import DebugController from './controllers/DebugController.ts'

dotenv.config()

const app = express()
app.use((err: Error, req, res, next) => {
	console.log('here i am')
	if (err) {
		console.log('error heer')
		Log.error(err);
		res.status(500).json({error: err.message})
	} else {
		next()
	}
})

app.get('/tickets', TicketController.all)
app.get('/tickets/:ticket', TicketController.find)
app.get('/debug', DebugController.index)

app.listen(3000)
