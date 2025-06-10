import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import createJWKSMock from 'mock-jwks'
import app from '../../src/app'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'
import { Tenant } from '../../src/entity/Tenant'
import { createTenant, createUser } from '../utils'

describe('GET /users/:id', () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKSMock>
    let adminToken: string
    let testUser: User
    let tenant: Tenant

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5501')
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        jwks.start()
        await connection.dropDatabase()
        await connection.synchronize()

        adminToken = jwks.token({
            sub: '1',
            role: Roles.ADMIN,
        })

        tenant = await createTenant(connection.getRepository(Tenant))
        testUser = await createUser(connection.getRepository(User), {
            firstName: 'Test',
            lastName: 'User',
            email: 'test.user@example.com',
            role: Roles.MANAGER,
            tenantId: tenant.id,
        })
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('GET /users/:id - Get single user', () => {
        it('should return user details for valid ID', async () => {
            // Act
            const response = await request(app)
                .get(`/users/${testUser.id}`)
                .set('Cookie', [`accessToken=${adminToken}`])

            // Assert
            expect(response.statusCode).toBe(200)
            expect(response.body.id).toBe(testUser.id)
            expect(response.body.firstName).toBe('Test')
            expect(response.body.lastName).toBe('User')
            expect(response.body.email).toBe('test.user@example.com')
            expect(response.body.role).toBe(Roles.MANAGER)
        })

        it('should return 400 for invalid user ID format', async () => {
            // Act
            const response = await request(app)
                .get('/users/invalid-id')
                .set('Cookie', [`accessToken=${adminToken}`])

            // Assert
            expect(response.statusCode).toBe(400)
        })

        it('should return 400 if user does not exist', async () => {
            // Act
            const response = await request(app)
                .get('/users/9999')
                .set('Cookie', [`accessToken=${adminToken}`])

            // Assert
            expect(response.statusCode).toBe(400)
        })

        it('should return 403 if non-admin tries to access', async () => {
            // Arrange
            const customerToken = jwks.token({
                sub: '2',
                role: Roles.CUSTOMER,
            })

            // Act
            const response = await request(app)
                .get(`/users/${testUser.id}`)
                .set('Cookie', [`accessToken=${customerToken}`])

            // Assert
            expect(response.statusCode).toBe(403)
        })

        it('should return 401 if no token is provided', async () => {
            // Act
            const response = await request(app).get(`/users/${testUser.id}`)

            // Assert
            expect(response.statusCode).toBe(401)
        })

        it('should not return password hash in the response', async () => {
            // Act
            const response = await request(app)
                .get(`/users/${testUser.id}`)
                .set('Cookie', [`accessToken=${adminToken}`])

            // Assert
            expect(response.body.password).toBeUndefined()
        })
    })
})
