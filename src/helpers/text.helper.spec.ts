import { text } from 'express';
import { TextHelper } from './text.helper';

describe('TextHelper', () => {
    const textHelper = new TextHelper();

    describe('textToScrabbleTiles', () => {
        it('converts "test" correctly', () => {
            expect(textHelper.textToScrabbleTiles('test')).toBe(':t::e::s::t:');
        });
        it('converts "test with space" correctly', () => {
            expect(textHelper.textToScrabbleTiles('test with space')).toBe(':t::e::s::t:   :w::i::t::h:   :s::p::aa::c::e:');
        });
        it('doesn\'t convert user tags', () => {
            expect(textHelper.textToScrabbleTiles('<@U5ATQMQUW|testuser> test with space')).toBe('<@U5ATQMQUW|testuser>   :t::e::s::t:   :w::i::t::h:   :s::p::aa::c::e:');
        });
        it('doesn\'t convert channel tags', () => {
            expect(textHelper.textToScrabbleTiles('<#U5ATQMQUW|testchannel> test with space')).toBe('<#U5ATQMQUW|testchannel>   :t::e::s::t:   :w::i::t::h:   :s::p::aa::c::e:');
        });
    });

    describe('textToMockingText', () => {
        it('converts "test" correctly', () => {
            expect(textHelper.textToMockingText('test')).toBe('tEsT');
        });
        it('converts "test with space" correctly', () => {
            expect(textHelper.textToMockingText('test with space')).toBe('tEsT wItH sPaCe');
        });
        it('doesn\'t convert user tags', () => {
            expect(textHelper.textToMockingText('<@U5ATQMQUW|testuser> test with space')).toBe('<@U5ATQMQUW|testuser> tEsT wItH sPaCe');
        });
        it('doesn\'t convert channel tags', () => {
            expect(textHelper.textToMockingText('<#U5ATQMQUW|testchannel> test with space')).toBe('<#U5ATQMQUW|testchannel> tEsT wItH sPaCe');
        });
    });

    describe('scrabbleTilesToText', () => {
        it('converts "scrable" correctly', () => {
            expect(textHelper.scrabbleTilesToText(':s::c::r::aa::bb::bb::l::e:')).toBe('scrabble');
        });
        it('converts "test" correctly', () => {
            expect(textHelper.scrabbleTilesToText(':t::e::s::t:')).toBe('test');
        });
        it('converts "test with space" correctly', () => {
            expect(textHelper.scrabbleTilesToText(':t::e::s::t: :w::i::t::h: :s::p::aa::c::e:')).toBe('test with space');
        });
        it('doesn\'t convert user tags', () => {
            expect(textHelper.scrabbleTilesToText('<@U5ATQMQUW|testuser> :t::e::s::t: :w::i::t::h: :s::p::aa::c::e:')).toBe('<@U5ATQMQUW|testuser> test with space');
        });
        it('doesn\'t convert channel tags', () => {
            expect(textHelper.scrabbleTilesToText('<#U5ATQMQUW|testchannel> :t::e::s::t: :w::i::t::h: :s::p::aa::c::e:')).toBe('<#U5ATQMQUW|testchannel> test with space');
        });
    });
});
