// shamelessly adapted from https://stackoverflow.com/a/54788734

import { config } from '../config';
import { HttpException, HttpStatus, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class SlackRequestValidationMiddleware implements NestMiddleware {
    private readonly logger = new Logger(SlackRequestValidationMiddleware.name);

    async use(req: Request, res: Response, next: () => void) {
        this.logger.verbose('validating request is from slack');

        const signature = req.headers['x-slack-signature'] as string;
        const timestamp = req.headers['x-slack-request-timestamp'] as string;
        
        const hmac = crypto.createHmac('sha256', config.slack.slackSigningSecret);
        const [version, hash] = signature.split('=');

        // Check if the timestamp is too old
        // tslint:disable-next-line:no-bitwise
        const fiveMinutesAgo = ~~(Date.now() / 1000) - (60 * 5);
        if (parseInt(timestamp) < fiveMinutesAgo) { return false; }

        hmac.update(`${version}:${timestamp}:${(req as any).rawBody}`);

        // check that the request signature matches expected value
        if (!crypto.timingSafeEqual(Buffer.from(hmac.digest('hex')), Buffer.from(hash))) {
            this.logger.warn('invalid slack request, responding with 401');
            return new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        this.logger.verbose('request validated successfully');
        next();
    }
}
