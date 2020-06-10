const Hapi = require('@hapi/hapi');

const config = require('./config');
const logger = require('./logger');

const start = async () => {
    const server = new Hapi.Server(config.server);
    
    await server.start();

    logger.info(`server running on ${server.info.uri}`);
};

start();
