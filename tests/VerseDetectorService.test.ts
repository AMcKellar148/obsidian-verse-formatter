import { VerseDetectorService } from '../src/VerseDetectorService';

describe('VerseDetectorService', () => {
    let service: VerseDetectorService;

    beforeEach(() => {
        service = new VerseDetectorService();
    });

    test('detects simple single verses', () => {
        const text = "For God so loved the world (John 3:16) that he gave...";
        const verses = service.detectVerses(text);
        expect(verses).toHaveLength(1);
        expect(verses[0].text).toBe("John 3:16");
        expect(verses[0].originalText).toBe("John 3:16");
    });

    test('detects multiple verses', () => {
        const text = "See Romans 8:1 and also Romans 8:28.";
        const verses = service.detectVerses(text);
        expect(verses).toHaveLength(2);
        expect(verses[0].text).toBe("Romans 8:1");
        expect(verses[1].text).toBe("Romans 8:28");
    });

    test('detects lists of verses', () => {
        const text = "Read Romans 8:1, 3, 5 for comfort.";
        const verses = service.detectVerses(text);
        expect(verses).toHaveLength(1);
        expect(verses[0].text).toBe("Romans 8:1, 3, 5");
    });

    test('detects verse ranges', () => {
        const text = "Genesis 1:1-3 is the beginning.";
        const verses = service.detectVerses(text);
        expect(verses).toHaveLength(1);
        expect(verses[0].text).toBe("Genesis 1:1-3");
    });

    test('detects numbered books', () => {
        const text = "1 Corinthians 13:4 is about love. 2 John 1:6 is also good.";
        const verses = service.detectVerses(text);
        expect(verses).toHaveLength(2);
        expect(verses[0].text).toBe("1 Corinthians 13:4");
        expect(verses[1].text).toBe("2 John 1:6");
    });

    test('detects written-out verses and normalizes them', () => {
        const text = "Paul says in Ephesians chapter 5, verse 8 to walk as children of light.";
        const verses = service.detectVerses(text);
        expect(verses).toHaveLength(1);
        expect(verses[0].text).toBe("Ephesians 5.8"); // Normalized
        expect(verses[0].originalText).toContain("Ephesians chapter 5, verse 8");
    });

    test('ignores text inside existing links', () => {
        const text = "Comparison: John 3:16 vs [[John 3:16]].";
        const verses = service.detectVerses(text);
        expect(verses).toHaveLength(1);
        // Should find the first one, but not the second one inside [[]]
        expect(verses[0].start).toBe(text.indexOf("John"));
    });
});
