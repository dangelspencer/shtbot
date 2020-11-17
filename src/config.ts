const config = {
    giphy: {
        apiKey: process.env.GIPHY_API_KEY
    },
    logger: {
        level: process.env.LOGGER_LEVEL || 'debug',
        consoleLevel: process.env.CONSOLE_LOGGER_LEVEL || 'verbose',
        logDirectory: process.env.LOGGER_DIRECTORY || './logs'
    },
    server: {
        host: process.env.SERVER_HOST || '0.0.0.0',
        port: process.env.SERVER_PORT != null ? parseInt(process.env.SERVER_PORT) : 3000
    },
    slack: {
        botUserToken: process.env.BOT_USER_TOKEN,
        slackSigningSecret: process.env.SLACK_SIGNING_SECRET
    }
};

export { config };