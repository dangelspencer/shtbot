const axios = require('axios');

class SlackService {
    constructor (config, logger) {
        this.config = config;
        this.logger = logger;
    }

    // get user details from slack
    async getUserById(userId) {
        if (userId == null) {
            return null;
        }

        this.logger.debug(`fetching user by id: ${userId}`);
        const queryString = `token=${this.config.botUserToken}&user=${userId}`;
        const response = await axios.get(`https://slack.com/api/users.info?${queryString}`);

        if (!response.data.ok) {
            this.logger.error('Failed to fetch user from slack');
            this.logger.error(response.data);
            return null;
        }

        this.logger.debug(`response from slack API: ${JSON.stringify(response.data)}`);
        return response.data.user;
    }

    // post a message to a channel
    async postMessage(data) {
        this.logger.debug(`posting to channel: ${data.channel}`);

        const requestOptions = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.config.botUserToken}`,
                'Content-Type': 'application/json; charset=utf-8'
            },
            data,
            url: 'https://slack.com/api/chat.postMessage'
        };

        const response = await axios(requestOptions);

        if (!response.data.ok) {
            this.logger.error('Failed to post to channel');
            this.logger.error(response.data);
            this.logger.error(response.config);
        }
    }

    // delete message in channel by timestamp
    async deleteMessage(channel, ts) {
        this.logger.debug(`deleting message in channel '${channel}' with timestamp '${ts}'`);

        const requestOptions = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.config.botUserToken}`,
                'Content-Type': 'application/json; charset=utf-8'
            },
            data: {
                channel,
                ts
            },
            url: 'https://slack.com/api/chat.delete'
        };

        const response = await axios(requestOptions);

        if (!response.data.ok) {
            this.logger.error('Failed to delete message');
            this.logger.error(response.data);
            this.logger.error(response.config);
        }
    }


    // post an ephemeral message to a channel
    async postEphemeral(data) {
        this.logger.debug(`posting message to channel '${data.channel}' for user '${data.user}'`);

        const requestOptions = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.config.botUserToken}`,
                'Content-Type': 'application/json; charset=utf-8'
            },
            data,
            url: 'https://slack.com/api/chat.postEphemeral'
        };

        const response = await axios(requestOptions);

        if (!response.data.ok) {
            this.logger.error('Failed to post to channel');
            this.logger.error(response.data);
            this.logger.error(response.config);
        }
    }
}

module.exports = SlackService;
