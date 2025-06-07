import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import createJWKSMock from 'mock-jwks'
import app from '../../src/app'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'
import { Tenant } from '../../src/entity/Tenant'
import { createTenant } from '../utils'

describe('GET /users', () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKSMock>

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5501')
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        // database truncate
        jwks.start()
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    // this are manager users

    describe('Given all fields', () => {
        it('should persist the user in database', async () => {
            // Register user

            const tenant = await createTenant(connection.getRepository(Tenant))
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            }

            const admintoken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            // Add token to cookie
            await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${admintoken}`])
                .send(userData)
            // Assert

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(1)
            expect(users[0].email).toBe(userData.email)
        })

        it('should create a manager user', async () => {
            // Register user
            const tenant = await createTenant(connection.getRepository(Tenant))
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            }

            const admintoken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            // Add token to cookie
            await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${admintoken}`])
                .send(userData)
            // Assert

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(1)
            expect(users[0].role).toBe(Roles.MANAGER)
        })

        it('should return 403 if non admin user tries to create user', async () => {
            const tenant = await createTenant(connection.getRepository(Tenant))
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            }

            const customertoken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            })

            // Add token to cookie
            const response = await request(app)
                .post('/users')
                .set('Cookie', [`accessToken=${customertoken}`])
                .send(userData)
            // Assert

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(0)
            expect(response.statusCode).toBe(403)
        })
    })

    describe('Fields are missing', () => {})
})
