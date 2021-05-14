import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './logger.service';
import { config } from './config';
import * as bodyParser from 'body-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: new LoggerService(),
        bodyParser: false
    });

    const rawBodyBuffer = (req, res, buf, encoding) => {
        if (buf && buf.length) {
            req.rawBody = buf.toString(encoding || 'utf8');
        }
    }
    app.use(bodyParser.urlencoded({verify: rawBodyBuffer, extended: true }));
    app.use(bodyParser.json({ verify: rawBodyBuffer }));

    app.enableCors();

    await app.listen(config.server.port, config.server.host);
}

bootstrap();
