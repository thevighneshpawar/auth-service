import { Response } from 'express'
import { RegisterUserRequest } from '../types'
import { UserService } from '../services/userService'

export class AuthController {
    constructor(private userService: UserService) {}

    async register(req: RegisterUserRequest, res: Response) {
        const { firstName, lastName, email, password } = req.body

        // coz of this 2 lines our controller is fully coupled
        // to this instance so this we not need
        // lets improve thsi (improved )
        await this.userService.create({ firstName, lastName, email, password })
        res.status(201).json()
    }
}
