import { Injectable, Logger } from '@nestjs/common';
import { ReactionAddedEvent, SlackEventPayload } from '../models/slack-event';
import { SlackService } from 'src/services/slack.service';
import { config } from '../config';

@Injectable()
export class BotEventHelper {
    constructor (private readonly slackService: SlackService) {}

    async getEventType(event: SlackEventPayload<any>): Promise<string> {
        return `${event.event.type}${event.event.subtype ? `:${event.event.subtype}` : ''}`;
    }

    async processEvent(event: SlackEventPayload<any>): Promise<void> {
        const eventType = await this.getEventType(event);

        switch (eventType) {
            case 'reaction_added':
                Logger.log('processing "reaction_added" event');
                Logger.debug(JSON.stringify(event, null, 4));
                await this.processReactionAddedEvent(event.event as ReactionAddedEvent);
                break;
            default:
                Logger.warn(`unknown event type: ${eventType}`);
                Logger.debug(JSON.stringify(event, null, 4));
                return;
        }
    }

    async processReactionAddedEvent(event: ReactionAddedEvent): Promise<void> {
        if (event.reaction === 'x') {
            // TODO: verify message was created by shtbot
            await this.slackService.deleteMessage(event.item.channel, event.item.ts);
        } else if (event.reaction === 'badalec') {
            // use random number to decide if shtbot should also react
            const rand = Math.floor((Math.random() * 10) + 1);
            const currentReactions = await this.slackService.getReactionsOnMessage(event.item.channel, event.item.ts);

            const badalecReactionCount = currentReactions.find(x => {
                return x.name === 'badalec';
            }).count;

            Logger.debug(`determining whether or not to add "badalec" reaction to message: ${rand} < ${badalecReactionCount}`);
            if (rand <= badalecReactionCount) {
                await this.slackService.addReactionToMessage(event.item.channel, event.item.ts, 'badalec');
            }
        }
    }
}