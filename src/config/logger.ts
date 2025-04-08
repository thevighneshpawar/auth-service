import winston from 'winston'
import { Config } from '.'

const logger = winston.createLogger({
    level: 'info',
    defaultMeta: {
        serviceName: 'auth-service',
    },
    transports: [
        //logs ka storage
        new winston.transports.File({
            level: 'info',
            dirname: 'logs',
            filename: 'combined.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
                winston.format.prettyPrint(),
            ),

            silent: Config.NODE_ENV === 'test',
            //silent:true then this logger not log used in testing
        }),
        new winston.transports.File({
            level: 'error',
            dirname: 'logs',
            filename: 'error.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
                winston.format.prettyPrint(),
            ),
            silent: Config.NODE_ENV === 'test',
        }),
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
                winston.format.prettyPrint(),
            ),
            silent: Config.NODE_ENV === 'test',
        }),
    ],
})

export default logger
