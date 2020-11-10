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
                await this.processReactionAddedEvent(event.event as ReactionAddedEvent);
                break;
            default:
                this.logger.verbose(`unhandled event type "${eventType}"`);
                this.logger.debug(JSON.stringify(event));
                return;
        }
    }

    async processReactionAddedEvent(event: ReactionAddedEvent): Promise<void> {
        this.logger.log(`processing event: reaction_added:${event.reaction}`);
        
        if (event.reaction === 'x') {
            const message = await this.slackService.getMessageDetails(event.item.channel, event.item.ts);

            // verify message was created by a bot
            if (message.type === 'message' && message.subtype === 'bot_message') {
                await this.slackService.deleteMessage(event.item.channel, event.item.ts);
            }
        } else {
            // determine if shtbot should react to a message
            const randomizationFactor = await this.getReactionRandomizationFactor(event.reaction);
            if (randomizationFactor == null) {
                return;
            }

            // use random number to decide if shtbot will react to the message
            const rand = Math.floor((Math.random() * randomizationFactor) + 1);
            const currentReactions = await this.slackService.getReactionsOnMessage(event.item.channel, event.item.ts);

            const reactionCount = currentReactions.find(x => {
                return x.name === event.reaction;
            }).count;

            this.logger.verbose(`determining whether or not to add "${event.reaction}" reaction to message: ${rand} <= ${reactionCount}`);
            if (rand <= reactionCount) {
                await this.slackService.addReactionToMessage(event.item.channel, event.item.ts, event.reaction);
            }
        }
    }

    async getReactionRandomizationFactor(reaction: string): Promise<number> {
        switch (reaction) {
            case 'shankduck':
            case 'badalec':
                return 6;
            case '100-oof':
            case 'f':
            case 'eyes':
            case 'joy':
            case '100':
            case 'fire':
                return 30;
            default:
                return null;
        }
    }
}