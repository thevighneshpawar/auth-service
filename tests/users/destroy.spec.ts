import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import createJWKSMock from 'mock-jwks'
import app from '../../src/app'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'
import { Tenant } from '../../src/entity/Tenant'
import { createTenant, createUser } from '../utils'

describe('DELETE /users/:id', () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKSMock>

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5501')
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
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

    describe('User deletion scenarios', () => {
        it('should delete the user and return 200 with user id', async () => {
            // Create a tenant and user first
            const tenant = await createTenant(connection.getRepository(Tenant))
            const user = await createUser(connection.getRepository(User), {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'password',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            })

            const adminToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            // Delete the user
            const response = await request(app)
                .delete(`/users/${user.id}`)
                .set('Cookie', [`accessToken=${adminToken}`])

            // Assert response
            expect(response.statusCode).toBe(200)
            expect(response.body).toHaveProperty('id', user.id)

            // Verify user is deleted from database
            const userRepository = connection.getRepository(User)
            const deletedUser = await userRepository.findOne({
                where: { id: user.id },
            })
            expect(deletedUser).toBeNull()
        })

        it('should return 400 for invalid user id format', async () => {
            const adminToken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .delete('/users/invalid-id')
                .set('Cookie', [`accessToken=${adminToken}`])

            expect(response.statusCode).toBe(400)
        })

        it('should return 403 if non-admin tries to delete user', async () => {
            // Create a tenant and user first
            const tenant = await createTenant(connection.getRepository(Tenant))
            const user = await createUser(connection.getRepository(User), {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'password',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            })

            const customerToken = jwks.token({
                sub: '2',
                role: Roles.CUSTOMER,
            })

            const response = await request(app)
                .delete(`/users/${user.id}`)
                .set('Cookie', [`accessToken=${customerToken}`])

            expect(response.statusCode).toBe(403)

            // Verify user still exists
            const userRepository = connection.getRepository(User)
            const existingUser = await userRepository.findOne({
                where: { id: user.id },
            })
            expect(existingUser).not.toBeNull()
        })

        it('should return 401 if no token is provided', async () => {
            // Create a tenant and user first
            const tenant = await createTenant(connection.getRepository(Tenant))
            const user = await createUser(connection.getRepository(User), {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'password',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            })

            const response = await request(app).delete(`/users/${user.id}`)

            expect(response.statusCode).toBe(401)
        })

        it('should prevent manager from deleting users from other tenants', async () => {
            // Create two tenants
            const tenant1 = await createTenant(connection.getRepository(Tenant))
            const tenant2 = await createTenant(connection.getRepository(Tenant))

            // Create manager in tenant1
            const manager = await createUser(connection.getRepository(User), {
                firstName: 'Manager',
                lastName: 'User',
                email: 'manager@example.com',
                password: 'password',
                role: Roles.MANAGER,
                tenantId: tenant1.id,
            })

            // Create user in tenant2
            const userToDelete = await createUser(
                connection.getRepository(User),
                {
                    firstName: 'Regular',
                    lastName: 'User',
                    email: 'regular@example.com',
                    password: 'password',
                    role: Roles.CUSTOMER,
                    tenantId: tenant2.id,
                },
            )

            const managerToken = jwks.token({
                sub: manager.id.toString(),
                role: Roles.MANAGER,
            })

            const response = await request(app)
                .delete(`/users/${userToDelete.id}`)
                .set('Cookie', [`accessToken=${managerToken}`])

            expect(response.statusCode).toBe(403)

            // Verify user still exists
            const userRepository = connection.getRepository(User)
            const existingUser = await userRepository.findOne({
                where: { id: userToDelete.id },
            })
            expect(existingUser).not.toBeNull()
        })
    })
})
