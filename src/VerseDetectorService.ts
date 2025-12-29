import { bibleBooks } from "./verseFormatter";

export interface DetectedVerse {
    text: string;
    originalText: string;
    start: number;
    end: number;
}

export class VerseDetectorService {
    private numericRegex: RegExp;
    private writtenRegex: RegExp;

    constructor() {
        this.numericRegex = new RegExp(
            `\\b(${this.getBookPattern()})\\s*(\\d{1,3}(?:(?:[.:]|\\s+(?:verse|v\\.?|vs\\.?)\\s+)\\d{1,3})?(?:\\s*(?:-|and|&|,)\\s*\\d{1,3})*)`,
            "gi"
        );

        this.writtenRegex = /\b((?:[1-3]|I{1,3})?\s?[A-Za-z.]+(?:\s(?:of|the)\s[A-Za-z]+)?)\s+(?:chapter|chap\.?|ch\.?)\s*(\d{1,3})\s*,?\s*(?:verse|v\.?|vs\.?|v)\s*(\d{1,3})\.?/gi;
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

        // Keep order of appearance
        matches.sort((a, b) => a.start - b.start);
        return matches;
    }
}
