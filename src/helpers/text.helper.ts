import { Injectable } from '@nestjs/common';

@Injectable()
export class TextHelper {
    textToScrabbleTiles(text: string): string {
        const convertedWords = [];
        const numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

        const words = text.split(' ');
        for (const word of words) {
            let result = '';

            if (word.startsWith('<@') || word.startsWith('<#')) {
                convertedWords.push(word);
                continue;
            } else if (word.startsWith(':') && word.endsWith(':')) {
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

    textToMockingText(text: string): string {
        const convertedWords = [];
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

    scrabbleTilesToText(text: string): string {
        const parts = text.split(':').filter(x => x !== '');

        let result = '';
        for (const part of parts) {
            if (['aa', 'bb', 'mm', 'oo', 'vv', 'xx'].includes(part)) {
                result += part.substr(0,1);
            } else if (['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'].includes(part)) {
                result += ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'].indexOf(part);
            } else {
                result += part;
            }
        }

        return result;
    }
}
