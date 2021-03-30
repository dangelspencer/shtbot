import { Injectable, Logger } from '@nestjs/common';
import { ReactionAddedEvent, SlackEventPayload, MessageEvent } from '../models/slack-event';
import { SlackService } from 'src/services/slack.service';
import { SlackMessagePostBody } from 'src/models/slack-message';

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
            case 'message':
                await this.processMessageEvent(event.event as MessageEvent);
                break;
            case 'reaction_added':
                await this.processReactionAddedEvent(event.event as ReactionAddedEvent);
                break;
            default:
                this.logger.verbose(`unhandled event type "${eventType}"`);
                this.logger.debug(JSON.stringify(event));
                return;
        }
    }

    async processMessageEvent(event: MessageEvent) {
        // restrict to specific company only channels
        const validChannels = ['C09ASC613', 'C09ARS0SF', 'C8STXSFQW', 'CG6USEU1Z', 'C01DK4X1004', 'C01BZ69PW4S', 'CSB1Z9LR4', 'C013TM239SM'];

        // we use polite words in this slack workspace
        if (validChannels.includes(event.channel) && event.channel_type === 'channel' && event.user === 'U01CNL9EZGE' && event.text.split(' ').filter(x => x.toLowerCase() === 'sht').length > 0) {
            this.logger.warn('"someone" used the word "SHT" in a message');
            const message: SlackMessagePostBody = {
                text: '<@U01CNL9EZGE> Please use "poop" instead of "SHT" :thumbsup:',
                channel: event.channel,
                username: 'Some Idiot from HR',
                icon_emoji: 'sht'
            };

            await this.slackService.postMessage(message);
        }
    }

    async processReactionAddedEvent(event: ReactionAddedEvent): Promise<void> {
        this.logger.log(`processing event: reaction_added:${event.reaction}`);
        
        if (event.reaction === 'x') {
            await this.slackService.deleteMessage(event.item.channel, event.item.ts);
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
                return 5;
            case 'badalec':
                return 10;
            case '100-oof':
            case 'f':
            case 'eyes':
            case 'joy':
            case '100':
            case 'fire':
            case '+1':
            case 'illuminati':
            case 'brian-wow':
            case 'edgarfeelsbad':
                return 100;
            default:
                return 500;
        }
    }
}