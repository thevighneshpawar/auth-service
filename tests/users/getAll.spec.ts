import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import createJWKSMock from 'mock-jwks'
import app from '../../src/app'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'
import { Tenant } from '../../src/entity/Tenant'
import { createTenant, createUser } from '../utils'

describe('GET /users', () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKSMock>
    let adminToken: string
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
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('GET /users - List all users', () => {
        it('should return paginated results when query params are provided', async () => {
            // Arrange - Create 15 users
            for (let i = 0; i < 15; i++) {
                await createUser(connection.getRepository(User), {
                    firstName: `User${i}`,
                    lastName: `Test${i}`,
                    email: `user${i}@test.com`,
                    role: i % 2 === 0 ? Roles.MANAGER : Roles.CUSTOMER,
                    tenantId: tenant.id,
                })
            }

            // Act - Request second page with 5 items
            const response = await request(app)
                .get('/users?currentPage=2&perPage=5')
                .set('Cookie', [`accessToken=${adminToken}`])

            // Assert
            expect(response.statusCode).toBe(200)
            expect(response.body.data).toHaveLength(5)
            expect(response.body.total).toBe(15)
            expect(response.body.currentPage).toBe(2)
            expect(response.body.perPage).toBe(5)
        })

        it('should return 403 if non-admin tries to access', async () => {
            // Arrange
            const managerToken = jwks.token({
                sub: '2',
                role: Roles.MANAGER,
            })

            // Act
            const response = await request(app)
                .get('/users')
                .set('Cookie', [`accessToken=${managerToken}`])

            // Assert
            expect(response.statusCode).toBe(403)
        })

        it('should return 401 if no token is provided', async () => {
            // Act
            const response = await request(app).get('/users')

            // Assert
            expect(response.statusCode).toBe(401)
        })

        it('should filter users by role when role query param is provided', async () => {
            // Arrange
            await createUser(connection.getRepository(User), {
                firstName: 'Manager',
                lastName: 'User',
                email: 'manager@test.com',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            })

            await createUser(connection.getRepository(User), {
                firstName: 'Customer',
                lastName: 'User',
                email: 'customer@test.com',
                role: Roles.CUSTOMER,
                tenantId: tenant.id,
            })

            // Act
            const response = await request(app)
                .get('/users?role=manager')
                .set('Cookie', [`accessToken=${adminToken}`])

            // Assert
            expect(response.statusCode).toBe(200)
            expect(response.body.data).toHaveLength(1)
            expect(response.body.data[0].role).toBe(Roles.MANAGER)
        })
    })
})
