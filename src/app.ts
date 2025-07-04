import 'reflect-metadata'
import express from 'express'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth'
import tenantRouter from './routes/tenant'
import userRouter from './routes/user'
import cors from 'cors'
import { Config } from './config'
import { globalErrorHandler } from './middleware/globalErrorHandler'

const app = express()

app.use(
    cors({
        origin: [Config.FRONTEND_URL || false],
        credentials: true, // to allow cookies to be sent with requests
    }),
)

app.use(express.static('public'))
app.use(cookieParser())
app.use(express.json())
// app.use(
//     cors<Request>({
//         origin: 'http://localhost:5173', // Replace with your frontend URL
//         credentials: true, // Allow cookies to be sent with requests
//     }),
// )

app.get('/', (req, res) => {
    res.json('Welcome to auth service')
    // for async functions it not handle  using throw err
    // for that we use next
    // normally we use next() to give control to next function \
    // but if we use next(args) then it considered as error and passed to global handleer
})

app.use('/auth', authRouter)
app.use('/tenants', tenantRouter)
app.use('/users', userRouter)
//global error handler

app.use(globalErrorHandler)

export default app
