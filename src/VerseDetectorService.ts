import { bibleBooks } from "./verseFormatter";

export interface DetectedVerse {
    text: string;
    originalText: string;
    start: number;
    end: number;
    needsContext?: boolean; // True if this is an incomplete reference like "verse 6"
    inferredContext?: string; // The inferred book and chapter (e.g., "Romans 8")
}

export class VerseDetectorService {
    private numericRegex: RegExp;
    private writtenRegex: RegExp;
    private incompleteRegex: RegExp;
    private manualContext: { book: string; chapter: string } | null = null;

    constructor() {
        this.numericRegex = new RegExp(
            `\\b(${this.getBookPattern()})\\s*(\\d{1,3}(?:(?:[.:]|\\s+(?:verse|v\\.?|vs\\.?)\\s+)\\d{1,3})?(?:\\s*(?:-|and|&|,)\\s*\\d{1,3})*)`,
            "gi"
        );

        this.writtenRegex = /\b((?:[1-3]|I{1,3})?\s?[A-Za-z.]+(?:\s(?:of|the)\s[A-Za-z]+)?)\s+(?:chapter|chap\.?|ch\.?)\s*(\d{1,3})\s*,?\s*(?:verse|v\.?|vs\.?|v)\s*(\d{1,3})\.?/gi;

        // Detect incomplete references like "verse 6", "in verse 12", etc.
        this.incompleteRegex = /\b(?:in\s+)?(?:verse|v\.?|vs\.?)\s+(\d{1,3})\b/gi;
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

            if (!isInsideLink(start, end)) {
                matches.push({
                    text: `${m[1]} ${m[2]}`,
                    originalText: fullMatch,
                    start,
                    end,
                });
            }
        }

        // Written-out verses
        for (const m of text.matchAll(this.writtenRegex)) {
            const fullMatch = m[0];
            const start = m.index!;
            const end = start + fullMatch.length;

            if (!isInsideLink(start, end)) {
                matches.push({
                    text: `${m[1].trim()} ${m[2]}.${m[3]}`, // normalized
                    originalText: fullMatch, // actual written-out text
                    start,
                    end,
                });
            }
        }

        // Detect incomplete references ("verse 6") and try to infer context
        this.detectIncompleteReferences(text, matches, isInsideLink);

        // Keep order of appearance
        matches.sort((a, b) => a.start - b.start);
        return matches;
    }

    private detectIncompleteReferences(
        text: string,
        matches: DetectedVerse[],
        isInsideLink: (start: number, end: number) => boolean
    ) {
        for (const m of text.matchAll(this.incompleteRegex)) {
            const fullMatch = m[0];
            const verseNum = m[1];
            const start = m.index!;
            const end = start + fullMatch.length;

            if (isInsideLink(start, end)) continue;

            // Try to find context
            const context = this.findContext(text, start, matches);

            if (context) {
                matches.push({
                    text: `${context.book} ${context.chapter}.${verseNum}`,
                    originalText: fullMatch,
                    start,
                    end,
                    needsContext: true,
                    inferredContext: `${context.book} ${context.chapter}`
                });
            } else {
                // No context found - still add it but mark as needing context
                matches.push({
                    text: `verse ${verseNum}`,
                    originalText: fullMatch,
                    start,
                    end,
                    needsContext: true,
                    inferredContext: undefined
                });
            }
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
