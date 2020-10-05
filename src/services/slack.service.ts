import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { time } from 'console';
import { SlackMessagePostBody } from 'src/models/slack-message';
import { GenericSlackResponse, SlackReactionModel, SlackUserModel } from 'src/models/slack-responses';
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
            Logger.debug(JSON.stringify(requestOptions, null, 4));
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

    async deleteMessage(channel, ts) {
        Logger.debug(`deleting message in channel '${channel}' with timestamp '${ts}'`);

        const requestOptions: AxiosRequestConfig = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.slack.botUserToken}`,
                'Content-Type': 'application/json; charset=utf-8'
            },
            data: {
                channel,
                ts
            },
            url: 'https://slack.com/api/chat.delete'
        };

        const response = await axios.request<GenericSlackResponse>(requestOptions);

        if (!response.data.ok) {
            Logger.error(`failed to delete message in channel: ${channel}, error: ${response.data.error}`);
            Logger.debug(JSON.stringify(requestOptions, null, 4));
            throw new Error(`failed to delete message in channel: ${channel}, error: ${response.data.error}`);
        }
    }

    async getReactionsOnMessage(channel: string, timestamp: string): Promise<[SlackReactionModel]> {
        Logger.debug(`fetching reactions for message in channel '${channel}' with timestamp '${timestamp}'`);

        const queryString = `token=${config.slack.botUserToken}&channel=${channel}&timestamp=${timestamp}`;
        const response = await axios.get<GenericSlackResponse>(`https://slack.com/api/reactions.get?${queryString}`);

        if (!response.data.ok) {
            Logger.error(`failed to fetch reactions for message in channel: ${channel}, error: ${response.data.error}`);
            throw new Error(`failed to fetch reactions for message in channel: ${channel}, error: ${response.data.error}`);
        }

        Logger.debug(`response from slack API: ${JSON.stringify(response.data)}`);
        return response.data.message.reactions;
    }

    async addReactionToMessage(channel: string, timestamp: string, reaction: string) {
        Logger.debug(`adding reaction to message in channel '${channel}' with timestamp '${timestamp}'`);

        const requestOptions: AxiosRequestConfig = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.slack.botUserToken}`,
                'Content-Type': 'application/json; charset=utf-8'
            },
            data: {
                channel,
                timestamp,
                name: reaction
            },
            url: 'https://slack.com/api/reactions.add'
        };

        const response = await axios.request<GenericSlackResponse>(requestOptions);

        if (!response.data.ok && response.data.error !== 'already_reacted') {
            Logger.error(`failed to add reaction to message in channel: ${channel}, error: ${response.data.error}`);
            Logger.debug(JSON.stringify(requestOptions, null, 4));
            throw new Error(`failed to add reaction to message in channel: ${channel}, error: ${response.data.error}`);
        }
    }
}
