import express, { Request, Response, NextFunction } from 'express'
import { AuthController } from '../controller/AuthController'
import { UserService } from '../services/userService'
import { AppDataSource } from '../config/data-source'
import { User } from '../entity/User'
import logger from '../config/logger'
import registervalidator from '../validators/register-validator'
import loginvalidator from '../validators/login-validator'
import { TokenService } from '../services/TokenService'
import { RefreshToken } from '../entity/RefreshToken'
import { CredentialService } from '../services/CredentialService'
import authenticate from '../middleware/authenticate'
import { AuthRequest } from '../types'

const router = express.Router()
const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken)
const tokenService = new TokenService(refreshTokenRepository)
const credentialService = new CredentialService()
// dependency injection in authcontroller for userservice
const authController = new AuthController(
    userService,
    logger,
    tokenService,
    credentialService,
)

router.post(
    '/register',
    registervalidator,
    (req: Request, res: Response, next: NextFunction) => {
        authController.register(req, res, next).catch(next)
    },
)

router.post(
    '/login',
    loginvalidator,
    (req: Request, res: Response, next: NextFunction) => {
        authController.login(req, res, next).catch(next)
    },
)

router.get(
    '/self',
    authenticate,
    (req: Request, res: Response, next: NextFunction) => {
        authController.self(req as AuthRequest, res).catch(next)
    },
)

export default router
