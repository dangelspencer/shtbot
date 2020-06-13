const config = require('./config');
const logger = require('./logger');

const MessageParserHelper = require('./helpers/message-parser');
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

            request.app.getNewMessageParserHelper = async () => {
                return MessageParserHelper;
            };

            return h.continue;
        }
    }
};
