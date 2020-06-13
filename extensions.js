const config = require('./config');
const logger = require('./logger');

const SlackService = require('./services/slack');
const TextConverterHelper = require('./helpers/text-converter');

module.exports = {
    onRequest: {
        type: 'onRequest',
        method: async (request, h) => {
            request.app.logger = logger;

            request.app.getNewSlackService = async () => {
                const slackService = new SlackService(config.slack, logger);
                return slackService;
            };

            request.app.getNewTextConverterHelper = async () => {
                return TextConverterHelper;
            };

            return h.continue;
        }
    }
};
