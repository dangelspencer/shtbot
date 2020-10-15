import { Injectable, Logger } from '@nestjs/common';
import { ReactionAddedEvent, SlackEventPayload } from '../models/slack-event';
import { SlackService } from 'src/services/slack.service';

@Injectable()
export class BotEventHelper {
    private readonly logger = new Logger(BotEventHelper.name);

    constructor (private readonly slackService: SlackService) {}

    async getEventType(event: SlackEventPayload<any>): Promise<string> {
        return `${event.event.type}${event.event.subtype ? `:${event.event.subtype}` : ''}`;
    }

    async processEvent(event: SlackEventPayload<any>): Promise<void> {
        const eventType = await this.getEventType(event);

        switch (eventType) {
            case 'reaction_added':
                this.logger.log('processing "reaction_added" event');
                await this.processReactionAddedEvent(event.event as ReactionAddedEvent);
                break;
            default:
                this.logger.verbose(`unhandled event type "${eventType}"`);
                this.logger.debug(JSON.stringify(event));
                return;
        }
    }

    async processReactionAddedEvent(event: ReactionAddedEvent): Promise<void> {
        if (event.reaction === 'x') {
            const message = await this.slackService.getMessageDetails(event.item.channel, event.item.ts);

            // verify message was created by a bot
            if (message.type === 'message' && message.subtype === 'bot_message') {
                await this.slackService.deleteMessage(event.item.channel, event.item.ts);
            }
        } else if (event.reaction === 'badalec') {
            // use random number to decide if shtbot should also react
            const rand = Math.floor((Math.random() * 10) + 1);
            const currentReactions = await this.slackService.getReactionsOnMessage(event.item.channel, event.item.ts);

            const badalecReactionCount = currentReactions.find(x => {
                return x.name === 'badalec';
            }).count;

            this.logger.verbose(`determining whether or not to add "badalec" reaction to message: ${rand} <= ${badalecReactionCount}`);
            if (rand <= badalecReactionCount) {
                await this.slackService.addReactionToMessage(event.item.channel, event.item.ts, 'badalec');
            }
        }
    }
}