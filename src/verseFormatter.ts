import bibleBooksData from "./bibleAbbrs.json";
import { VerseFormatterSettings } from "./settings";

export interface BibleBook {
  name: string;
  abbr: string[];
}

export const bibleBooks: BibleBook[] = bibleBooksData;

function findBookByNameOrAbbr(input: string): BibleBook | undefined {
  const key = input.trim().toLowerCase();
  return bibleBooks.find(
    b =>
      b.name.toLowerCase() === key ||
      b.abbr.some(a => a.toLowerCase() === key)
  );
}

function getFullBookName(input: string): string {
  const found = findBookByNameOrAbbr(input);
  return found ? found.name : input;
}

function parseBookAndChapVerse(text: string): { book: string; chapVerse: string } {
  // Insert space if missing between book and number (e.g. "Colossians1" -> "Colossians 1")
  text = text.replace(/([a-zA-Z])(\d)/, "$1 $2");

  text = text.replace(/\s+/g, " ").trim();
  const tokens = text.split(" ");

  let bookTokens: string[] = [];
  let chapTokens: string[] = [];

  if (tokens.length >= 2 && /^[1-3]$/i.test(tokens[0])) {
    bookTokens.push(tokens[0], tokens[1]);
    chapTokens = tokens.slice(2);
  } else {
    const idx = tokens.findIndex(t => /^\d/.test(t));
    if (idx === -1) {
      bookTokens = tokens;
      chapTokens = [];
    } else {
      bookTokens = tokens.slice(0, idx);
      chapTokens = tokens.slice(idx);
    }
  }

  const book = bookTokens.join(" ").trim();
  let chapVerse = chapTokens.join(" ").trim();

  // Normalize "and" / "&" to "," for splitting, but keep "-" for ranges
  chapVerse = chapVerse
    .replace(/\s+(?:and|&)\s+/gi, ",")
    .replace(/\s*&\s*/g, ",")
    .replace(/\s+(?:verse|v\.?|vs\.?)\s+/gi, ":")
    .replace(/\s*[.:]\s*/g, ":")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, "");

  return { book, chapVerse };
}

function applyTemplate(template: string, data: { book: string; chapter: string; verse: string; original: string }): string {
  return template
    .replace(/{book}/g, data.book)
    .replace(/{chapter}/g, data.chapter)
    .replace(/{verse}/g, data.verse)
    .replace(/{original}/g, data.original);
}

// Helper to check if a book has only one chapter
function isSingleChapterBook(bookName: string): boolean {
  const singleChapterBooks = ["Obadiah", "Philemon", "2 John", "3 John", "Jude"];
  return singleChapterBooks.some(b => b.toLowerCase() === bookName.toLowerCase());
}

/** 1️⃣ Link single verse */
export function linkSingleVerse(text: string, settings?: VerseFormatterSettings): string {
  // Reuse the expansion logic for consistency, even for single verses
  const expanded = expandVerseList(text);
  if (expanded.length === 0) return text;

  // If it expanded to multiple (shouldn't happen for linkSingleVerse usually, but safety check)
  if (expanded.length > 1) {
    return linkVerseRange(text, settings);
  }

  const { book, chapter, verse } = expanded[0];

  if (settings?.useCustomTemplate) {
    return applyTemplate(settings.template, { book, chapter, verse: verse || "", original: text });
  }

  const target = verse ? `${book} ${chapter}.${verse}` : `${book} ${chapter}`;
  const alias = verse ? `${book} ${chapter}.${verse}` : `${book} ${chapter}`;

  // Let's stick to the standard format for consistency with the new logic
  return `[[${target}|${alias}]]`;
}


/** 2️⃣ Embed single verse — only the heading section */
export function embedSingleVerse(verse: string, settings?: VerseFormatterSettings): string {
  const formatted = linkSingleVerse(verse, settings);
  const inner = formatted.slice(2, -2);
  if (inner.includes("|")) {
    const [target, alias] = inner.split("|");
    return `![[${target}#${target}|${alias}]]`;
  } else {
    return `![[${inner}#${inner}]]`;
  }
}


/** 3️⃣ Link verse range (or list) */
export function linkVerseRange(text: string, settings?: VerseFormatterSettings): string {
  const expanded = expandVerseList(text);
  if (expanded.length === 0) return text;

  const links: string[] = [];
  for (const item of expanded) {
    const { book, chapter, verse } = item;

    if (settings?.useCustomTemplate) {
      links.push(applyTemplate(settings.template, { book, chapter, verse: verse || "", original: text }));
      continue;
    }

    const target = verse ? `${book} ${chapter}.${verse}` : `${book} ${chapter}`;
    const label = verse ? `${book} ${chapter}.${verse}` : `${book} ${chapter}`;
    links.push(`[[${target}|${label}]]`);
  }
  return links.join(", ");
}

