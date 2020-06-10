const Hapi = require('@hapi/hapi');

const api = require('./api');
const config = require('./config');
const logger = require('./logger');

const start = async () => {
    const server = new Hapi.Server(config.server);

    server.app.logger = logger;
    await server.register(api);
    
    await server.start();

    logger.info(`server running on ${server.info.uri}`);
};

start();
