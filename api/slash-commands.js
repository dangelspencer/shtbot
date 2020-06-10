module.exports = [
    {
        method: 'POST',
        path: '/slash-commands/scrabble',
        handler: async (request) => {
            const textToConvert = request.payload.text;

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

            return {
                response_type: 'in_channel',
                text: result
            };
        }
    }
];
