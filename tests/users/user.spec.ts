import { DataSource } from 'typeorm'
import { AppDataSource } from '../../src/config/data-source'
import request from 'supertest'
import createJWKSMock from 'mock-jwks'
import app from '../../src/app'
import { Roles } from '../../src/constants'
import { User } from '../../src/entity/User'

describe('GET /auth/self', () => {
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

    describe('Given all fields', () => {
        it('should return the 200 status code', async () => {
            const accessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            })

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send()
            expect(response.statusCode).toBe(200)
        })

        it('should return the user data', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
            }

            const userRepository = connection.getRepository(User)
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken};`])
                .send()

            //assert
            expect((response.body as Record<string, string>).id).toBe(data.id)
        })

        it('should not return the password field', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
            }

            const userRepository = connection.getRepository(User)
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken};`])
                .send()

            //assert
            expect(response.body as Record<string, string>).not.toHaveProperty(
                'password',
            )
        })
    })

    describe('Fields are missing', () => {})
})
