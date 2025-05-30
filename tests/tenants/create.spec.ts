import { DataSource } from 'typeorm'
import app from '../../src/app'
import request from 'supertest'
import { AppDataSource } from '../../src/config/data-source'
import createJWKSMock from 'mock-jwks'
import { Roles } from '../../src/constants'

describe('POST /tenants', () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKSMock>
    let admintoken: string

    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5501')
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        // database truncate
        jwks.start()
        await connection.dropDatabase()
        await connection.synchronize()

        admintoken = jwks.token({
            sub: '1',
            role: Roles.ADMIN,
        })
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe('Given all fields', () => {
        it('should return 201 status code', async () => {
            const tenantData = {
                name: 'tenant name',
                address: 'tenant address',
            }

            const response = await request(app)
                .post('/tenants')
                .set('Cookie', [`accessToken=${admintoken}`])
                .send(tenantData)

            expect(response.statusCode).toBe(201)
        })

        it('should create a tenant in database', async () => {
            const tenantData = {
                name: 'tenant name',
                address: 'tenant address',
            }

            await request(app)
                .post('/tenants')
                .set('Cookie', [`accessToken=${admintoken}`])
                .send(tenantData)

            const tenantRepository = connection.getRepository('Tenant')
            const tenants = await tenantRepository.find()

            expect(tenants).toHaveLength(1)
            expect(tenants[0].name).toBe(tenantData.name)
            expect(tenants[0].address).toBe(tenantData.address)
        })

        it('should return 401 if user is not authenticated', async () => {
            const tenantData = {
                name: 'tenant name',
                address: 'tenant address',
            }

            const response = await request(app)
                .post('/tenants')
                .send(tenantData)

            expect(response.statusCode).toBe(401)

            const tenantRepository = connection.getRepository('Tenant')
            const tenants = await tenantRepository.find()

            expect(tenants).toHaveLength(0)
        })
    })
})
