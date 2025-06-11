import { DataSource } from 'typeorm'
import { User } from '../../src/entity/User'
import app from '../../src/app'
import request from 'supertest'
import { AppDataSource } from '../../src/config/data-source'
import bcrypt from 'bcryptjs'
import { Roles } from '../../src/constants'
import createJWKSMock from 'mock-jwks'
import { Tenant } from '../../src/entity/Tenant'

describe('PATCH /users/:id', () => {
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

        // Create a test tenant
        const tenantRepository = connection.getRepository(Tenant)
        tenant = tenantRepository.create({
            name: 'Test Tenant',
            address: '123 Test St',
        })
        await tenantRepository.save(tenant)

        // Create a test user
        const userRepository = connection.getRepository(User)
        testUser = userRepository.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            password: await bcrypt.hash('password123', 10),
            role: Roles.CUSTOMER,
            tenant: tenant,
        })
        await userRepository.save(testUser)
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Validation Errors', () => {
        it('should return 400 if validation fails', async () => {
            const invalidData = {
                firstName: '',
                lastName: '',
                email: 'invalid-email',
                role: 'INVALID_ROLE',
            }

            const response = await request(app)
                .patch(`/users/${testUser.id}`)
                .set('Cookie', [`accessToken=${adminToken}`])
                .send(invalidData)

            expect(response.statusCode).toBe(400)
            expect(response.body.errors).toBeDefined()
        })
    })

    describe('Invalid URL Parameter', () => {
        it('should return 400 if userId is not a number', async () => {
            const response = await request(app)
                .patch('/users/invalid-id')
                .set('Cookie', [`accessToken=${adminToken}`])
                .send({ firstName: 'Jane' })

            expect(response.statusCode).toBe(400)
        })
    })

    describe('Successful Update', () => {
        it('should update user details and return 200', async () => {
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name',
                email: 'updated@example.com',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            }

            const response = await request(app)
                .patch(`/users/${testUser.id}`)
                .set('Cookie', [`accessToken=${adminToken}`])
                .send(updateData)

            expect(response.statusCode).toBe(200)
            expect(response.body.id).toBe(testUser.id)

            // Verify changes in database
            const userRepository = connection.getRepository(User)
            const updatedUser = await userRepository.findOneBy({
                id: testUser.id,
            })
            expect(updatedUser?.firstName).toBe('Updated')
            expect(updatedUser?.email).toBe('updated@example.com')
        })
    })

    describe('Authentication and Authorization', () => {
        it('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .patch(`/users/${testUser.id}`)
                .send({ firstName: 'Jane' })

            expect(response.statusCode).toBe(401)
        })

        it('should return 403 if non-admin tries to update', async () => {
            const customerToken = jwks.token({
                sub: '2',
                role: Roles.CUSTOMER,
            })

            const response = await request(app)
                .patch(`/users/${testUser.id}`)
                .set('Cookie', [`accessToken=${customerToken}`])
                .send({ firstName: 'Jane' })

            expect(response.statusCode).toBe(403)
        })
    })

    describe('Business Logic', () => {
        it('should return 400 if email already exists for another user', async () => {
            // Create another user
            const userRepository = connection.getRepository(User)
            const otherUser = userRepository.create({
                firstName: 'Other',
                lastName: 'User',
                email: 'other@example.com',
                password: await bcrypt.hash('password123', 10),
                role: Roles.CUSTOMER,
                tenant: tenant,
            })
            await userRepository.save(otherUser)

            // Try to update test user with other user's email
            const response = await request(app)
                .patch(`/users/${testUser.id}`)
                .set('Cookie', [`accessToken=${adminToken}`])
                .send({ email: otherUser.email })

            expect(response.statusCode).toBe(400)
        })
    })
})
