const routes = [
    {
        method: 'POST',
        path: '/mock',
        handler: async (request) => {
            const logger = request.app.logger;

            const channel = request.payload.channel_id;
            const textToConvert = request.payload.text;
            const userId = request.payload.user_id;
            const username = request.payload.user_name;

            // convert text
            const textConverterHelper = await request.app.getNewTextConverterHelper();
            const result = await textConverterHelper.textToMockingText(textToConvert);

            // get user details from slack
            const slackService = await request.app.getNewSlackService();
            const user = await slackService.getUserById(request.payload.user_id);

            logger.info(`COMMAND: <@${userId}|${username}> /mock "${textToConvert}"`);

            // post message as user
            await slackService.postToChannel({
                response_type: 'in_channel',
                text: result,
                username: user.profile.real_name,
                icon_url: user.profile.image_original,
                channel
            });

            return '';
        }
    }, {
        method: 'POST',
        path: '/sayas',
        handler: async (request) => {
            const logger = request.app.logger;

            const channel = request.payload.channel_id;
            const text = request.payload.text;
            const userId = request.payload.user_id;
            const username = request.payload.user_name;

            if (text == null || text === '') {
                return {
                    response_type: 'ephemeral',
                    text: 'Invalid command format\nUsage: /sayas @<user> <text>'
                };
            }

            const messageParserHelper = await request.app.getNewMessageParserHelper();

            const mentions = await messageParserHelper.parseMentions(text);

            if (mentions.length === 0) {
                return {
                    response_type: 'ephemeral',
                    text: 'Invalid command format\nUsage: /sayas @<user> <text>'
                };
            }

            // check to make sure the first word is a user
            const indexOfFirstMention = text.indexOf(mentions[0].id);
            if (indexOfFirstMention === 2 && mentions[0].type === '@') {
                const slackService = await request.app.getNewSlackService();

                // get details for user mentioned
                const user = await slackService.getUserById(mentions[0].id);

                const textToEcho = text.substr(text.indexOf(' ')).trim();

                logger.info(`COMMAND: <@${userId}|${username}> /sayas <@${mentions[0].id}|${mentions[0].username}> "${textToEcho}"`);

                // post a message as that user
                await slackService.postToChannel({
                    response_type: 'in_channel',
                    text: textToEcho,
                    username: user.profile.real_name,
                    icon_url: user.profile.image_original,
                    channel
                });

                return '';
            }

            return {
                response_type: 'ephemeral',
                text: 'Invalid command format\nUsage: /sayas @<user> <text>'
            };
        }
    }, {
        method: 'POST',
        path: '/tile',
        handler: async (request) => {
            const logger = request.app.logger;

            const channel = request.payload.channel_id;
            const textToConvert = request.payload.text;
            const userId = request.payload.user_id;
            const username = request.payload.user_name;

            // convert text
            const textConverterHelper = await request.app.getNewTextConverterHelper();
            const result = await textConverterHelper.textToScrabbleTiles(textToConvert);

            // get user details from slack
            const slackService = await request.app.getNewSlackService();
            const user = await slackService.getUserById(request.payload.user_id);

            logger.info(`COMMAND: <@${userId}|${username}> /scrabble "${textToConvert}"`);

            // post message as user
            await slackService.postToChannel({
                response_type: 'in_channel',
                text: result,
                username: user.profile.real_name,
                icon_url: user.profile.image_original,
                channel
            });

            return '';
        }
    }
];

module.exports = routes.map(route => {
    return { ...route, path: `/commands${route.path}` };
});
