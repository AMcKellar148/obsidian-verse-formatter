import { linkSingleVerse, linkVerseRange } from '../src/verseFormatter';

describe('verseFormatter', () => {

    describe('linkSingleVerse', () => {
        test('links a simple verse', () => {
            expect(linkSingleVerse('John 3:16')).toBe('[[John 3.16|John 3.16]]');
        });

        test('preserves original text as alias', () => {
            expect(linkSingleVerse('John 3.16', undefined, 'John 3:16')).toBe('[[John 3.16|John 3:16]]');
        });

        test('handles numbered books', () => {
            expect(linkSingleVerse('1 John 1:9')).toBe('[[1 John 1.9|1 John 1.9]]');
        });
    });

    describe('linkVerseRange', () => {
        test('expands ranges', () => {
            // Assuming expansion logic: "John 3:16-17" -> "[[John 3.16|John 3.16]], [[John 3.17|John 3.17]]"
            // or similar based on existing implementation which produces a list of links
            const result = linkVerseRange('John 3:16-17');
            expect(result).toContain('[[John 3.16|John 3.16]]');
            expect(result).toContain('[[John 3.17|John 3.17]]');
        });

        test('expands lists', () => {
            const result = linkVerseRange('Romans 8:1, 3');
            expect(result).toContain('[[Romans 8.1|Romans 8.1]]');
            expect(result).toContain('[[Romans 8.3|Romans 8.3]]');
        });
    });
});
