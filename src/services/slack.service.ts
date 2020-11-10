import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { SlackMessagePostBody } from 'src/models/slack-message';
import { GenericSlackResponse, SlackMessageModel, SlackReactionModel, SlackUserModel } from 'src/models/slack-responses';
import { config } from '../config';


@Injectable()
export class SlackService {
    private readonly logger = new Logger(SlackService.name);

    async postMessage(messageData: SlackMessagePostBody) {
        this.logger.verbose(`posting message to channel '${messageData.channel}'`);

        const requestOptions: AxiosRequestConfig = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.slack.botUserToken}`,
                'Content-Type': 'application/json; charset=utf-8'
            },
            data: messageData,
            url: 'https://slack.com/api/chat.postMessage'
        };

        const response = await axios.request<GenericSlackResponse>(requestOptions);
        this.logger.debug(`response from slack API: ${JSON.stringify(response.data)}`);

        if (!response.data.ok) {
            this.logger.error(`failed to post message to channel: ${messageData.channel}, error: ${response.data.error}`);
            throw new Error(`failed to post message to channel: ${messageData.channel}, error: ${response.data.error}`);
        }

        this.logger.verbose(`message successfully posted to channel: ${messageData.channel}`);
    }

    async getUserById(userId: string): Promise<SlackUserModel> {
        this.logger.verbose(`fetching user with id '${userId}'`);

        if (userId == null) {
            this.logger.warn('empty userId passed to SlackService.getUserById()');
            return null;
        }

        const queryString = `token=${config.slack.botUserToken}&user=${userId}`;
        const response = await axios.get<GenericSlackResponse>(`https://slack.com/api/users.info?${queryString}`);
        this.logger.debug(`response from slack API: ${JSON.stringify(response.data)}`);

        if (!response.data.ok) {
            this.logger.error(`failed to fetch user with userId: ${userId}, error: ${response.data.error}`);
            throw new Error(`failed to fetch user with userId: ${userId}, error: ${response.data.error}`);
        }

        return response.data.user;
    }

    async deleteMessage(channel, ts) {
        this.logger.verbose(`deleting message in channel '${channel}' with timestamp '${ts}'`);

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
        this.logger.debug(`response from slack API: ${JSON.stringify(response.data)}`);

        if (!response.data.ok) {
            this.logger.warn(`failed to delete message in channel: ${channel}, error: ${response.data.error}`);
        }
    }

    async getReactionsOnMessage(channel: string, timestamp: string): Promise<[SlackReactionModel]> {
        this.logger.verbose(`fetching reactions for message in channel '${channel}' with timestamp '${timestamp}'`);

        const queryString = `token=${config.slack.botUserToken}&channel=${channel}&timestamp=${timestamp}`;
        const response = await axios.get<GenericSlackResponse>(`https://slack.com/api/reactions.get?${queryString}`);
        this.logger.debug(`response from slack API: ${JSON.stringify(response.data)}`);

        if (!response.data.ok) {
            this.logger.error(`failed to fetch reactions for message in channel: ${channel}, error: ${response.data.error}`);
            throw new Error(`failed to fetch reactions for message in channel: ${channel}, error: ${response.data.error}`);
        }

        return response.data.message.reactions;
    }

    async addReactionToMessage(channel: string, timestamp: string, reaction: string) {
        this.logger.verbose(`adding reaction to message in channel '${channel}' with timestamp '${timestamp}'`);

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
        this.logger.debug(`response from slack API: ${JSON.stringify(response.data)}`);

        if (!response.data.ok && response.data.error !== 'already_reacted') {
            this.logger.error(`failed to add reaction to message in channel: ${channel}, error: ${response.data.error}`);
            throw new Error(`failed to add reaction to message in channel: ${channel}, error: ${response.data.error}`);
        }
    }

    async getMessageDetails(channel: string, timestamp: string): Promise<SlackMessageModel> {
        this.logger.verbose(`fetching message in channel '${channel}' with timestamp '${timestamp}'`);

        const queryString = `token=${config.slack.botUserToken}&channel=${channel}&timestamp=${timestamp}&limit=1&inclusive=true`;
        const response = await axios.get<GenericSlackResponse>(`https://slack.com/api/conversations.history?${queryString}`);
        this.logger.debug(`response from slack API: ${JSON.stringify(response.data)}`);

        if (!response.data.ok && response.data.error !== 'already_reacted') {
            this.logger.error(`failed to fetch message in channel: ${channel}, error: ${response.data.error}`);
            throw new Error(`failed to fetch message in channel: ${channel}, error: ${response.data.error}`);
        }

        return response.data.messages[0];
    }
}
