class BotEventProcessor {
    constructor(logger, slackService) {
        this.logger = logger;
        this.slackService = slackService;
    }

    async getEventType(event) {
        return `${event.type}${event.sub_type ? `:${event.sub_type}` : ''}`;
    }

    async processEvent(event) {
        const eventType = await this.getEventType(event);

        switch (eventType) {
            case 'reaction_added':
                await this.processReactionAddedEvent(event);
                break;
            default:
                this.logger.warn(`unknown event type: ${eventType}`);
                return;
        }
    }

    async processReactionAddedEvent(event) {
        if (event.reaction === 'x') {
            await this.slackService.deleteMessage(event.item.channel, event.item.ts);
        }
    }
}

module.exports = BotEventProcessor;