/** 4️⃣ Embed verse range (or list) */
export function embedVerseRange(range: string, settings?: VerseFormatterSettings): string {
  const expanded = expandVerseList(range);
  if (expanded.length === 0) return range;

  const embedded = expanded.map(item => {
    const { book, chapter, verse } = item;

    // Embeds don't use custom templates usually, they use standard Obsidian embed syntax
    const target = verse ? `${book} ${chapter}.${verse}` : `${book} ${chapter}`;
    const label = verse ? `${book} ${chapter}.${verse}` : `${book} ${chapter}`;

    return `![[${target}#${target}|${label}]]`;
  });

  return embedded.join("\n");
}

// Helper to expand a verse string (ranges, lists, etc.) into individual items
function expandVerseList(text: string): { book: string; chapter: string; verse?: string }[] {
  const { book, chapVerse } = parseBookAndChapVerse(text);
  const fullBook = getFullBookName(book);
  const isSingleChap = isSingleChapterBook(fullBook);

  // Split by comma (which "and" / "&" were normalized to)
  const parts = chapVerse.split(",");

  const results: { book: string; chapter: string; verse?: string }[] = [];
  let currentChapter = "1"; // Default for single chapter books

  // Try to determine initial context from the first part
  // If first part is "8:1", context is Chapter 8.
  // If first part is "8", context depends on single chapter book.

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // Check for range (e.g. "1-3" or "8:1-3")
    const rangeMatch = part.match(/^(\d+(?::\d+)?)-(\d+(?::\d+)?)$/);
    if (rangeMatch) {
      // It's a range. Let's handle it.
      // Possible formats: "1-3", "8:1-3", "8:1-8:3" (unlikely with our normalization but possible)
      // We need to handle "1-3" using current context.

      let startStr = rangeMatch[1];
      let endStr = rangeMatch[2];

      // Parse start
      let startChap = currentChapter;
      let startVerse = "";

      if (startStr.includes(":")) {
        [startChap, startVerse] = startStr.split(":");
        currentChapter = startChap; // Update context
      } else {
        // Just a number.
        if (i === 0 && !isSingleChap) {
          // First item, just number, not single chap -> It's a chapter range start (e.g. Romans 8-10)
          startChap = startStr;
          // Treat as chapter range
        } else if (i === 0 && isSingleChap) {
          startVerse = startStr;
        } else {
          // Subsequent item.
          // If we are in "verse mode" (previous was verse), this is a verse.
          // If we are in "chapter mode", this is a chapter.
          // Heuristic: If we have a currentChapter set from a previous "X:Y" ref, treat as verse.
          // If we only saw chapters so far, treat as chapter.
          // For simplicity: If startVerse is empty, we assume it's a verse if we have a chapter context?
          // Actually, "Romans 8:1, 3-5". "3-5" -> verses 3-5 of ch 8.
          // "Romans 8, 9-10". "9-10" -> chapters 9-10.

          // Let's check if we've seen a colon in this sequence or if it's single chapter
          if (startVerse === "" && (isSingleChap || currentChapter !== "1" || parts[0].includes(":"))) {
            startVerse = startStr;
          } else {
            startChap = startStr;
          }
        }
      }

      // Parse end
      let endChap = currentChapter; // Default to start's chapter
      let endVerse = "";
      if (endStr.includes(":")) {
        [endChap, endVerse] = endStr.split(":");
      } else {
        if (startVerse !== "") {
          endVerse = endStr;
        } else {
          endChap = endStr;
        }
      }

      // Expand range
      if (startVerse !== "" && endVerse !== "") {
        // Verse Range
        const s = parseInt(startVerse);
        const e = parseInt(endVerse);
        for (let v = s; v <= e; v++) {
          results.push({ book: fullBook, chapter: startChap, verse: v.toString() });
        }
      } else {
        // Chapter Range
        const s = parseInt(startChap);
        const e = parseInt(endChap);
        for (let c = s; c <= e; c++) {
          results.push({ book: fullBook, chapter: c.toString() });
        }
      }
      continue;
    }

    // Not a range, just a single reference (e.g. "1", "8:1")
    if (part.includes(":")) {
      const [c, v] = part.split(":");
      currentChapter = c;
      results.push({ book: fullBook, chapter: c, verse: v });
    } else {
      // Just a number
      if (i === 0) {
        if (isSingleChap) {
          results.push({ book: fullBook, chapter: "1", verse: part });
        } else {
          currentChapter = part;
          results.push({ book: fullBook, chapter: part });
        }
      } else {
        // Subsequent number.
        // If previous had verse, treat as verse.
        // "Romans 8:1, 3" -> 3 is verse.
        // "Romans 8, 9" -> 9 is chapter.
        const last = results[results.length - 1];
        if (last.verse) {
          results.push({ book: fullBook, chapter: currentChapter, verse: part });
        } else {
          currentChapter = part;
          results.push({ book: fullBook, chapter: part });
        }
      }
    }
  }

  return results;
}