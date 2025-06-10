import { DataSource, Repository } from 'typeorm'
import { Tenant } from '../../src/entity/Tenant'
import { User } from '../../src/entity/User'
import bcrypt from 'bcrypt'

export const truncateTables = async (connection: DataSource) => {
    const entities = connection.entityMetadatas
    for (const entity of entities) {
        const repository = connection.getRepository(entity.name)
        await repository.clear()
    }
}

export const isJwt = (token: string | null): boolean => {
    if (token == null) {
        return false
    }
    const parts = token.split('.')
    if (parts.length !== 3) {
        return false
    }

    try {
        parts.forEach((part) => {
            Buffer.from(part, 'base64').toString('utf8')
        })

        return true
    } catch (error) {
        return false
    }
}

export const createUser = async (
    userRepository: Repository<User>,
    userData: {
        firstName?: string
        lastName?: string
        email: string
        password?: string
        role: any
        tenantId: number
    },
): Promise<User> => {
    const hashedPassword = await bcrypt.hash(
        userData.password || 'password',
        10,
    )

    const user = userRepository.create({
        firstName: userData.firstName || 'Test',
        lastName: userData.lastName || 'User',
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        tenant: { id: userData.tenantId }, // Pass tenant object with id
    })

    return await userRepository.save(user)
}
export const createTenant = async (repository: Repository<Tenant>) => {
    const tenant = await repository.save({
        name: 'Test tenant',
        address: 'Test address',
    })
    return tenant
}
