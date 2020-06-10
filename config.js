module.exports = {
    logger: {
        level: process.env.LOGGER_LEVEL || 'debug',
        logDirectory: process.env.LOGGER_DIRECTORY || './logs'
    },
    server: {
        host: process.env.SERVER_HOST || '0.0.0.0',
        port: process.env.SERVER_PORT != null ? parseInt(process.env.SERVER_PORT) : 3000
    }
};
