class MessageParserHelper {
    // returns an array of escaped mentions
    static async parseMentions(text) {
        const matches = text.match(/(?<=\<).+?(?=\>)/g);
        if (matches != null) {
            return matches.map(mention => {
                const data = mention.split('|');
                const details = {
                    type: data[0].substr(0, 1),
                    id: data[0].replace('@', '')
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

module.exports = MessageParserHelper;
