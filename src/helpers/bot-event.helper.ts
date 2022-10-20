import { Injectable, Logger } from '@nestjs/common';
import { ReactionAddedEvent, SlackEventPayload, MessageEvent } from '../models/slack-event';
import { SlackService } from 'src/services/slack.service';
import { SlackMessagePostBody } from 'src/models/slack-message';
import { MessageHelper } from './message.helper';

@Injectable()
export class BotEventHelper {
    private readonly logger = new Logger(BotEventHelper.name);

    constructor (private readonly slackService: SlackService, private readonly messageHelper: MessageHelper) {}

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

    mapUserIDToEmoji(userId: string) {
        switch (userId) {
            case 'U01CNL9EZGE':
                return 'jill-angry';
            case 'U025BBF136J':
                return 'jordan-angry';
            case 'U01LGSMLSNA':
                return 'brittney-agrny';
            case 'US7BDEPQQ':
                return 'ryan-agrny';
            case 'U2AK47A48':
                return 'spencer-angry';
            default:
                return null;
        }
    }

    async processMessageEvent(event: MessageEvent) {
        // restrict to specific company only channels
        const validChannels = ['C09ASC613', 'C09ARS0SF', 'C8STXSFQW', 'CG6USEU1Z', 'C01DK4X1004', 'C01BZ69PW4S', 'CSB1Z9LR4', 'C013TM239SM'];

        const mentions = this.messageHelper.parseMentions(event.text);

        if (validChannels.includes(event.channel)) {
            // we use polite words in this slack workspace (sht only)

            // 2% chance of adding a angry reaction when someone talks
            if (Math.random() <= 0.02) {
                const reaction = this.mapUserIDToEmoji(event.user);
                if (reaction) {
                    await this.slackService.addReactionToMessage(event.channel, event.ts, reaction);
                }
            }

            if (event.text.split(' ').filter(x => x.toLowerCase() === 'sht').length > 0) {
                // if U01CNL9EZGE uses "SHT" or a 50% chance for someone else
                // also ignore the message if it's from shtbot
                if (event.user !== 'U015BSC329J' && (event.user === 'U01CNL9EZGE' || Math.floor((Math.random() * 2) + 1) === 1)) {
                    this.logger.warn('someone used the word "SHT" in a message');

                    // swap word in original message
                    const convertedMessage = event.text.split(' ').map(word => {
                        if (word === 'sht') {
                            return '*poop*';
                        } else if (word === 'SHT') {
                            return '*POOP*';
                        }

                        return word;
                    }).join(' ').replace('\n', '\n> ');

                    // send HR response
                    const message: SlackMessagePostBody = {
                        text: `<@${event.user}> Please use "poop" instead of "SHT" :thumbsup:\n> ${convertedMessage}`,
                        channel: event.channel,
                        username: 'Some Idiot from HR',
                        icon_emoji: 'sht'
                    };
        
                    await this.slackService.postMessage(message);
                }
            // add 'angry' reactions when people are mentioned
            } else if (mentions.length > 0) {
                for (const mentionId of mentions.map(x => x.id)) {
                    const reaction = this.mapUserIDToEmoji(mentionId);
                    if (reaction != null && Math.floor((Math.random() * 3) + 1) === 1) {
                        await this.slackService.addReactionToMessage(event.channel, event.ts, reaction);
                    }
                }
            }
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
            case 'watching':
            case 'bashful-shankduck':
            case 'illuminati':
                return 5;
            case 'badalec':
                return 10;
            case 'no-cap':
            case 'billed_cap':
            case 'pleading_face':
            case 'heart':
            case 'heart_eyes': 
            case 'heart_eyes_cat':
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
                return 20;
            default:
                return 100;
        }
    }
}