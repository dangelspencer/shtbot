class TextConverterHelper {
    static async textToScrabbleTiles(text) {
        let result = '';
        let numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

        for (let i = 0; i < text.length; i++) {
            let char = text.charAt(i).toLowerCase();


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
            if (!char.match(/[a-z]/i)) {
                continue;
            }

            // handle letters
            char = ['a', 'b', 'm', 'o', 'v', 'x'].includes(char) ? char+char : char;
            result += (`:${char}:`);
        }

        return result.trim();
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
}

module.exports = TextConverterHelper;
