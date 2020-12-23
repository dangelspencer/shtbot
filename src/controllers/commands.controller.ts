import { Body, Controller, Logger, Post } from '@nestjs/common';
import { SlackCommandPostBody } from '../models/slack-command';
import { SlackMessagePostBody } from '../models/slack-message';
import { SlackService } from '../services/slack.service';
import { TextHelper } from '../helpers/text.helper';
import { MessageHelper } from '../helpers/message.helper';
import { GiphyService } from 'src/services/giphy.service';

@Controller('api/slash-commands')
export class SlashCommandsController {
    private readonly logger = new Logger(SlashCommandsController.name);

    constructor(
        private readonly giphyService: GiphyService,
        private readonly messageHelper: MessageHelper,
        private readonly slackService: SlackService,
        private readonly textHelper: TextHelper
    ) {}

    @Post('fire')
    async fireUser(@Body() body: SlackCommandPostBody) {
        this.logger.log(`<@${body.user_id}|${body.user_name}> /fire "${body.text}"`);

        if (body.text.trim() === '') {
            this.logger.warn('no text passed to /fire command');
            return {
                response_type: 'ephemeral',
                text: 'Invalid command format - usage: /fire <@user>'
            };
        }

        this.logger.verbose('parsing tagged user from command text');
        const mentions = this.messageHelper.parseMentions(body.text);
        if (mentions.length === 0) {
            this.logger.warn('no user tags passed to /fire command');
            return {
                response_type: 'ephemeral',
                text: 'Invalid command format - usage: /fire <@user>'
            };
        }

        this.logger.verbose('verifying first word of text is a tagged user');
        const messageText = body.text.split(' ');
        const indexOfFirstMention = messageText[0].indexOf(mentions[0].id);
        if (indexOfFirstMention === -1 || mentions[0].type !== '@') {
            this.logger.warn('tagged user is not first word in text passed to /fire command');
            return {
                response_type: 'ephemeral',
                text: 'Invalid command format - usage: /fire <@user>'
            };
        }

        const gif = await this.giphyService.getGifForSearchText('gtfo');

        const messageBlocks = [];
        messageBlocks.push(this.messageHelper.buildMarkdownBlock(`<@${mentions[0].id}>, you're fired`));
        messageBlocks.push(this.messageHelper.buildImageBlock('gtfo', gif.images.downsized.url, gif.slug));

        await this.slackService.postMessage({
            blocks: messageBlocks,
            channel: body.channel_id
        });
    }

    @Post('mock')
    async postMockingTextAsUser(@Body() body: SlackCommandPostBody) {
        this.logger.log(`<@${body.user_id}|${body.user_name}> /mock "${body.text}"`);

        if (body.text.trim() === '') {
            this.logger.warn('no text passed to /mock command');
            return {
                response_type: 'ephemeral',
                text: 'Invalid command format - usage: /mock <text>'
            };
        }

        this.logger.verbose(`converting text "${body.text}" to mocking text`);
        const convertedText = this.textHelper.textToMockingText(body.text);

        this.logger.verbose(`fetching user by id: ${body.user_id}`);
        const user = await this.slackService.getUserById(body.user_id);

        const message: SlackMessagePostBody = {
            text: convertedText,
            channel: body.channel_id,
            username: user.profile.display_name,
            icon_url: user.profile.image_original
        };

        this.logger.verbose(`posting message to channel as user <@${body.user_id}|${body.user_name}>`);
        await this.slackService.postMessage(message);
    }

    @Post('sayas')
    async impersonateUser(@Body() body: SlackCommandPostBody) {
        this.logger.log(`<@${body.user_id}|${body.user_name}> /sayas "${body.text}"`);

        if (body.text.trim() === '') {
            this.logger.warn('no text passed to /sayas command');
            return {
                response_type: 'ephemeral',
                text: 'Invalid command format - usage: /sayas <@user> <text>'
            };
        }

        this.logger.verbose('parsing tagged user from command text');
        const mentions = this.messageHelper.parseMentions(body.text);
        if (mentions.length === 0) {
            this.logger.warn('no user tags passed to /sayas command');
            return {
                response_type: 'ephemeral',
                text: 'Invalid command format - usage: /sayas <@user> <text>'
            };
        }

        this.logger.verbose('verifying first word of text is a tagged user');
        const messageText = body.text.split(' ');
        const indexOfFirstMention = messageText[0].indexOf(mentions[0].id);
        if (indexOfFirstMention === -1 || mentions[0].type !== '@') {
            this.logger.warn('tagged user is not first word in text passed to /sayas command');
            return {
                response_type: 'ephemeral',
                text: 'Invalid command format - usage: /sayas <@user> <text>'
            };
        }

        this.logger.verbose(`fetching user by id: ${body.user_id}`);
        const user = await this.slackService.getUserById(mentions[0].id);

        const message: SlackMessagePostBody = {
            text: body.text.substr(body.text.indexOf(' ')).trim(),
            channel: body.channel_id,
            username: user.profile.display_name == null || user.profile.display_name == '' ? user.profile.real_name_normalized : user.profile.display_name,
            icon_url: user.profile.image_original
        };

        this.logger.verbose(`posting message to channel as user <@${mentions[0].id}|${mentions[0].username}>`);
        await this.slackService.postMessage(message);
    }

    @Post('scrabble')
    async postScrabbleTilesAsUser(@Body() body: SlackCommandPostBody) {
        this.logger.log(`<@${body.user_id}|${body.user_name}> /scrabble "${body.text}"`);

        if (body.text.trim() === '') {
            this.logger.warn('no text passed to /scrabble command');
            return {
                response_type: 'ephemeral',
                text: 'Invalid command format - usage: /scrabble <text>'
            };
        }

        this.logger.verbose(`converting text "${body.text}" to scrabble tile emojis`);
        const convertedText = this.textHelper.textToScrabbleTiles(body.text);

        this.logger.verbose(`fetching user by id: ${body.user_id}`);
        const user = await this.slackService.getUserById(body.user_id);

        const message: SlackMessagePostBody = {
            text: convertedText,
            channel: body.channel_id,
            username: user.profile.display_name,
            icon_url: user.profile.image_original
        };

        this.logger.verbose(`posting message to channel as user <@${body.user_id}|${body.user_name}>`);
        await this.slackService.postMessage(message);
    }
}