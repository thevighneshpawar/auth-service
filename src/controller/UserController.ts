import { NextFunction, Response, Request } from 'express'
import { UserService } from '../services/UserService'
import { Logger } from 'winston'
import { CreateUserRequest, UpdateUserRequest, UserQueryParams } from '../types'
import createHttpError from 'http-errors'
import { matchedData, validationResult } from 'express-validator'
import { TenantService } from '../services/TenantService'

export class UserController {
    constructor(
        private userService: UserService,
        private tenantService: TenantService,
        private logger: Logger,
    ) {}

    async create(req: CreateUserRequest, res: Response, next: NextFunction) {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string))
        }

        const { firstName, lastName, email, password, tenantId, role } =
            req.body
        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
                role,
                tenantId,
            })
            res.status(201).json({ id: user.id })
        } catch (err) {
            next(err)
        }
    }

    async update(req: UpdateUserRequest, res: Response, next: NextFunction) {
        // Validation
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return createHttpError(400, result.array()[0].msg as string) // Ensure this returns 400
            //return res.status(400).json({ errors: result.array() }) // Ensure this returns 400
        }

        const { firstName, lastName, role, email, tenantId } = req.body
        const userId = req.params.id

        if (isNaN(Number(userId))) {
            next(createHttpError(400, 'Invalid url param.')) // Ensure this returns 400
            return
        }

        this.logger.debug('Request for updating a user', req.body)

        try {
            await this.userService.update(Number(userId), {
                firstName,
                lastName,
                role,
                email,
                tenantId,
            })

            this.logger.info('User has been updated', { id: userId })

            res.json({ id: Number(userId) })
        } catch (err) {
            next(err)
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        const validatedQuery = matchedData(req, { onlyValidData: true })

        try {
            const [users, count] = await this.userService.getAll(
                validatedQuery as UserQueryParams,
            )

            this.logger.info('All users have been fetched')
            //  const sortedUsers = users.sort((a, b) => a.id - b.id)
            res.json({
                currentPage: validatedQuery.currentPage as number,
                perPage: validatedQuery.perPage as number,
                total: count,
                data: users,
            })
        } catch (err) {
            next(err)
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id

        if (isNaN(Number(userId))) {
            next(createHttpError(400, 'Invalid url param.'))
            return
        }

        try {
            const user = await this.userService.findById(Number(userId))

            if (!user) {
                next(createHttpError(400, 'User does not exist.'))
                return
            }

            this.logger.info('User has been fetched', { id: user.id })
            res.json(user)
        } catch (err) {
            next(err)
        }
    }

    async destroy(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id

        if (isNaN(Number(userId))) {
            next(createHttpError(400, 'Invalid url param.'))
            return
        }

        try {
            await this.userService.deleteById(Number(userId))

            this.logger.info('User has been deleted', {
                id: Number(userId),
            })
            res.json({ id: Number(userId) })
        } catch (err) {
            next(err)
        }
    }
}
