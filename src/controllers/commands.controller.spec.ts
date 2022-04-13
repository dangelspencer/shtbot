import { Test } from '@nestjs/testing';
import { SlashCommandsController } from './commands.controller';
import { SlackService } from '../services/slack.service';
import { MessageHelper } from '../helpers/message.helper';
import { TextHelper } from '../helpers/text.helper';
import { SlackMessagePostBody } from '../models/slack-message';
import { SlackUserModel } from '../models/slack-responses';
import { SlackCommandPostBody } from '../models/slack-command';
import { GiphyService } from '../services/giphy.service';
import { ScrabbleGame } from '../games/scrabble.game';

describe('AppController', () => {
    let messageHelper: MessageHelper;
    let slackService: SlackService;
    let slashCommandsController: SlashCommandsController;
    let textHelper: TextHelper;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [SlashCommandsController],
            providers: [GiphyService, MessageHelper, ScrabbleGame, SlackService, TextHelper]
        }).compile();

        messageHelper = moduleRef.get<MessageHelper>(MessageHelper);
        slackService = moduleRef.get<SlackService>(SlackService);
        slashCommandsController = moduleRef.get<SlashCommandsController>(SlashCommandsController);
        textHelper = moduleRef.get<TextHelper>(TextHelper);
    });

    describe('SlashCommandsController', () => {
        describe('postMockingTextAsUser', () => {
            it('no command text returns usage message', async () => {
                const getUserSpy = jest.spyOn(slackService, 'getUserById')
                    .mockImplementation((userId: string) => { 
                        return new Promise(resolve => {
                            const user: SlackUserModel = {
                                id: 'test-id',
                                team_id: '',
                                name: '',
                                deleted: false,
                                color: '',
                                real_name: '',
                                tz: '',
                                tz_label: '',
                                tz_offset: 0,
                                profile: {
                                    avatar_hash: '',
                                    status_text: '',
                                    status_emoji: '',
                                    real_name: '',
                                    display_name: 'test user',
                                    real_name_normalized: '',
                                    display_name_normalized: '',
                                    email: '',
                                    image_original: 'test-image-url',
                                    image_24: '',
                                    image_32: '',
                                    image_48: '',
                                    image_72: '',
                                    image_192: '',
                                    image_512: '',
                                    team: '',
                                },
                                is_admin: false,
                                is_owner: false,
                                is_primary_owner: false,
                                is_restricted: false,
                                is_ultra_restricted: false,
                                is_bot: false,
                                updated: 0,
                                is_app_user: false,
                                has_2fa: false,
                            };
                            resolve(user);
                        }); 
                    });

                const postMessageSpy = jest.spyOn(slackService, 'postMessage')
                    .mockImplementation((messageData: SlackMessagePostBody) => { 
                        return new Promise(resolve => {
                            resolve();
                        }); 
                    });
                
                const body: SlackCommandPostBody = {
                    token: '',
                    command: 'mock',
                    text: '',
                    response_url: '',
                    trigger_id: '',
                    user_id: '',
                    user_name: '',
                    team_id: '',
                    team_name: '',
                    enterprise_id: '',
                    enterprise_name: '',
                    channel_id: '',
                    channel_name: '',
                    api_app_id: ''
                };

                const response = await slashCommandsController.postMockingTextAsUser(body);

                expect(response).toEqual({
                    response_type: 'ephemeral',
                    text: 'Invalid command format - usage: /mock <text>'
                });
                expect(getUserSpy).not.toBeCalled();
                expect(postMessageSpy).not.toBeCalled();
            });

            it('posts message as user with mocking text', async () => {
                const getUserSpy = jest.spyOn(slackService, 'getUserById')
                    .mockImplementation((userId: string) => { 
                        return new Promise(resolve => {
                            const user: SlackUserModel = {
                                id: 'test-id',
                                team_id: '',
                                name: '',
                                deleted: false,
                                color: '',
                                real_name: '',
                                tz: '',
                                tz_label: '',
                                tz_offset: 0,
                                profile: {
                                    avatar_hash: '',
                                    status_text: '',
                                    status_emoji: '',
                                    real_name: '',
                                    display_name: 'test user',
                                    real_name_normalized: '',
                                    display_name_normalized: '',
                                    email: '',
                                    image_original: 'test-image-url',
                                    image_24: '',
                                    image_32: '',
                                    image_48: '',
                                    image_72: '',
                                    image_192: '',
                                    image_512: '',
                                    team: '',
                                },
                                is_admin: false,
                                is_owner: false,
                                is_primary_owner: false,
                                is_restricted: false,
                                is_ultra_restricted: false,
                                is_bot: false,
                                updated: 0,
                                is_app_user: false,
                                has_2fa: false,
                            };
                            resolve(user);
                        }); 
                    });

                const postMessageSpy = jest.spyOn(slackService, 'postMessage')
                    .mockImplementation((messageData: SlackMessagePostBody) => { 
                        return new Promise(resolve => {
                            resolve();
                        }); 
                    });
                
                const body: SlackCommandPostBody = {
                    token: '',
                    command: 'mock',
                    text: 'sample text',
                    response_url: '',
                    trigger_id: '',
                    user_id: '',
                    user_name: '',
                    team_id: '',
                    team_name: '',
                    enterprise_id: '',
                    enterprise_name: '',
                    channel_id: '',
                    channel_name: '',
                    api_app_id: ''
                };

                await slashCommandsController.postMockingTextAsUser(body);

                expect(getUserSpy).toBeCalled();
                expect(postMessageSpy).toBeCalled();
            });
        });   
    });
});
