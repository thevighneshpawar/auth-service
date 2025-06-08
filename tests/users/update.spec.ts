import { DataSource } from 'typeorm'
import { User } from '../../src/entity/User'
import app from '../../src/app'
import request from 'supertest'
import { AppDataSource } from '../../src/config/data-source'
import bcrypt from 'bcrypt'
import { Roles } from '../../src/constants'
import createJWKSMock from 'mock-jwks'

describe('PATCH /users/:id', () => {
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

    describe('Validation Errors', () => {
        it('should return 400 if validation fails', async () => {
            // Arrange
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password123',
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)
            const userRepository = connection.getRepository(User)
            const user = await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            const invalidData = {
                firstName: '',
                lastName: '',
            }

            const admintoken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })

            // Act
            const response = await request(app)
                .patch(`/users/${user.id}`)
                .set('Cookie', [`accessToken=${admintoken}`])
                .send(invalidData)

            // Assert
            expect(response.statusCode).toBe(400)
        })
    })

    describe('Invalid URL Parameter', () => {
        it('should return 400 if userId is not a number', async () => {
            // Act

            const admintoken = jwks.token({
                sub: '1',
                role: Roles.ADMIN,
            })
            const response = await request(app)
                .patch(`/users/invalid-id`)
                .set('Cookie', [`accessToken=${admintoken}`])
                .send({ firstName: 'Jane', lastName: 'Smith' })

            // Assert
            expect(response.statusCode).toBe(400)
            // expect(response.body.message).toBe('Invalid url param.')
        })
    })
})
