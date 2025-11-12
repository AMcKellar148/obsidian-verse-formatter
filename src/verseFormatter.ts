// verseFormatter.ts
import bibleBooksData from "./bibleAbbrs.json";

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

  chapVerse = chapVerse
    .replace(/\s*[.:]\s*/g, ":")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, "");

  return { book, chapVerse };
}

/** 1️⃣ Link single verse */
export function linkSingleVerse(text: string): string {
  // 1️⃣ Check for written-out verses
  const writtenVerseRegex = /\b((?:[1-3]|I{1,3})?\s?[A-Za-z.]+(?:\s(?:of|the)\s[A-Za-z]+)?)\s+(?:chapter|chap\.?|ch\.?)\s*(\d{1,3})\s*,?\s*(?:verse|v\.?|vs\.?|v)\s*(\d{1,3})/i;
  const match = text.match(writtenVerseRegex);

  if (match) {
    const book = match[1];
    const chapter = match[2];
    const verse = match[3];
    const target = `${book} ${chapter}.${verse}`;
    return `[[${target}|${text}]]`; // alias is the original text
  }

  // 2️⃣ Fallback to numeric style
  const { book: bookName, chapVerse } = parseBookAndChapVerse(text);
  const fullBook = getFullBookName(bookName);
  const useAlias = bookName.trim().toLowerCase() !== fullBook.toLowerCase();

  const numericMatch = chapVerse.match(/^(\d+):(\d+)$/);
  if (!numericMatch) return text;

  const [, chapterNum, verseNum] = numericMatch;
  const target = `${fullBook} ${chapterNum}.${verseNum}`;
  return useAlias
    ? `[[${target}|${bookName} ${chapterNum}.${verseNum}]]`
    : `[[${target}]]`;
}


/** 2️⃣ Embed single verse — only the heading section */
export function embedSingleVerse(verse: string): string {
  // Get the formatted verse from your existing function
  const formatted = linkSingleVerse(verse); // e.g., [[Romans 1.1]] or [[Romans 1.1|Ro 1.1]]

  // Remove the outer [[ ]] brackets
  const inner = formatted.slice(2, -2);

  // Check if there is an alias (contains |)
  if (inner.includes("|")) {
    const [target, alias] = inner.split("|");
    return `![[${target}#${target}|${alias}]]`;
  } else {
    return `![[${inner}#${inner}]]`;
  }
}


/** 3️⃣ Link verse range */
export function linkVerseRange(text: string): string {
  const { book, chapVerse } = parseBookAndChapVerse(text);
  const fullBook = getFullBookName(book);
  const useAlias = book.trim().toLowerCase() !== fullBook.toLowerCase();

  const match = chapVerse.match(/^(\d+):(\d+)-(\d+)$/);
  if (!match) return text;

  const [, chapter, startVerse, endVerse] = match;
  const start = parseInt(startVerse, 10);
  const end = parseInt(endVerse, 10);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return text;

  const links: string[] = [];
  for (let v = start; v <= end; v++) {
    const verseStr = v.toString();
    const target = `${fullBook} ${chapter}.${verseStr}`;
    links.push(
      useAlias
        ? `[[${target}|${book} ${chapter}.${verseStr}]]`
        : `[[${target}]]`
    );
  }
  return links.join(", ");
}

/** 4️⃣ Embed verse range — each one to its own heading */
export function embedVerseRange(range: string): string {
  const verses = splitVerseRange(range);
  const embedded = verses.map((v) => {
    const formatted = linkSingleVerse(v);
    const inner = formatted.slice(2, -2);

    // Handle alias and target
    if (inner.includes("|")) {
      const [target, alias] = inner.split("|");
      return `![[${target}#${target}|${alias}]]`;
    } else {
      return `![[${inner}#${inner}]]`;
    }
  });

  return embedded.join("\n"); // each embedded verse on its own line
}

// Helper to split verse range into individual verses
function splitVerseRange(range: string): string[] {
  const normalized = range.replace(/\s*-\s*/, "-").replace(/\./g, ":");
  const match = normalized.match(/^(.+?)\s(\d+):(\d+)-(\d+)$/);
  if (!match) return [range]; // fallback if not valid range

  const [, book, chapterStr, startVerseStr, endVerseStr] = match;
  const chapter = parseInt(chapterStr);
  const startVerse = parseInt(startVerseStr);
  const endVerse = parseInt(endVerseStr);

  const verses: string[] = [];
  for (let v = startVerse; v <= endVerse; v++) {
    verses.push(`${book} ${chapter}:${v}`);
  }

  return verses;
}