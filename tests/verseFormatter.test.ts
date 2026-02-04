import { linkSingleVerse, linkVerseRange } from '../src/verseFormatter';

describe('verseFormatter', () => {

    describe('linkSingleVerse', () => {
        test('links a simple verse with full names by default', () => {
            expect(linkSingleVerse('John 3:16')).toBe('[[John 3.16|John 3.16]]');
        });

        test('normalizes canonical book names in target', () => {
            expect(linkSingleVerse('Gen 1:1')).toBe('[[Genesis 1.1|Genesis 1.1]]');
            expect(linkSingleVerse('Gen. 1:1')).toBe('[[Genesis 1.1|Genesis 1.1]]');
        });

        test('uses SBL primary style with colon', () => {
            const settings = { abbreviationStyle: 'sblPrimary' } as any;
            expect(linkSingleVerse('John 3:16', settings)).toBe('[[John 3.16|John 3:16]]');
        });

        test('uses SBL secondary style with colon', () => {
            const settings = { abbreviationStyle: 'sblSecondary' } as any;
            expect(linkSingleVerse('John 3:16', settings)).toBe('[[John 3.16|Jn 3:16]]');
        });

        test('preserves "chapter" references as alias', () => {
            expect(linkSingleVerse('Ephesians 5:8', undefined, 'Ephesians chapter 5, verse 8'))
                .toBe('[[Ephesians 5.8|Ephesians chapter 5, verse 8]]');
        });

        test('preserves inferred references when setting is enabled', () => {
            const settings = { aliasInferredVerses: true } as any;
            // "verse 6" does not contain "Rom", so it should be preserved
            expect(linkSingleVerse('Romans 8:6', settings, 'verse 6'))
                .toBe('[[Romans 8.6|verse 6]]');
        });

        test('does NOT preserve inferred references when setting is disabled', () => {
            const settings = { aliasInferredVerses: false } as any;
            expect(linkSingleVerse('Romans 8:6', settings, 'verse 6'))
                .toBe('[[Romans 8.6|Romans 8.6]]');
        });

        test('uses custom template', () => {
            const settings = {
                useCustomTemplate: true,
                template: "Reference: {book} {chapter}:{verse}"
            } as any;
            expect(linkSingleVerse('John 3:16', settings)).toBe('Reference: John 3:16');
        });
    });

    describe('linkVerseRange', () => {
        test('expands ranges with canonical names', () => {
            const result = linkVerseRange('Gen 1:1-2');
            expect(result).toBe('[[Genesis 1.1|Genesis 1.1]], [[Genesis 1.2|Genesis 1.2]]');
        });

        test('handles lists with SBL primary style', () => {
            const settings = { abbreviationStyle: 'sblPrimary' } as any;
            const result = linkVerseRange('Rom 8:1, 3', settings);
            expect(result).toBe('[[Romans 8.1|Rom 8:1]], [[Romans 8.3|Rom 8:3]]');
        });
    });
});
