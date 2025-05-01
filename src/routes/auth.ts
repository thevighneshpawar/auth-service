import express, { Request, Response, NextFunction } from 'express'
import { AuthController } from '../controller/AuthController'
import { UserService } from '../services/userService'
import { AppDataSource } from '../config/data-source'
import { User } from '../entity/User'
import logger from '../config/logger'
import registervalidator from '../validators/register-validator'

const router = express.Router()
const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
// dependency injection in authcontroller for userservice
const authController = new AuthController(userService, logger)

router.post(
    '/register',
    registervalidator,
    (req: Request, res: Response, next: NextFunction) => {
        authController.register(req, res, next).catch(next)
    },
)

export default router
