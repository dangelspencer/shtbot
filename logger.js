const config = require('./config');
const winston = require('winston');
const WinstonDailyRotateFile = require('winston-daily-rotate-file');

const consoleErrorStackFormat = winston.format.printf(info => {
    if (info.message instanceof Object) {
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

module.exports = winston.createLogger({
    level: config.logger.level,
    transports: [
        new winston.transports.Console(
            {
                level: config.logger.level,
                format: winston.format.combine(
                    winston.format.colorize(),
                    consoleErrorStackFormat
                )
            }
        ),
        new WinstonDailyRotateFile(
            {
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
