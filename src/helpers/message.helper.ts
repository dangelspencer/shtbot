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
                    id: data[0].replace('@', ''),
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
}