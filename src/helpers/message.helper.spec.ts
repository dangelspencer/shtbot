import { MessageHelper } from './message.helper';

describe('TextHelper', () => {
    const messageHelper = new MessageHelper();

    describe('parseMentions', () => {
        it('parses mention details from text', () => {
            const text = '<@US7BDEPQQ|testuser> I chose the purple one';
            
            const mentions = messageHelper.parseMentions(text);
            expect(Array.isArray(mentions)).toBeTruthy();

            expect(mentions[0].id).toBe('US7BDEPQQ');
            expect(mentions[0].type).toBe('@');
            expect(mentions[0].username).toBe('testuser');
        });

        it('parses multiple mentions from text', () => {
            const text = '<@US7BDEPQQ|testuser> <@US7BDEPQR|testuser2> chose the purple one';
            
            const mentions = messageHelper.parseMentions(text);
            expect(Array.isArray(mentions)).toBeTruthy();

            expect(mentions[0].id).toBe('US7BDEPQQ');
            expect(mentions[0].type).toBe('@');
            expect(mentions[0].username).toBe('testuser');

            expect(mentions[1].id).toBe('US7BDEPQR');
            expect(mentions[1].type).toBe('@');
            expect(mentions[1].username).toBe('testuser2');
        });

        it('returns empty array when no mentions are found', () => {
            const text = 'I chose the purple one';
            
            const mentions = messageHelper.parseMentions(text);
            expect(Array.isArray(mentions)).toBeTruthy();
            expect(mentions.length).toBe(0);
        });
    });
});