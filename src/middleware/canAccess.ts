import { NextFunction, Request, Response } from 'express'
import { AuthRequest } from '../types'
import createHttpError from 'http-errors'

export const canAccess = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const _req = req as AuthRequest
        const roleFromtoken = _req.auth.role

        if (!roles.includes(roleFromtoken)) {
            const error = createHttpError(
                403,
                'Forbidden: You do not have permission to access this resource.',
            )
            next(error)
            return
        }

        next()
    }
}
