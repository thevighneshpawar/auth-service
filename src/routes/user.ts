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
import { CreateUserRequest, UpdateUserRequest } from '../types'
import listUsersValidator from '../validators/listUser-validator'
import updateUserValidator from '../validators/updateUser-validator'

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

router.patch(
    '/:id',
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    updateUserValidator,
    (req: UpdateUserRequest, res: Response, next: NextFunction) => {
        userController.update(req, res, next) as unknown as RequestHandler
    },
)

router.get(
    '/',
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    listUsersValidator,
    (req: Request, res: Response, next: NextFunction) => {
        userController.getAll(req, res, next) as unknown as RequestHandler
    },
)

router.get(
    '/:id',
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    (req: Request, res, next) => {
        userController.getOne(req, res, next) as unknown as RequestHandler
    },
)

router.delete(
    '/:id',
    authenticate as RequestHandler,
    canAccess([Roles.ADMIN]),
    (req, res, next) => {
        userController.destroy(req, res, next) as unknown as RequestHandler
    },
)

export default router
