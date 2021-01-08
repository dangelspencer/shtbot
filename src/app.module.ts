import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SlashCommandsController } from './controllers/commands.controller';
import { EventsController } from './controllers/events.controller';
import { ScrabbleGame } from './games/scrabble.game';
import { BotEventHelper } from './helpers/bot-event.helper';
import { MessageHelper } from './helpers/message.helper';
import { TextHelper } from './helpers/text.helper';
import { SlackRequestValidationMiddleware } from './middleware/slack-request-validation.middleware';
import { GiphyService } from './services/giphy.service';
import { SlackService } from './services/slack.service';

@Module({
  imports: [],
  controllers: [EventsController, SlashCommandsController],
  providers: [BotEventHelper, GiphyService, MessageHelper, SlackService, TextHelper, ScrabbleGame],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(SlackRequestValidationMiddleware)
            .forRoutes(SlashCommandsController, EventsController);
    }
}
