module.exports = [
    {
        method: 'POST',
        path: '/events',
        handler: async (request) => {
            const logger = request.app.logger;
            const payload = request.payload;

            // respond to auth challenges (when url is changed)
            if (payload.challenge != null) {
                logger.info('responding to auth challenge');
                return payload.challenge;
            }

            const botEventProcessor = await request.app.getNewBotEventProcessor();
            await botEventProcessor.processEvent(payload.event);

            return '';
        }
    }
];
