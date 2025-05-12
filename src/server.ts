import { Config } from './config'
import app from './app'
import logger from './config/logger'
import { AppDataSource } from './config/data-source'

const startServer = async () => {
    const PORT = Config.PORT
    try {
        await AppDataSource.initialize()
        logger.info('Database connection has been established')

        app.listen(PORT, () => {
            logger.info('Listening on port ', { port: PORT })
        })
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

void startServer()
