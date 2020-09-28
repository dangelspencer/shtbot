import { Body, Controller, Logger, Post } from '@nestjs/common';
import { SlackCommandPostBody } from '../models/slack-command';
import { SlackMessagePostBody } from '../models/slack-message';
import { SlackService } from '../services/slack.service';
import { TextHelper } from '../helpers/text.helper';
import { MessageHelper } from '../helpers/message.helper';

@Controller('api/slash-commands')
export class SlashCommandsController {
    constructor(
        private readonly messageHelper: MessageHelper,
        private readonly slackService: SlackService,
        private readonly textHelper: TextHelper
    ) {}

    @Post('mock')
    async postMockingTextAsUser(@Body() body: SlackCommandPostBody) {
        Logger.log(`<@${body.user_id}|${body.user_name}> /mock ${body.text}`);

        if (body.text.trim() === '') {
            Logger.warn('no text passed to /mock command');
            return {
                response_type: 'ephemeral',
                text: 'Invalid command format - usage: /mock <text>'
            };
        }

        Logger.debug(`converting text "${body.text}" to mocking text`);
        const convertedText = this.textHelper.textToMockingText(body.text);

        Logger.debug(`fetching user by id: ${body.user_id}`);
        const user = await this.slackService.getUserById(body.user_id);

        const message: SlackMessagePostBody = {
            text: convertedText,
            channel: body.channel_id,
            username: user.profile.display_name,
            icon_url: user.profile.image_original
        };

        Logger.debug(`posting message to channel as user <@${body.user_id}|${body.user_name}>`);
        await this.slackService.postMessage(message);
    }

    @Post('sayas')
    async impersonateUser(@Body() body: SlackCommandPostBody) {
        Logger.log(`<@${body.user_id}|${body.user_name}> /sayas ${body.text}`);

        if (body.text.trim() === '') {
            Logger.warn('no text passed to /sayas command');
            return {
                response_type: 'ephemeral',
                text: 'Invalid command format - usage: /sayas <@user> <text>'
            };
        }

        Logger.debug('parsing tagged user from command text');
        const mentions = this.messageHelper.parseMentions(body.text);
        if (mentions.length === 0) {
            Logger.warn('no user tags passed to /sayas command');
            return {
                response_type: 'ephemeral',
                text: 'Invalid command format - usage: /sayas <@user> <text>'
            };
        }

        Logger.debug('verifying first word of text is a tagged user');
        const messageText = body.text.split(' ');
        const indexOfFirstMention = messageText[0].indexOf(mentions[0].id);
        if (indexOfFirstMention === -1 || mentions[0].type !== '@') {
            Logger.warn('tagged user is not first word in text passed to /sayas command');
            return {
                response_type: 'ephemeral',
                text: 'Invalid command format - usage: /sayas <@user> <text>'
            };
        }

        Logger.debug(`fetching user by id: ${body.user_id}`);
        const user = await this.slackService.getUserById(mentions[0].id);

        const message: SlackMessagePostBody = {
            text: body.text.substr(body.text.indexOf(' ')).trim(),
            channel: body.channel_id,
            username: user.profile.display_name,
            icon_url: user.profile.image_original
        };

        Logger.debug(`posting message to channel as user <@${body.user_id}|${body.user_name}>`);
        await this.slackService.postMessage(message);
    }

    @Post('scrabble')
    async postScrabbleTilesAsUser(@Body() body: SlackCommandPostBody) {
        Logger.log(`<@${body.user_id}|${body.user_name}> /scrabble ${body.text}`);

        if (body.text.trim() === '') {
            Logger.warn('no text passed to /scrabble command');
            return {
                response_type: 'ephemeral',
                text: 'Invalid command format - usage: /scrabble <text>'
            };
        }

        Logger.debug(`converting text "${body.text}" to scrabble tile emojis`);
        const convertedText = this.textHelper.textToScrabbleTiles(body.text);

        Logger.debug(`fetching user by id: ${body.user_id}`);
        const user = await this.slackService.getUserById(body.user_id);

        const message: SlackMessagePostBody = {
            text: convertedText,
            channel: body.channel_id,
            username: user.profile.display_name,
            icon_url: user.profile.image_original
        };

        Logger.debug(`posting message to channel as user <@${body.user_id}|${body.user_name}>`);
        await this.slackService.postMessage(message);
    }
}