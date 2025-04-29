import createHttpError from 'http-errors'
import { User } from '../entity/User'
import { userData } from '../types'
import { Repository } from 'typeorm'

export class UserService {
    constructor(private userRepository: Repository<User>) {}
    async create({
        firstName,
        lastName,
        email,
        password,
    }: userData): Promise<User> {
        try {
            const user = this.userRepository.create({
                firstName,
                lastName,
                email,
                password,
            })
            return await this.userRepository.save(user)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            const error = createHttpError(
                500,
                'failed to store data int the database',
            )
            throw error
        }
    }
}
