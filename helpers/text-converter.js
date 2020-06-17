class TextConverterHelper {
    static async textToScrabbleTiles(text) {
        let convertedWords = [];
        let numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

        const words = text.split(' ');
        for (const word of words) {
            let result = '';

            if (word.startsWith('<@') || word.startsWith('<#')) {
                convertedWords.push(word);
                continue;
            }

            for (let i = 0; i < word.length; i++) {
                let char = word.charAt(i).toLowerCase();
    
    
                // handle numbers
                if (!isNaN(parseInt(char, 10))) {
                    result += `:${numbers[parseInt(char, 10)]}:`;
                    continue;
                }
    
                // handle spaces
                if (char === ' ') {
                    result += '   ';
                    continue;
                }
    
                // filter out punctuation
                if (!char.match(/[a-zA-Z]/i)) {
                    continue;
                }
    
                // handle letters
                char = ['a', 'b', 'm', 'o', 'v', 'x'].includes(char) ? char+char : char;
                result += (`:${char}:`);
            }

            convertedWords.push(result);
        }

        return convertedWords.join('   ');
    }

    static async textToMockingText(text) {
        let result = '';
        let nonLetterCount = 0; //used to ignore non letters when alternating upper and lower case
        for (let i = 0; i < text.length; i++) {
            let char = ((i-nonLetterCount) % 2) ? text.charAt(i).toUpperCase() : text.charAt(i).toLowerCase();
            result += char;

            if (char.toLowerCase() === char.toUpperCase()) {
                nonLetterCount++;
            }
        }

        return result;
    }
    
    static async textToMockingText(text) {
        let convertedWords = [];
        let uppercase = false;

        const words = text.split(' ');

        for (const word of words) {
            let result = '';

            if (word.startsWith('<@') || word.startsWith('<#')) {
                convertedWords.push(word);
                continue;
            }

            for (let i = 0; i < word.length; i++) {
                // filter out punctuation
                if (!word.charAt(i).match(/[a-zA-Z0-9]/i)) {
                    continue;
                }

                if (uppercase) {
                    result += word.charAt(i).toUpperCase();
                    uppercase = !uppercase;
                } else {
                    result += word.charAt(i).toLowerCase();
                    uppercase = !uppercase;
                }
            }

            convertedWords.push(result);
        }

        return convertedWords.join(' ');
    }
}

module.exports = TextConverterHelper;
