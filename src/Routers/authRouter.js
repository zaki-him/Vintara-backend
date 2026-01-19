import express from 'express'
import addUser from '../controllers/addUser.js'
import logUser from '../controllers/logUser.js'

const authRouter = express.Router()

authRouter.post('/sign-up', addUser)
authRouter.post('/sign-in', logUser)

export default authRouter