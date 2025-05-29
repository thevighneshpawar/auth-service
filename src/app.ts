import 'reflect-metadata'
import express, { Request, Response, NextFunction } from 'express'
import logger from './config/logger'
import cookieParser from 'cookie-parser'
import { HttpError } from 'http-errors'
import authRouter from './routes/auth'
import tenantRouter from './routes/tenant'

const app = express()

app.use(express.static('public'))
app.use(cookieParser())
app.use(express.json())

app.get('/', (req, res) => {
    res.json('Welcome to auth service')
    // for async functions it not handle  using throw err
    // for that we use next
    // normally we use next() to give control to next function \
    // but if we use next(args) then it considered as error and passed to global handleer
})

app.use('/auth', authRouter)
app.use('/tenants', tenantRouter)
//global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message)
    const statusCode = err.statusCode || err.status || 500
    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                msg: err.message,
                path: '',
                location: '',
            },
        ],
    })
})

export default app
