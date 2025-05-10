import express, { Request, Response, NextFunction } from 'express'
import { AuthController } from '../controller/AuthController'
import { UserService } from '../services/userService'
import { AppDataSource } from '../config/data-source'
import { User } from '../entity/User'
import logger from '../config/logger'
import registervalidator from '../validators/register-validator'
import { TokenService } from '../services/TokenService'
import { RefreshToken } from '../entity/RefreshToken'

const router = express.Router()
const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken)
const tokenService = new TokenService(refreshTokenRepository)
// dependency injection in authcontroller for userservice
const authController = new AuthController(userService, logger, tokenService)

router.post(
    '/register',
    registervalidator,
    (req: Request, res: Response, next: NextFunction) => {
        authController.register(req, res, next).catch(next)
    },
)

export default router
