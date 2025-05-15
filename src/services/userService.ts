import createHttpError from 'http-errors'
import bcrypt from 'bcrypt'
import { User } from '../entity/User'
import { userData } from '../types'
import { Repository } from 'typeorm'
import { Roles } from '../constants'

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({
        firstName,
        lastName,
        email,
        password,
    }: userData): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { email: email },
        })

        if (user) {
            const err = createHttpError(400, 'Email already exists')
            throw err
        }

        //hash the password

        const saltRounds = 10
        const hashedpassword = await bcrypt.hash(password, saltRounds)

        try {
            const user = this.userRepository.create({
                firstName,
                lastName,
                email,
                password: hashedpassword,
                role: Roles.CUSTOMER,
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

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.userRepository.findOne({
            where: { email: email },
        })

        return user
    }

    async findById(id: number) {
        const user = await this.userRepository.findOne({
            where: { id: id },
        })

        return user
    }
}
