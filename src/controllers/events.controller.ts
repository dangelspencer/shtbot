import { Body, Controller, Logger, Post } from '@nestjs/common';
import { BotEventHelper } from 'src/helpers/bot-event.helper';
import { SlackEventPayload } from 'src/models/slack-event';

@Controller('api/events')
export class EventsController {
    constructor(private readonly eventHelper: BotEventHelper) {}

    @Post()
    async postMockingTextAsUser(@Body() body: SlackEventPayload<any>) {
        // respond to auth challenges (when url is changed)
        if (body.challenge != null) {
            Logger.log('responding to auth challenge');
            return body.challenge;
        }

        await this.eventHelper.processEvent(body);
    }
}