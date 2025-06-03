import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { User } from '../entity/User'
import { Config } from '.'
import { RefreshToken } from '../entity/RefreshToken'

// console.log('DB Config:', {
//     host: Config.DB_HOST,
//     port: Config.DB_PORT,
//     username: Config.DB_USERNAME,
//     password: Config.DB_PASSWORD, // Check if this is undefined
//     database: Config.DB_NAME,
// })

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: Config.DB_HOST,
    port: Number(Config.DB_PORT),
    username: Config.DB_USERNAME,
    password: Config.DB_PASSWORD,
    database: Config.DB_NAME,
    //make it false in production always keep false
    synchronize: false,
    logging: false,
    entities: ['src/entity/**/*.{ts,js}'],
    migrations: ['src/migration/**/*.{ts,js}'],
    subscribers: [],
})
