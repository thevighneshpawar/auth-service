import { DataSource } from 'typeorm'
import { User } from '../../src/entity/User'
import app from '../../src/app'
import request from 'supertest'
import { AppDataSource } from '../../src/config/data-source'
// import { truncateTables } from '../utils'
import { Roles } from '../../src/constants'
import { isJwt } from '../utils'
import { RefreshToken } from '../../src/entity/RefreshToken'

describe('POST /auth/register', () => {
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
        it('should return the 201 status code', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert
            expect(response.statusCode).toBe(201)
        })

        it('should return valid json response', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'pawar',
                email: 'vighnesh@google.com',
                password: 'password',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            // Assert application/json utf-8
            expect(
                (response.headers as Record<string, string>)['content-type'],
            ).toEqual(expect.stringContaining('json'))
        })

        it('should persist the user in the database', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
            }
            // Act
            await request(app).post('/auth/register').send(userData)

            //Assert

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(1)
            expect(users[0].firstName).toBe(userData.firstName)
            expect(users[0].lastName).toBe(userData.lastName)
            expect(users[0].email).toBe(userData.email)
        })

        it('should return an id of the created user', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            //assert

            expect(response.body).toHaveProperty('id')
        })

        it('should assign a customer role', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
            }
            // Act
            await request(app).post('/auth/register').send(userData)

            //assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users[0]).toHaveProperty('role')
            expect(users[0].role).toBe(Roles.CUSTOMER)
        })

        it('should store the hashed password in the database', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
            }
            // Act
            await request(app).post('/auth/register').send(userData)

            //assert

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find({ select: ['password'] })
            expect(users[0].password).not.toBe(userData.password)
            expect(users[0].password).toHaveLength(60)
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/)
        })

        it('should return 400 status code if email already exists', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
            }

            const userRepository = connection.getRepository(User)
            await userRepository.save({ ...userData, role: Roles.CUSTOMER })
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            const users = await userRepository.find()

            //assert

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(1)
        })

        it('should return the access token and refresh token inide a cookie', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
            //assert
            let accessToken: string | null = null
            let refreshToken: string | null = null

            interface Headers {
                ['set-cookie']?: string[]
            }

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

            // console.log(accessToken)

            expect(isJwt(accessToken)).toBeTruthy()
            expect(isJwt(refreshToken)).toBeTruthy()
        })

        it('should store the refresh token in the database', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            //assert

            const refreshTokenRepo = connection.getRepository(RefreshToken)
            // const refreshTokens = await refreshTokenRepo.find()
            // expect(refreshTokens).toHaveLength(1)

            const tokens = await refreshTokenRepo
                .createQueryBuilder('rt')
                .where('rt.userId = :userId', {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany()

            expect(tokens).toHaveLength(1)
        })
    })

    describe('Fields are missing', () => {
        it('should return 400 status code if email field is missing', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: '',
                password: 'password',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            //assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })

        it('should return 400 status code if firstname is missing', async () => {
            const userData = {
                firstName: '',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: 'password',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            //assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })
        it('should return 400 status code if lastname is missing', async () => {
            const userData = {
                firstName: 'Vighnesh',
                lastName: '',
                email: 'vighnesh@google.com',
                password: 'password',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            //assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })
        it('should return 400 status code if password is missing', async () => {
            const userData = {
                firstName: '',
                lastName: 'Pawar',
                email: 'vighnesh@google.com',
                password: '',
            }

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            //assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(response.statusCode).toBe(400)
            expect(users).toHaveLength(0)
        })
    })

    describe('Fields are not in proper format', () => {
        it('should trim the email filed', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: ' vighnesh@google.com',
                password: 'password',
            }
            // Act
            await request(app).post('/auth/register').send(userData)

            //assert
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            const user = users[0]
            expect(user.email).toBe('vighnesh@google.com')
        })

        it('should return 400 status code if email is not a valid email', async () => {
            // Arrange
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: ' vighnesh.com',
                password: 'password',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            //assert
            expect(response.statusCode).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })

        it('should return 400 status code if password length is less than 8 characters', async () => {
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: ' vighnesh.com',
                password: 'passw',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)

            //assert
            expect(response.statusCode).toBe(400)
            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()
            expect(users).toHaveLength(0)
        })

        it('should return an array of error messages if email is missing', async () => {
            const userData = {
                firstName: 'vighnesh',
                lastName: 'Pawar',
                email: '',
                password: 'password1',
            }
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
            // Assert
            expect(response.body).toHaveProperty('errors')
            expect(
                (response.body as Record<string, string>).errors.length,
            ).toBeGreaterThan(0)
        })
    })
})
