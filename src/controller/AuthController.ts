import { NextFunction, Response, Request } from 'express'
import { JwtPayload, sign } from 'jsonwebtoken'
import { AuthRequest, RegisterUserRequest } from '../types'
import { UserService } from '../services/userService'
import { Logger } from 'winston'
import { validationResult } from 'express-validator/lib/validation-result'
import { TokenService } from '../services/TokenService'
import createHttpError from 'http-errors'
import { CredentialService } from '../services/CredentialService'

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
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
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)

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

            this.logger.info('User has been registered', { id: user.id })

            res.status(201).json({ id: user.id })
        } catch (err) {
            next(err)
            //it will handle the error in global error handler
            return
        }
    }

    async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() })
        }

        const { email, password } = req.body

        this.logger.debug('New request to login a user', {
            email,
            password: '*******',
        })

        // check if email exists in db
        //compare pass
        // genertate tokens
        // add tokens cokkies
        // return response

        try {
            const user = await this.userService.findByEmail(email)

            if (!user) {
                const err = createHttpError(400, 'Email password not found')
                next(err)
                return
            }

            const passwordMatch = await this.credentialService.comparePassword(
                password,
                user.password,
            )

            if (!passwordMatch) {
                const err = createHttpError(400, 'Email password not found')
                next(err)
                return
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            }
            const accessToken = this.tokenService.generateAccessToken(payload)

            //persist the refresh token in the database
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)

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

            this.logger.info('user has been logged in ', { id: user.id })

            res.json({ id: user.id })
        } catch (err) {
            next(err)
            //it will handle the error in global error handler
            return
        }
    }

    async self(req: AuthRequest, res: Response) {
        const user = await this.userService.findById(Number(req.auth.sub))
        res.json({ ...user, password: undefined })
    }

    async refresh(req: AuthRequest, res: Response, next: NextFunction) {
        // console.log(req.auth)
        try {
            const payload: JwtPayload = {
                sub: req.auth.id,
                role: req.auth.role,
            }

            const accessToken = this.tokenService.generateAccessToken(payload)

            const user = await this.userService.findById(Number(req.auth.sub))
            if (!user) {
                const err = createHttpError(
                    400,
                    'User with token could not found',
                )
                next(err)
                return
            }

            await this.tokenService.deleteRefreshToken(Number(req.auth.id))
            //persist the refresh token in the database
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user)

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

            this.logger.info('User has been registered', { id: user.id })

            res.status(201).json({ id: user.id })
        } catch (err) {
            next(err)
            //it will handle the error in global error handler
            return
        }
    }

    async logout(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            await this.tokenService.deleteRefreshToken(Number(req.auth.id))
            this.logger.info('Refresh token has been deleted', {
                id: req.auth.id,
            })
            this.logger.info('User has been logged out', { id: req.auth.sub })

            res.clearCookie('accessToken')
            res.clearCookie('refreshToken')

            res.json({ message: 'User has been logged out' })
        } catch (error) {
            next(error)
            //it will handle the error in global error handler
            return
        }
    }
}
