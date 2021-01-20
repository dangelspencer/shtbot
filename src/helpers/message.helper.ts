import { Injectable } from '@nestjs/common';

@Injectable()
export class MessageHelper {
    parseMentions(message: string) {
        const matches = message.match(/(?<=\<).+?(?=\>)/g);
        if (matches != null) {
            return matches.map(mention => {
                const data = mention.split('|');
                const details = {
                    type: data[0].substr(0, 1),
                    id: data[0].replace('@', '').replace('#', ''),
                    username: null
                };
    
                if (data.length > 1) {
                    details.username = data[1];
                }
    
                return details;
            });
        }

        return [];
    }

    buildImageBlock(title, url, altText = title) {
        return {
			type: 'image',
			title: {
				type: 'plain_text',
				text: title,
				emoji: true
			},
			image_url: url,
			alt_text: altText
		}
    }

    buildMarkdownBlock(text) {
        return {
			type: 'section',
			text: {
				type: "mrkdwn",
				text: text
			}
		}
    }

    buildTextBlock(text) {
        return {
			type: 'section',
			text: {
				type: "plain_text",
				text: text,
				emoji: true
			}
		}
    }
}