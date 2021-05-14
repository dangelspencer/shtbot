import { Body, Controller, Logger, Post } from '@nestjs/common';
import { SlackMessagePostBody } from '../models/slack-message';
import { SlackService } from '../services/slack.service';
import { AskEdgarPostBody } from 'src/models/ask-edgar';

@Controller('api/external')
export class ExternalController {
    private readonly logger = new Logger(ExternalController.name);

    constructor(
        private readonly slackService: SlackService,
    ) {}

    @Post('ask-edgar')
    async askEdgar(@Body() body: AskEdgarPostBody) {
        this.logger.log(`Someone asked Edgar "${body.message}"`)

        if (body.message.trim() === '') {
            this.logger.warn('no text passed to Ask Edgar command');
        }

        const userTokens = {
            will: 'U565PMAL8',
            edgar: 'U013SSH9P7V',
        }
        const message: SlackMessagePostBody = {
            text: body.message,
            channel: body.userId ?? userTokens.will,
            username: 'Ask Edgar',
        };

        this.slackService.postMessage(message);
        return;
    }
}