import { LoggerService as LS } from '@nestjs/common';
import * as winston from 'winston';
import { config } from './config';
import * as WinstonDailyRotateFile from 'winston-daily-rotate-file';

export class LoggerService implements LS {

    private logger: winston.Logger;

	constructor() {
        const consoleErrorStackFormat = winston.format.printf(info => {
            if ((info as any).message instanceof Object) {
                return `${info.timestamp} ${info.level} ${JSON.stringify(info.message)} : ${info.stack || ''}`;
            }
        
            let output = `${info.timestamp} ${info.level} ${info.message != null ? info.message : ''}`;
        
            delete info.timestamp;
            delete info.level;
            delete info.message;
        
            if (Object.keys(info).length > 0) {
                output += `\n${JSON.stringify(info, null, 4)}`;
            }
        
            return output;
        });

		this.logger = winston.createLogger({
            transports: [
                new winston.transports.Console(
                    {
                        level: config.logger.consoleLevel,
                        format: winston.format.combine(
                            winston.format.colorize(),
                            consoleErrorStackFormat
                        )
                    }
                ),
                new WinstonDailyRotateFile(
                    {
                        level: config.logger.level,
                        filename: `${config.logger.logDirectory}/app-%DATE%.log`,
                        datePattern: 'YYYY-MM-DD'
                    }
                )
            ],
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        });
	}

	log(message: string) {
		this.logger.info(message);
	}
	error(message: string, trace: string) {
		this.logger.error(message, trace);
	}
	warn(message: string) {
		this.logger.warn(message);
	}
	debug(message: string) {
		this.logger.debug(message);
	}
	verbose(message: string) {
		this.logger.verbose(message);
	}
}