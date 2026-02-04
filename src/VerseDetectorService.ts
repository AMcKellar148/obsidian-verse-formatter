import { bibleBooks, getFullBookName } from "./verseFormatter";

export interface DetectedVerse {
    text: string;
    originalText: string;
    start: number;
    end: number;
    needsContext?: boolean; // True if this is an incomplete reference like "verse 6"
    inferredContext?: string; // The inferred book and chapter (e.g., "Romans 8")
    isAlreadyFormatted?: boolean; // True if this was found inside an existing link
}

export class VerseDetectorService {
    private numericRegex: RegExp;
    private writtenRegex: RegExp;
    private incompleteRegex: RegExp;
    private chapterVerseRegex: RegExp;
    private delimitedRegex: RegExp;
    private manualContext: { book: string; chapter: string } | null = null;

    constructor() {
        this.numericRegex = new RegExp(
            `\\b(${this.getBookPattern()})\\.?\\s*(\\d{1,3}(?:(?:[.:]|\\s+(?:verse|v\\.?|vs\\.?)\\s+)\\d{1,3})?(?:\\s*(?:-|and|&|,)\\s*\\d{1,3})*)`,
            "gi"
        );

        this.writtenRegex = /\b((?:[1-3]|I{1,3})?\s?[A-Za-z.]+(?:\s(?:of|the)\s[A-Za-z]+)?)\s+(?:chapter|chap\.?|ch\.?)\s*(\d{1,3})\s*,?\s*(?:verse|v\.?|vs\.?|v)\s*(\d{1,3})\.?/gi;

        // Detect incomplete references like "verse 6", "in verse 12", etc.
        this.incompleteRegex = /\b(?:in\s+)?(?:verse|v\.?|vs\.?)\s+(\d{1,3})\b/gi;

        // Detect semicolon-style continuations like "; 10", "; 3:10", "; 4:5-6"
        // Also detects chapter:verse patterns that appear standalone (e.g. "3:10")
        this.chapterVerseRegex = /\b(\d{1,3})[:\.](\d{1,3}(?:(?:\s*(?:-|and|&|,)\s*)\d{1,3})*)\b/gi;
        this.delimitedRegex = /;\s*(\d{1,3}(?:[:\.]\d{1,3})?(?:(?:\s*(?:-|and|&|,)\s*)\d{1,3})*)\b/gi;
    }

    setManualContext(book: string, chapter: string) {
        this.manualContext = { book, chapter };
    }

    clearManualContext() {
        this.manualContext = null;
    }

    getManualContext() {
        return this.manualContext;
    }

    private getBookPattern(): string {
        return bibleBooks
            .flatMap(b => [b.name, ...b.abbr])
            .map(b => b.replace(/\./g, "")) // Remove periods from source to handle them optionally below
            .join("|");
    }

    detectVerses(text: string): DetectedVerse[] {
        const matches: DetectedVerse[] = [];

        // 1. Identify ranges that are already inside [[links]] or ![[embeds]]
        const linkRanges: { start: number; end: number }[] = [];
        const linkRegex = /!?\[\[.*?\]\]/g;
        let linkMatch;
        while ((linkMatch = linkRegex.exec(text)) !== null) {
            linkRanges.push({
                start: linkMatch.index,
                end: linkMatch.index + linkMatch[0].length,
            });
        }

        // Helper to check if a range overlaps with any existing link
        const isInsideLink = (start: number, end: number) => {
            return linkRanges.some((range) => start >= range.start && end <= range.end);
        };

        // Numeric verses
        for (const m of text.matchAll(this.numericRegex)) {
            const fullMatch = m[0];
            const start = m.index!;
            const end = start + fullMatch.length;
            const isInside = isInsideLink(start, end);
            matches.push({
                text: `${getFullBookName(m[1])} ${m[2]}`,
                originalText: fullMatch,
                start,
                end,
                isAlreadyFormatted: isInside
            });
        }

        // Written-out verses
        for (const m of text.matchAll(this.writtenRegex)) {
            const fullMatch = m[0];
            const start = m.index!;
            const end = start + fullMatch.length;
            const isInside = isInsideLink(start, end);
            matches.push({
                text: `${getFullBookName(m[1].trim())} ${m[2]}:${m[3]}`, // normalized with :
                originalText: fullMatch, // actual written-out text
                start,
                end,
                isAlreadyFormatted: isInside
            });
        }

        // Detect incomplete references ("verse 6") and try to infer context
        this.detectIncompleteReferences(text, matches, isInsideLink);

        // Keep order of appearance
        matches.sort((a, b) => a.start - b.start);

        // Filter out already formatted verses for the sidebar, but keep them for context during detection
        return matches.filter(m => !m.isAlreadyFormatted);
    }

