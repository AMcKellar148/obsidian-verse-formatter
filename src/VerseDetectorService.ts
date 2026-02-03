import { bibleBooks } from "./verseFormatter";

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
            `\\b(${this.getBookPattern()})\\s*(\\d{1,3}(?:(?:[.:]|\\s+(?:verse|v\\.?|vs\\.?)\\s+)\\d{1,3})?(?:\\s*(?:-|and|&|,)\\s*\\d{1,3})*)`,
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
            .map(b => b.replace(/\./g, "\\."))
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
                text: `${m[1]} ${m[2]}`,
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
                text: `${m[1].trim()} ${m[2]}.${m[3]}`, // normalized
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
        // 1. Detect "verse 6" type references
        for (const m of text.matchAll(this.incompleteRegex)) {
            this.processIncompleteMatch(m[0], m[1], m.index!, false, text, matches, isInsideLink);
        }

        // 2. Detect "3:10" chapter-verse patterns
        for (const m of text.matchAll(this.chapterVerseRegex)) {
            const hasChapter = true;
            this.processIncompleteMatch(m[0], m[0], m.index!, hasChapter, text, matches, isInsideLink);
        }

        // 3. Detect semicolon continuations like "; 11"
        for (const m of text.matchAll(this.delimitedRegex)) {
            // Check if this continuation was already caught by chapterVerseRegex
            const start = m.index! + (m[0].indexOf(m[1]));
            const end = start + m[1].length;
            if (matches.some(existing => existing.start === start && existing.end === end)) continue;

            const hasChapter = m[1].includes(':') || m[1].includes('.');
            this.processIncompleteMatch(m[1], m[1], start, hasChapter, text, matches, isInsideLink);
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

        // Try to find context (book and chapter)
        const context = this.findContext(text, start, matches);

        if (context) {
            let normalizedText = '';
            if (hasChapterInMatch) {
                // If match is "3:10", we just need the book from context
                normalizedText = `${context.book} ${refPart}`;
            } else {
                // If match is "6", we need book and chapter from context
                normalizedText = `${context.book} ${context.chapter}.${refPart}`;
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

        // 2. Look for the last complete verse reference before this position
        const textBefore = text.substring(0, position);

        // Find the last paragraph break
        const lastParagraph = textBefore.lastIndexOf('\n\n');
        const searchStart = lastParagraph !== -1 ? lastParagraph : 0;
        const paragraphText = textBefore.substring(searchStart);

        // Look for complete references in the same paragraph
        const completeRefs = existingMatches.filter(
            m => !m.needsContext && m.start >= searchStart && m.start < position
        );

        if (completeRefs.length > 0) {
            // Use the most recent complete reference
            const lastRef = completeRefs[completeRefs.length - 1];
            return this.extractBookChapter(lastRef.text);
        }

        // 3. If no paragraph context, look in the entire document before this point
        const allCompleteRefs = existingMatches.filter(
            m => !m.needsContext && m.start < position
        );

        if (allCompleteRefs.length > 0) {
            const lastRef = allCompleteRefs[allCompleteRefs.length - 1];
            return this.extractBookChapter(lastRef.text);
        }

        return null;
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
