# Verse Formatter Plugin for Obsidian

Automatically detects Bible references in your notes and allows you to link or embed them in Obsidian.

## Features

- Detects single verses and verse ranges.
- Link verses to their own notes (`[[Romans 1.1]]`).
- Embed verses (`![[Romans 1.1#Romans 1.1]]`) with optional alias.
- Automatically highlights detected verses in a side pane.
- Supports left-hand ribbon icon for quick detection.
- Handles abbreviations and full book names.

## Commands

- **Link Single Verse** – Converts a single reference into a note link.
- **Embed Single Verse** – Embeds a single reference.
- **Link Verse Range** – Converts a range of verses into separate links.
- **Embed Verse Range** – Embeds a range of verses, one per line.

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
