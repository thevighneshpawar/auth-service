import { expressjwt } from 'express-jwt'
import { Config } from '../config'
import { Request } from 'express'
import { AuthCookie, irefreshTokenPayload } from '../types'
import { AppDataSource } from '../config/data-source'
import logger from '../config/logger'

export default expressjwt({
    secret: Config.REFERESH_TOKEN_SECRET!,
    algorithms: ['HS256'],
    getToken(req: Request) {
        const { refreshToken } = req.cookies as AuthCookie
        return refreshToken
    },
})
