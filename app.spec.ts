import app from './src/app'
import { calculatediscount } from './src/utils'
import request from 'supertest'

describe('App', () => {
    //we can use it or test
    it('Should return correct discount', () => {
        const discount = calculatediscount(100, 10)
        expect(discount).toBe(10)
    })

    it('Should return 200 status code', async () => {
        const response = await request(app).get('/').send()
        expect(response.statusCode).toBe(200)
    })
})
