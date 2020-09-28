import { Module } from '@nestjs/common';
import { SlashCommandsController } from './controllers/commands.controller';
import { MessageHelper } from './helpers/message.helper';
import { TextHelper } from './helpers/text.helper';
import { SlackService } from './services/slack.service';

@Module({
  imports: [],
  controllers: [SlashCommandsController],
  providers: [MessageHelper, SlackService, TextHelper],
})
export class AppModule {}
