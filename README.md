# Bible Verse Formatter
<img width="1607" height="615" alt="Bible Verse Detection " src="https://github.com/user-attachments/assets/3fa263af-bb93-43f7-92b6-af265601bf9d" />

Automatically detects Bible references in your notes and allows you to link or embed them in Obsidian.

## Features
- **Consistent Sidebar Styling (New in v2.2):** Verse labels in the sidebar now match your selected abbreviation style (e.g., SBL Primary).
- **Inferred Alias Toggle (New in v2.2):** Choose whether inferred verses should use their original text (like "verse 6") as the link alias.
- **Context-Aware Detection:** Detects incomplete references like "verse 6" and automatically infers the book/chapter from previous references in the note.
- **Manual Context Override:** Manually set a book and chapter context to resolve ambiguous or missing references.
- **Smart Detection:** Detects single verses, ranges, and lists.
- **Auto-Detect:** Automatically detects verses as you type (debounced).
- **File Lock:** Pin the detection view to a specific file so it doesn't switch when you change tabs.
- **Intelligent Aliasing:** Preserves original text (e.g., "Ephesians chapter 5") as the link alias.
- **SBL Abbreviations:** Choose between Full Names, SBL Primary, or SBL Secondary abbreviations for standardized references.
- **Hotkey Navigation:** Format verses sequentially using keyboard shortcuts.
- **Skip/Unskip Verses:** Right-click to skip verses you don't want to format, with visual strikethrough styling.
- **Flexible Formats:** Supports various reference styles including "and", "&", comma-separated lists, and more.
- **Link & Embed:** Easily convert references to links (`[[Romans 8.1]]`) or embeds (`![[Romans 8.1#Romans 8.1]]`).
- **Sidebar View:** Automatically highlights detected verses with Undo and Refresh controls.
- **Custom Templates:** Define your own link format (e.g., `[[{book} {chapter}:{verse}]]`).
- **Ribbon Icon:** Quick access to the detection sidebar.

