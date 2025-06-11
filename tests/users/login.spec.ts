import { DataSource } from 'typeorm'
import { User } from '../../src/entity/User'
import app from '../../src/app'
import request from 'supertest'
import { AppDataSource } from '../../src/config/data-source'
// import { truncateTables } from '../utils'
import { Roles } from '../../src/constants'
import { isJwt } from '../utils'
import bcrypt from 'bcryptjs'

describe('POST /auth/login', () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        // database truncate

        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Given all fields', () => {
        it('should return the access token and refresh token inside a cookie', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)

            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            // Act
            const response = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: userData.password })

            interface Headers {
                ['set-cookie']?: string[]
            }
            // Assert
            let accessToken = null
            let refreshToken = null

            const cookies = (response.headers as Headers)['set-cookie'] || []

            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1]
                }

                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1]
                }
            })
            expect(accessToken).not.toBeNull()
            expect(refreshToken).not.toBeNull()

            expect(isJwt(accessToken)).toBeTruthy()
            expect(isJwt(refreshToken)).toBeTruthy()
        })
        it('should return the 400 if email or password is wrong', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@go.com',
                password: 'password',
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)

            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            // Act
            const response = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: 'wrongPassword' })

            // Assert

            expect(response.statusCode).toBe(400)
        })
    })

    describe('Fields are missing', () => {
        it('should return 400 status code if password is missing', async () => {
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@go.com',
                password: 'password',
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10)

            const userRepository = connection.getRepository(User)
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            })

            // Act
            const response = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: '' })

            // Assert

            expect(response.statusCode).toBe(400)
        })
    })
})
