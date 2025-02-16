import express from 'express'
import dotenv from 'dotenv'
import TicketController from './controllers/TicketController.ts'

dotenv.config()

const app = express()
app.get('/tickets', TicketController.all)
app.get('/tickets/:ticket', TicketController.find)

app.listen(3000)
