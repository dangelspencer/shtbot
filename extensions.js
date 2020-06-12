const config = require('./config');
const logger = require('./logger');

const SlackService = require('./services/slack');

module.exports = {
    onRequest: {
        type: 'onRequest',
        method: async (request, h) => {
            request.app.logger = logger;

            request.app.getNewSlackService = async () => {
                const slackService = new SlackService(config.slack, logger);
                return slackService;
            };
            
            return h.continue;
        }
    }
};
