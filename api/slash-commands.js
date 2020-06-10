const axios = require('axios');

module.exports = [
    {
        method: 'POST',
        path: '/slash-commands/scrabble',
        handler: async (request) => {
            const textToConvert = request.payload.text;
            const responseURL = request.payload.response_url;

            let result = '';
            let skip = ['.', ',', '\'', '?', '-'];
            for (let i = 0; i < textToConvert.length; i++) {
                let char = textToConvert.charAt(i).toLowerCase();
                if (skip.includes(char)) {
                    continue;
                }
                char = ['a', 'b', 'm', 'o', 'v', 'x'].includes(char) ? char+char : char;
                if (char === ' ') {
                    char = 'blank';
                }
                if (char === '3') {
                    char = 'three';
                }
                if (char === '0') {
                    char = 'zero';
                }
                result += (` :${char}:`);
            }

            axios.post(responseURL, {
                response_type: 'in_channel',
                text: result
            });

            return '';
        }
    }
];
