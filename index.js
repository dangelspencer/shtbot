const Hapi = require('@hapi/hapi');

const api = require('./api');
const config = require('./config');
const extensions = require('./extensions');
const logger = require('./logger');

const start = async () => {
    // check for required config variables
    if (config.slack.botUserToken == null) {
        throw new Error('Environment variable "BOT_USER_TOKEN" required');
    }


    const server = new Hapi.Server(config.server);

    server.app.logger = logger;

    await server.ext(extensions.onRequest);
    await server.register(api);
    
    await server.start();

    logger.info(`server running on ${server.info.uri}`);
};

start();