    private detectIncompleteReferences(
        text: string,
        matches: DetectedVerse[],
        isInsideLink: (start: number, end: number) => boolean
    ) {
        const allIncompleteMatches: { fullMatch: string, refPart: string, start: number, hasChapter: boolean }[] = [];

        // 1. Collect "verse 6" type references
        for (const m of text.matchAll(this.incompleteRegex)) {
            allIncompleteMatches.push({
                fullMatch: m[0],
                refPart: m[1],
                start: m.index!,
                hasChapter: false
            });
        }

        // 2. Collect "3:10" chapter-verse patterns
        for (const m of text.matchAll(this.chapterVerseRegex)) {
            allIncompleteMatches.push({
                fullMatch: m[0],
                refPart: m[0],
                start: m.index!,
                hasChapter: true
            });
        }

        // 3. Collect semicolon continuations like "; 11"
        for (const m of text.matchAll(this.delimitedRegex)) {
            const start = m.index! + (m[0].indexOf(m[1]));
            allIncompleteMatches.push({
                fullMatch: m[1],
                refPart: m[1],
                start: start,
                hasChapter: m[1].includes(':') || m[1].includes('.')
            });
        }

        // Sort by position and process in order so context can flow from one to the next
        allIncompleteMatches.sort((a, b) => a.start - b.start);

        for (const m of allIncompleteMatches) {
            this.processIncompleteMatch(m.fullMatch, m.refPart, m.start, m.hasChapter, text, matches, isInsideLink);
        }
    }

    private processIncompleteMatch(
        fullMatch: string,
        refPart: string,
        start: number,
        hasChapterInMatch: boolean,
        text: string,
        matches: DetectedVerse[],
        isInsideLink: (start: number, end: number) => boolean
    ) {
        const end = start + fullMatch.length;
        if (isInsideLink(start, end)) return;

        // Check for overlap with existing matches to prevent duplicates (e.g., "1:1" inside "Genesis 1:1")
        const isOverlap = matches.some(m =>
            (start >= m.start && start < m.end) ||
            (end > m.start && end <= m.end) ||
            (m.start >= start && m.start < end)
        );
        if (isOverlap) return;

        // Try to find context (book and chapter)
        const context = this.findContext(text, start, matches);

        if (context) {
            let normalizedText = '';
            if (hasChapterInMatch) {
                // If match is "3:10", we just need the book from context
                normalizedText = `${context.book} ${refPart}`;
            } else {
                // If match is "6", we need book and chapter from context
                normalizedText = `${context.book} ${context.chapter}:${refPart}`;
            }

            matches.push({
                text: normalizedText,
                originalText: fullMatch,
                start,
                end,
                needsContext: true,
                inferredContext: hasChapterInMatch ? context.book : `${context.book} ${context.chapter}`,
                isAlreadyFormatted: false
            });
        } else if (!hasChapterInMatch || fullMatch.toLowerCase().startsWith('verse')) {
            // Still add it if it's explicitly labeled "verse" so the user sees it needs context
            matches.push({
                text: fullMatch,
                originalText: fullMatch,
                start,
                end,
                needsContext: true,
                inferredContext: undefined,
                isAlreadyFormatted: false
            });
        }
    }

    private findContext(
        text: string,
        position: number,
        existingMatches: DetectedVerse[]
    ): { book: string; chapter: string } | null {
        // 1. Check if manual context is set
        if (this.manualContext) {
            return this.manualContext;
        }

        // Helper to find the last valid context in a list of references
        const findLastRefContext = (refs: DetectedVerse[]) => {
            // We need the last one before the position
            const filtered = refs.filter(m => m.start < position);
            if (filtered.length === 0) return null;

            // Sort by start position just in case
            filtered.sort((a, b) => a.start - b.start);

            for (let i = filtered.length - 1; i >= 0; i--) {
                const m = filtered[i];
                // A reference is valid context if it has a book/chapter
                const ctx = this.extractBookChapter(m.text);
                if (ctx) return ctx;
            }
            return null;
        };

        // 2. Look in the same paragraph
        const textBefore = text.substring(0, position);
        const searchStart = textBefore.lastIndexOf('\n\n') !== -1 ? textBefore.lastIndexOf('\n\n') : 0;
        const paragraphRefs = existingMatches.filter(m => m.start >= searchStart);
        const paragraphCtx = findLastRefContext(paragraphRefs);
        if (paragraphCtx) return paragraphCtx;

        // 3. Look in the entire document before this point
        return findLastRefContext(existingMatches);
    }

    private extractBookChapter(verseText: string): { book: string; chapter: string } | null {
        // Parse "Romans 8.1" or "Romans 8" to extract book and chapter
        const match = verseText.match(/^(.+?)\s+(\d+)(?:\.|:)?/);
        if (match) {
            return {
                book: match[1].trim(),
                chapter: match[2]
            };
        }
        return null;
    }
}
