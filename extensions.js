const config = require('./config');
const logger = require('./logger');

const BotEventProcessor = require('./bot/event-processor');
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

            request.app.getNewBotEventProcessor = async () => {
                const slackService = new SlackService(config.slack, logger);
                return new BotEventProcessor(logger, slackService);
            };

            return h.continue;
        }
    }
};
