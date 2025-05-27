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
    async isRevoked(req: Request, token) {
        console.log('isRevoked', token)
        try {
            const refreshTokenrepo = AppDataSource.getRepository('RefreshToken')
            const refreshToken = await refreshTokenrepo.findOne({
                where: {
                    id: Number((token?.payload as irefreshTokenPayload).id),
                    user: { id: Number(token?.payload.sub) },
                },
            })

            return refreshToken === null
        } catch (err) {
            logger.error('Error while getting refresh token', {
                id: (token?.payload as irefreshTokenPayload).id,
            })
        }

        return true
    },
})
