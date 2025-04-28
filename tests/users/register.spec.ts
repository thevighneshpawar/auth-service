import { DataSource } from 'typeorm'
import { User } from '../../src/entity/User'
import app from '../../src/app'
import request from 'supertest'
import { AppDataSource } from '../../src/config/data-source'
import { truncateTables } from '../utils'

describe('POST /auth/register', () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        // database truncate

        await truncateTables(connection)
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
    })

    describe('Fields are missing', () => {
        // it('should return 400 status code if email field is missing', async () => {
        //     // Arrange
        //     const userData = {
        //         firstName: 'Rakesh',
        //         lastName: 'K',
        //         email: '',
        //         password: 'password',
        //     }
        //     // Act
        //     const response = await request(app)
        //         .post('/auth/register')
        //         .send(userData)
        //     // Assert
        //     expect(response.statusCode).toBe(400)
        //     const userRepository = connection.getRepository(User)
        //     const users = await userRepository.find()
        //     expect(users).toHaveLength(0)
        // })
        // it('should return 400 status code if firstName is missing', async () => {
        //     // Arrange
        //     const userData = {
        //         firstName: '',
        //         lastName: 'K',
        //         email: 'rakesh@mern.space',
        //         password: 'password',
        //     }
        //     // Act
        //     const response = await request(app)
        //         .post('/auth/register')
        //         .send(userData)
        //     // Assert
        //     expect(response.statusCode).toBe(400)
        //     const userRepository = connection.getRepository(User)
        //     const users = await userRepository.find()
        //     expect(users).toHaveLength(0)
        // })
        // it('should return 400 status code if lastName is missing', async () => {
        //     // Arrange
        //     const userData = {
        //         firstName: 'Rakesh',
        //         lastName: '',
        //         email: 'rakesh@mern.space',
        //         password: 'password',
        //     }
        //     // Act
        //     const response = await request(app)
        //         .post('/auth/register')
        //         .send(userData)
        //     // Assert
        //     expect(response.statusCode).toBe(400)
        //     const userRepository = connection.getRepository(User)
        //     const users = await userRepository.find()
        //     expect(users).toHaveLength(0)
        // })
        // it('should return 400 status code if password is missing', async () => {
        //     // Arrange
        //     const userData = {
        //         firstName: 'Rakesh',
        //         lastName: 'K',
        //         email: 'rakesh@mern.space',
        //         password: '',
        //     }
        //     // Act
        //     const response = await request(app)
        //         .post('/auth/register')
        //         .send(userData)
        //     // Assert
        //     expect(response.statusCode).toBe(400)
        //     const userRepository = connection.getRepository(User)
        //     const users = await userRepository.find()
        //     expect(users).toHaveLength(0)
        // })
    })
})
