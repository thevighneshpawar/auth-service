import express, {
    Request,
    Response,
    NextFunction,
    RequestHandler,
} from 'express'
import { AppDataSource } from '../config/data-source'
import logger from '../config/logger'
import authenticate from '../middleware/authenticate'
import { canAccess } from '../middleware/canAccess'
import { Roles } from '../constants'
import { UserController } from '../controller/UserController'
import { UserService } from '../services/UserService'
import { User } from '../entity/User'
import { CreateUserRequest } from '../types'

const router = express.Router()

const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const userController = new UserController(userService, logger)

router.post(
    '/',
    authenticate,
    canAccess([Roles.ADMIN]),
    (req: CreateUserRequest, res: Response, next: NextFunction) => {
        userController.create(req, res, next).catch(next)
    },
)

export default router
