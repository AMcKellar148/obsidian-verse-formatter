// SBL (Society of Biblical Literature) abbreviations for Bible books
// Based on the SBL Handbook of Style, 2nd edition

export interface BookAbbreviations {
    full: string;
    sblPrimary: string;
    sblSecondary: string;
}

export const sblAbbreviations: { [key: string]: BookAbbreviations } = {
    // Old Testament
    "Genesis": { full: "Genesis", sblPrimary: "Gen", sblSecondary: "Gn" },
    "Exodus": { full: "Exodus", sblPrimary: "Exod", sblSecondary: "Ex" },
    "Leviticus": { full: "Leviticus", sblPrimary: "Lev", sblSecondary: "Lv" },
    "Numbers": { full: "Numbers", sblPrimary: "Num", sblSecondary: "Nm" },
    "Deuteronomy": { full: "Deuteronomy", sblPrimary: "Deut", sblSecondary: "Dt" },
    "Joshua": { full: "Joshua", sblPrimary: "Josh", sblSecondary: "Jos" },
    "Judges": { full: "Judges", sblPrimary: "Judg", sblSecondary: "Jgs" },
    "Ruth": { full: "Ruth", sblPrimary: "Ruth", sblSecondary: "Ru" },
    "1 Samuel": { full: "1 Samuel", sblPrimary: "1 Sam", sblSecondary: "1 Sm" },
    "2 Samuel": { full: "2 Samuel", sblPrimary: "2 Sam", sblSecondary: "2 Sm" },
    "1 Kings": { full: "1 Kings", sblPrimary: "1 Kgs", sblSecondary: "1 Kgs" },
    "2 Kings": { full: "2 Kings", sblPrimary: "2 Kgs", sblSecondary: "2 Kgs" },
    "1 Chronicles": { full: "1 Chronicles", sblPrimary: "1 Chr", sblSecondary: "1 Chr" },
    "2 Chronicles": { full: "2 Chronicles", sblPrimary: "2 Chr", sblSecondary: "2 Chr" },
    "Ezra": { full: "Ezra", sblPrimary: "Ezra", sblSecondary: "Ezr" },
    "Nehemiah": { full: "Nehemiah", sblPrimary: "Neh", sblSecondary: "Neh" },
    "Esther": { full: "Esther", sblPrimary: "Esth", sblSecondary: "Est" },
    "Job": { full: "Job", sblPrimary: "Job", sblSecondary: "Jb" },
    "Psalms": { full: "Psalms", sblPrimary: "Ps", sblSecondary: "Ps" },
    "Psalm": { full: "Psalm", sblPrimary: "Ps", sblSecondary: "Ps" },
    "Proverbs": { full: "Proverbs", sblPrimary: "Prov", sblSecondary: "Prv" },
    "Ecclesiastes": { full: "Ecclesiastes", sblPrimary: "Eccl", sblSecondary: "Eccl" },
    "Song of Solomon": { full: "Song of Solomon", sblPrimary: "Song", sblSecondary: "Sg" },
    "Song of Songs": { full: "Song of Songs", sblPrimary: "Song", sblSecondary: "Sg" },
    "Isaiah": { full: "Isaiah", sblPrimary: "Isa", sblSecondary: "Is" },
    "Jeremiah": { full: "Jeremiah", sblPrimary: "Jer", sblSecondary: "Jer" },
    "Lamentations": { full: "Lamentations", sblPrimary: "Lam", sblSecondary: "Lam" },
    "Ezekiel": { full: "Ezekiel", sblPrimary: "Ezek", sblSecondary: "Ez" },
    "Daniel": { full: "Daniel", sblPrimary: "Dan", sblSecondary: "Dn" },
    "Hosea": { full: "Hosea", sblPrimary: "Hos", sblSecondary: "Hos" },
    "Joel": { full: "Joel", sblPrimary: "Joel", sblSecondary: "Jl" },
    "Amos": { full: "Amos", sblPrimary: "Amos", sblSecondary: "Am" },
    "Obadiah": { full: "Obadiah", sblPrimary: "Obad", sblSecondary: "Ob" },
    "Jonah": { full: "Jonah", sblPrimary: "Jonah", sblSecondary: "Jon" },
    "Micah": { full: "Micah", sblPrimary: "Mic", sblSecondary: "Mi" },
    "Nahum": { full: "Nahum", sblPrimary: "Nah", sblSecondary: "Na" },
    "Habakkuk": { full: "Habakkuk", sblPrimary: "Hab", sblSecondary: "Hb" },
    "Zephaniah": { full: "Zephaniah", sblPrimary: "Zeph", sblSecondary: "Zep" },
    "Haggai": { full: "Haggai", sblPrimary: "Hag", sblSecondary: "Hg" },
    "Zechariah": { full: "Zechariah", sblPrimary: "Zech", sblSecondary: "Zec" },
    "Malachi": { full: "Malachi", sblPrimary: "Mal", sblSecondary: "Mal" },

    // New Testament
    "Matthew": { full: "Matthew", sblPrimary: "Matt", sblSecondary: "Mt" },
    "Mark": { full: "Mark", sblPrimary: "Mark", sblSecondary: "Mk" },
    "Luke": { full: "Luke", sblPrimary: "Luke", sblSecondary: "Lk" },
    "John": { full: "John", sblPrimary: "John", sblSecondary: "Jn" },
    "Acts": { full: "Acts", sblPrimary: "Acts", sblSecondary: "Acts" },
    "Romans": { full: "Romans", sblPrimary: "Rom", sblSecondary: "Rom" },
    "1 Corinthians": { full: "1 Corinthians", sblPrimary: "1 Cor", sblSecondary: "1 Cor" },
    "2 Corinthians": { full: "2 Corinthians", sblPrimary: "2 Cor", sblSecondary: "2 Cor" },
    "Galatians": { full: "Galatians", sblPrimary: "Gal", sblSecondary: "Gal" },
    "Ephesians": { full: "Ephesians", sblPrimary: "Eph", sblSecondary: "Eph" },
    "Philippians": { full: "Philippians", sblPrimary: "Phil", sblSecondary: "Phil" },
    "Colossians": { full: "Colossians", sblPrimary: "Col", sblSecondary: "Col" },
    "1 Thessalonians": { full: "1 Thessalonians", sblPrimary: "1 Thess", sblSecondary: "1 Thes" },
    "2 Thessalonians": { full: "2 Thessalonians", sblPrimary: "2 Thess", sblSecondary: "2 Thes" },
    "1 Timothy": { full: "1 Timothy", sblPrimary: "1 Tim", sblSecondary: "1 Tm" },
    "2 Timothy": { full: "2 Timothy", sblPrimary: "2 Tim", sblSecondary: "2 Tm" },
    "Titus": { full: "Titus", sblPrimary: "Titus", sblSecondary: "Ti" },
    "Philemon": { full: "Philemon", sblPrimary: "Phlm", sblSecondary: "Phlm" },
    "Hebrews": { full: "Hebrews", sblPrimary: "Heb", sblSecondary: "Heb" },
    "James": { full: "James", sblPrimary: "Jas", sblSecondary: "Jas" },
    "1 Peter": { full: "1 Peter", sblPrimary: "1 Pet", sblSecondary: "1 Pt" },
    "2 Peter": { full: "2 Peter", sblPrimary: "2 Pet", sblSecondary: "2 Pt" },
    "1 John": { full: "1 John", sblPrimary: "1 John", sblSecondary: "1 Jn" },
    "2 John": { full: "2 John", sblPrimary: "2 John", sblSecondary: "2 Jn" },
    "3 John": { full: "3 John", sblPrimary: "3 John", sblSecondary: "3 Jn" },
    "Jude": { full: "Jude", sblPrimary: "Jude", sblSecondary: "Jude" },
    "Revelation": { full: "Revelation", sblPrimary: "Rev", sblSecondary: "Rv" },
};

export type AbbreviationStyle = 'full' | 'sblPrimary' | 'sblSecondary';

export function getBookAbbreviation(bookName: string, style: AbbreviationStyle): string {
    const abbrev = sblAbbreviations[bookName];
    if (!abbrev) {
        return bookName; // Return original if not found
    }
    return abbrev[style];
}
