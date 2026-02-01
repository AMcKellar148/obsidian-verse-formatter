# Verse Formatter

Automatically detects Bible references in your notes and allows you to link or embed them in Obsidian.

## Features

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

## Supported Formats

The plugin is designed to be flexible and forgiving. It supports:

- **Standard:** `Romans 1:1`, `Romans 1:1-3`
- **Ranges with "and" / "&":** `Romans 1:1 and 2`, `Romans 1:1 & 2`
- **Comma-Separated Lists:** `Romans 8:1, 3, 5`, `Romans 8, 9, 10`
- **Chapter Only:** `Romans 8`, `Romans 8-10`
- **Single-Chapter Books:** `Jude 9` (detects as Jude 1:9), `3 John 4`
- **"Verse" Keyword:** `Acts 2 verse 42`, `Acts 2 v 42`, `Acts 2 vs 42`
- **Missing Spaces:** `Colossians1.9` (detects as Colossians 1:9)

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

**Version:** 2.0.0  
**Author:** Alden McKellar
