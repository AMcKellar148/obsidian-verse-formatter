{{ ... }}

Automatically detects Bible references in your notes and allows you to link or embed them in Obsidian.

## Features

- **Smart Detection:** Detects single verses, ranges, and lists.
- **Auto-Detect:** Automatically detects verses as you type (debounced).
- **File Lock:** Pin the detection view to a specific file so it doesn't switch when you change tabs.
- **Intelligent Aliasing:** Preserves original text (e.g., "Ephesians chapter 5") as the link alias.
- **Flexible Formats:** Supports various reference styles including "and", "&", comma-separated lists, and more.
- **Link & Embed:** Easily convert references to links (`[[Romans 1.1]]`) or embeds (`![[Romans 1.1#Romans 1.1]]`).
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

## Commands

- **Link Single Verse** – Converts selected text into a link.
- **Embed Single Verse** – Embeds selected text.
- **Link Verse Range** – Converts selected range/list into separate links.
- **Embed Verse Range** – Embeds selected range/list, one per line.
- **Detect Bible References** – Opens the sidebar view to find references in the current note.

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
```
