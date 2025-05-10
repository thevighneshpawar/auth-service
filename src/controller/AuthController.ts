import path from 'path'
import fs from 'fs'
import { NextFunction, Response } from 'express'
import { JwtPayload, sign } from 'jsonwebtoken'
import { RegisterUserRequest } from '../types'
import { UserService } from '../services/userService'
import { Logger } from 'winston'
import { validationResult } from 'express-validator/lib/validation-result'
import createHttpError from 'http-errors'
import { Config } from '../config'
import { AppDataSource } from '../config/data-source'
import { RefreshToken } from '../entity/RefreshToken'
import { TokenService } from '../services/TokenService'

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() })
        }

        const { firstName, lastName, email, password } = req.body

        this.logger.debug('New request to register a user', {
            firstName,
            lastName,
            email,
            password: '*******',
        })

        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            })

            this.logger.info('User has been registered', { id: user.id })

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }
            const accessToken = this.tokenService.generateAccessToken(payload)

            //persist the refresh token in the database

            const refreshTokenRepository =
                AppDataSource.getRepository(RefreshToken)
            const newRefreshToken = await refreshTokenRepository.save({
                user: user,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), //1yr
            })

            // const refreshToken = sign(payload, Config.REFERESH_TOKEN_SECRET!, {
            //     algorithm: 'HS256',
            //     expiresIn: '1y',
            //     issuer: 'auth-service',
            //     jwtid: String(newRefreshToken.id),
            // })

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            })

            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60, //1hrs
                httpOnly: true,
            })

            res.cookie('refreshToken', refreshToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365, //1yr
                httpOnly: true,
            })

            res.status(201).json({ id: user.id })
        } catch (err) {
            next(err)
            //it will handle the error in global error handler
            return
        }
    }
}
