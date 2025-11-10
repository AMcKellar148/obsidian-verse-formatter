import {
  ItemView,
  WorkspaceLeaf,
  ButtonComponent,
  Notice,
} from "obsidian";

import {
  linkSingleVerse,
  embedSingleVerse,
  linkVerseRange,
  embedVerseRange,
} from "./verseFormatter";

const verseRegex =
  /\b((?:[1-3]|I{1,3})?\s?[A-Za-z.]+(?:\s(?:of|the)\s[A-Za-z]+)?)\s+(\d+[.:]\d+(?:\s*-\s*\d+)?)/g;

interface DetectedVerse {
  text: string;
  start: number;
  end: number;
}

export class VerseDetectorView extends ItemView {
  plugin: any;
  detectedVerses: DetectedVerse[] = [];

  constructor(leaf: WorkspaceLeaf, plugin: any) {
    super(leaf);
    this.plugin = plugin;
    this.containerEl.addClass("verse-detector-view");
  }

  getViewType() { return "verse-detector-view"; }
  getDisplayText() { return "Bible Verse Detector"; }
  getIcon(): string {
    return "book-open"; // same as the ribbon icon
}

  async onOpen() {
    const editor = this.plugin.app.workspace.activeEditor?.editor;
    if (!editor) return;

    this.renderSidebar(editor);
  }

  async onClose() {
    const container = this.containerEl.children[1];
    container.empty();
  }

  addRefreshButton(editor: any) {
    const container = this.containerEl.children[1];
    const refreshEl = container.createEl("div", { cls: "refresh-button" });
    new ButtonComponent(refreshEl)
      .setIcon("refresh-cw")
      .setTooltip("Refresh detected verses")
      .onClick(() => {
        this.updateDetectedVerses(editor);
        this.renderSidebar(editor);
        new Notice("Verse detection refreshed!");
      });
  }

  updateDetectedVerses(editor: any) {
    const text = editor.getValue();
    const matches: DetectedVerse[] = [];

    for (const m of text.matchAll(verseRegex)) {
      const [fullMatch] = m;
      const start = m.index!;
      const end = start + fullMatch.length;

      // Skip already formatted references ([[...]] or ![[...]])
      const pattern = new RegExp(`\\[!?\\[.*${fullMatch}.*\\]\\]`);
      if (!pattern.test(text)) {
        matches.push({ text: fullMatch, start, end });
      }
    }

    this.detectedVerses = matches;
  }

  renderSidebar(editor: any) {
    const container = this.containerEl.children[1];
    container.empty();

    // Add refresh button at the top
    this.addRefreshButton(editor);

    // Update verse detection
    this.updateDetectedVerses(editor);

    if (this.detectedVerses.length === 0) {
      container.createEl("p", { text: "No unformatted Bible references found." });
      return;
    }

    container.createEl("h3", { text: "Detected Bible References" });

    this.detectedVerses.forEach((verse) => {
      const refEl = container.createEl("div", { cls: "verse-item" });
      refEl.createEl("b", { text: verse.text });

      const isRange = verse.text.includes("-");

      if (!isRange) {
        // Link single verse
        new ButtonComponent(refEl)
          .setIcon("link-2")
          .setTooltip(linkSingleVerse(verse.text))
          .onClick(() => this.replaceInEditor(editor, verse, linkSingleVerse(verse.text)));

        // Embed single verse
        new ButtonComponent(refEl)
          .setIcon("rectangle-horizontal")
          .setTooltip(embedSingleVerse(verse.text))
          .onClick(() => this.replaceInEditor(editor, verse, embedSingleVerse(verse.text)));
      } else {
        // Link verse range
        new ButtonComponent(refEl)
          .setIcon("link")
          .setTooltip(linkVerseRange(verse.text))
          .onClick(() => this.replaceInEditor(editor, verse, linkVerseRange(verse.text)));

        // Embed verse range
        new ButtonComponent(refEl)
          .setIcon("rows-3")
          .setTooltip(embedVerseRange(verse.text))
          .onClick(() => this.replaceInEditor(editor, verse, embedVerseRange(verse.text)));
      }
    });
  }

  replaceInEditor(editor: any, verse: DetectedVerse, replacement: string) {
    const text = editor.getValue();
    const before = text.slice(0, verse.start);
    const after = text.slice(verse.end);
    editor.setValue(before + replacement + after);

    // Recalculate positions after text change
    this.updateDetectedVerses(editor);
    this.renderSidebar(editor);

    new Notice(`Formatted: ${verse.text}`);
  }
}
