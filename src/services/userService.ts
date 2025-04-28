import { User } from '../entity/User'
import { userData } from '../types'
import { Repository } from 'typeorm'

export class UserService {
    constructor(private userRepository: Repository<User>) {}
    async create({ firstName, lastName, email, password }: userData) {
        // const userRepository = AppDataSource.getRepository(User)
        await this.userRepository.save({
            firstName,
            lastName,
            email,
            password,
        })
    }
}