![BibleVerseFormatter-short](https://github.com/user-attachments/assets/aa7545c7-cad9-408a-81b8-d3c62f24312e)
## Supported Formats

The plugin is designed to be flexible and forgiving. It supports:

- **Standard:** `Romans 1:1`, `Romans 1:1-3`
- **Contextual:** `verse 6`, `in v. 12` (infers Romans 1 if Romans 1:1 was mentioned previously)
- **Ranges with "and" / "&":** `Romans 1:1 and 2`, `Romans 1:1 & 2`
- **Comma-Separated Lists:** `Romans 8:1, 3, 5`, `Romans 8, 9, 10`
- **Chapter Only:** `Romans 8`, `Romans 8-10`
- **Single-Chapter Books:** `Jude 9` (detects as Jude 1:9), `3 John 4`
- **"Verse" Keyword:** `Acts 2 verse 42`, `Acts 2 v 42`, `Acts 2 vs 42`
- **Missing Spaces:** `Colossians1.9` (detects as Colossians 1:9)

## Context-Aware Detection (v2.1)

The plugin can now find references like "verse 6" and use context to assign the correct book and chapter.

### How it works:
1. **Auto-Inference:** It looks for the last complete verse reference (e.g., "Romans 8:1") in the current paragraph or note.
2. **Manual Override:** You can manually set the context in the sidebar header by clicking the **Edit** (pencil) icon. This is useful if you are writing about a specific chapter but haven't linked a verse yet.
3. **Visual Feedback:** 
   - Inferred verses are shown in *italics* with the source context (e.g., "verse 6 (from Romans 8)").
   - Verses that need context but haven't found any will show a ⚠️ warning symbol.

## Settings

### Custom Link Templates
You can customize how verses are linked by enabling **Use Custom Template** in the settings.

- **Placeholders:**
    - `{book}`: Full book name (e.g., "Romans")
    - `{chapter}`: Chapter number
    - `{verse}`: Verse number
    - `{original}`: The original text found in your note
- **Example:** `[[{book} {chapter}:{verse}]]` will produce `[[Romans 1:1]]`.

### Auto-Detection & Performance
- **Auto-Detect Verses:** Toggle automatic detection on/off.
- **Auto-Detect Delay:** Set the delay (in ms) before detection runs (default: 1000ms).
- **Max Verses per Page:** Limit the number of verses displayed in the sidebar to improve performance (default: 50).

### Book Name Style (SBL Abbreviations)
Choose how book names appear in verse links:
- **Full Names** - e.g., "Genesis", "1 Corinthians"
- **SBL Primary** - e.g., "Gen", "1 Cor", "Matt", "Rev"
- **SBL Secondary** - e.g., "Gn", "1 Cor", "Mt", "Rv"

**Note:** The link target (file name) always uses the full book name. The abbreviation is used in the display alias.

**Example with SBL Primary:**
- Input: "Romans 8:1"
- Output: `[[Romans 8.1|Rom 8.1]]`
- Links to: "Romans 8.1" (file)
- Displays as: "Rom 8.1"

## Commands

### Basic Formatting
- **Link Single Verse** – Converts selected text into a link.
- **Embed Single Verse** – Embeds selected text.
- **Link Verse Range** – Converts selected range/list into separate links.
- **Embed Verse Range** – Embeds selected range/list, one per line.
- **Detect Bible References** – Opens the sidebar view to find references in the current note.

### Hotkey Navigation (New in v2.0)
- **Format Next Verse (Link)** – Links the next verse in the detected list.
- **Format Next Verse (Embed)** – Embeds the next verse in the detected list.
- **Skip Next Verse** – Skips the current verse and moves to the next.
- **Unskip Current Verse** – Removes the current verse from the skip list.
- **Reset All Skipped Verses** – Clears all skipped verses.

**Tip:** Assign keyboard shortcuts to these commands in Settings → Hotkeys for rapid verse formatting!

## Sidebar Features

### Context Menu
Right-click any verse in the sidebar to:
- **Skip verse** – Mark it to be ignored (shown with strikethrough)
- **Unskip verse** – Remove it from the skip list

### Visual Indicators
- **Skipped verses** appear with strikethrough text and reduced opacity
- **Lock button** in the header to pin the view to the current file
- **File name** displayed in the header shows which note is being scanned

## Installation

1. Download or clone this repository.
2. Copy the folder into your vault under:
   `.obsidian/plugins/obsidian-verse-formatter-plugin`
3. Reload Obsidian and enable the plugin under **Community Plugins → Installed Plugins**.

## Development

```bash
npm install
npm run build       # Compile TypeScript to JS
npm run dev         # Watch for changes while developing
npm test            # Run unit tests
```

## What's New in v2.3.3

### Improvements
- **Duplicate Prevention:** Fixed an issue where verses would be duplicated in the sidebar if they were part of both a full reference and an inferred reference (e.g., "1:1" inside "Genesis 1:1" no longer creates a separate entry).

## What's New in v2.3.2

### Improvements
- **Canonical Link Targets:** All verse links now use the full canonical book name for the target link (e.g., `[[Genesis 1.1]]`), regardless of how the book was abbreviated in the original text or context.
- **SBL Separator Support:** Aliases using SBL Primary or Secondary styles now automatically use the standard `:` separator (e.g., `Gen 1:1`), while Full Name and custom styles retain the `.` separator for Obsidian compatibility.

## What's New in v2.3.1

### Improvements
- **Universal Period Support:** Enhanced the search logic to recognize book names and abbreviations regardless of whether they end with a period (e.g., both "Ps" and "Ps." are now correctly identified as Psalm).

## What's New in v2.3.0

### Major Features
- **Deep Context Support:** The plugin can now handle complex reference strings like `Romans 1.1; 3:10, 11; 4:5-6`.
- **Chapter-Verse Detection:** Standalone chapter-verse patterns (e.g., "3:10") are now detected and correctly assigned a book based on the preceding context.
- **Semicolon Lists:** Better support for semicolon-delimited lists where only the first reference explicitly mentions the book.

## What's New in v2.2.2

### Improvements
- **Enhanced Link Context:** Incomplete references like "verse 6" now correctly infer their context from existing Bible links (e.g. `[[Romans 8.1]]`) found earlier in the note, even if those verses aren't currently in the detector list.

## What's New in v2.2.1

### Improvements
- **Automatic List Refresh:** The verse list now automatically refreshes positions and offsets after every formatting action, ensuring that subsequent hotkey commands are perfectly accurate.
- **Stable Skip Tracking:** Your skipped verses are now tracked across list refreshes, automatically adjusting their internal indices as other verses are formatted and removed from the list.

## What's New in v2.2

### Features
- **Abbreviated Sidebar Labels:** The Bible References sidebar now respects your abbreviation style settings for all labels and context clues.
- **Alias Inferred Verses Setting:** New toggle to ensure "verse 6" stays as "verse 6" after formatting, instead of being replaced by the full reference alias.

## What's New in v2.1

### Major Features
- **Context-Aware Detection:** Support for "verse X" style references.
- **Manual Context Row:** Set a global context for the current file to help with ambiguous references.
- **Inferred Reference Styling:** Clear visual indicators for verses detected via context.

### Improvements
- Better UI management in the sidebar header.
- Fixed several internal typing issues for more stable builds.

## What's New in v2.0
### Major Features
- **SBL Abbreviations:** Full support for Society of Biblical Literature standard abbreviations
- **Hotkey Navigation:** Format verses sequentially without clicking
- **Skip/Unskip System:** Right-click to skip verses with visual feedback
- **Enhanced UI:** Cleaner header icons and better visual styling

### Improvements
- Better alias handling for written-out verses
- Performance optimizations
- Comprehensive unit test coverage
- Improved auto-detection logic

---

**Version:** 2.3.3  
**Author:** Alden McKellar
