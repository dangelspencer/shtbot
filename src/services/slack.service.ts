import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { SlackMessagePostBody } from 'src/models/slack-message';
import { GenericSlackResponse, SlackUserModel } from 'src/models/slack-responses';
import { config } from '../config';


@Injectable()
export class SlackService {
    async postMessage(messageData: SlackMessagePostBody) {
        const requestOptions: AxiosRequestConfig = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.slack.botUserToken}`,
                'Content-Type': 'application/json; charset=utf-8'
            },
            data: messageData,
            url: 'https://slack.com/api/chat.postEphemeral'
        };

        const response = await axios.request<GenericSlackResponse>(requestOptions);

        if (!response.data.ok) {
            Logger.error(`failed to post message to channel: ${messageData.channel}, error: ${response.data.error}`);
            throw new Error(`failed to post message to channel: ${messageData.channel}, error: ${response.data.error}`);
        }

        Logger.debug(`message successfully posted to channel: ${messageData.channel}`);
    }

    async getUserById(userId: string): Promise<SlackUserModel> {
        if (userId == null) {
            Logger.warn('empty userId passed to SlackService.getUserById()');
            return null;
        }

        const queryString = `token=${config.slack.botUserToken}&user=${userId}`;
        const response = await axios.get<GenericSlackResponse>(`https://slack.com/api/users.info?${queryString}`);

        if (!response.data.ok) {
            Logger.error(`failed to fetch user with userId: ${userId}, error: ${response.data.error}`);
            throw new Error(`failed to fetch user with userId: ${userId}, error: ${response.data.error}`);
        }

        Logger.debug(`response from slack API: ${JSON.stringify(response.data)}`);
        return response.data.user;
    }
}
