import { Config } from './config'
import app from './app'
import logger from './config/logger'
import { AppDataSource } from './config/data-source'
import { User } from './entity/User'
import bcrypt from 'bcryptjs'
import { Roles } from './constants'

const createAdminUser = async () => {
    const userRepository = AppDataSource.getRepository(User)

    // Check if an admin user already exists
    const existingAdmin = await userRepository.findOneBy({ role: Roles.ADMIN })
    if (existingAdmin) {
        logger.info('Admin user already exists. Skipping admin creation.')
        return
    }

    // Create a new admin user
    const adminEmail = Config.ADMIN_EMAIL
    const adminPassword = Config.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
        logger.error(
            'Admin email or password is not set in environment variables.',
        )
        throw new Error('Admin email or password is missing.')
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    const adminUser = userRepository.create({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: hashedPassword,
        role: Roles.ADMIN,
    })

    await userRepository.save(adminUser)
    logger.info('Admin user has been created successfully.')
}

const startServer = async () => {
    const PORT = Config.PORT
    try {
        await AppDataSource.initialize()
        logger.info('Database connection has been established')

        // Create admin user
        await createAdminUser()

        app.listen(PORT, () => {
            logger.info('Listening on port ', { port: PORT })
        })
    } catch (error) {
        logger.error('Error starting the server:', error)
        process.exit(1)
    }
}

void startServer()
