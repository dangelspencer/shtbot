import { Module } from '@nestjs/common';
import { SlashCommandsController } from './controllers/commands.controller';
import { EventsController } from './controllers/events.controller';
import { BotEventHelper } from './helpers/bot-event.helper';
import { MessageHelper } from './helpers/message.helper';
import { TextHelper } from './helpers/text.helper';
import { SlackService } from './services/slack.service';

@Module({
  imports: [],
  controllers: [EventsController, SlashCommandsController],
  providers: [BotEventHelper, MessageHelper, SlackService, TextHelper],
})
export class AppModule {}
