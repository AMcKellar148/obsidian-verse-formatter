import { ItemView, WorkspaceLeaf, ButtonComponent, Notice } from "obsidian";
import {
  linkSingleVerse,
  embedSingleVerse,
  linkVerseRange,
  embedVerseRange,
  bibleBooks
} from "./verseFormatter";

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
  getIcon(): string { return "book-open"; }

  async onOpen() {
    const editor = this.plugin.app.workspace.activeEditor?.editor;
    if (!editor) return;
    this.renderSidebar(editor);
  }

  async onClose() {
    const container = this.containerEl.children[1];
    container.empty();
  }

  private getBookPattern(): string {
    return bibleBooks
      .flatMap(b => [b.name, ...b.abbr])
      .map(b => b.replace(/\./g, "\\."))
      .join("|");
  }

  updateDetectedVerses(editor: any) {
    const bookPattern = this.getBookPattern();
    const verseRegex = new RegExp(
      `\\b(${bookPattern})\\s+(\\d{1,3}[.:]\\d{1,3}(?:\\s*-\\s*\\d{1,3})?)`,
      "gi"
    );

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

  renderSidebar(editor: any) {
    const container = this.containerEl.children[1];
    container.empty();

    this.addRefreshButton(editor);
    this.updateDetectedVerses(editor);

    if (this.detectedVerses.length === 0) {
      container.createEl("p", { text: "No unformatted Bible references found." });
      return;
    }

    container.createEl("h3", { text: "Detected Bible References" });

    this.detectedVerses.forEach((verse) => {
      const refEl = container.createEl("div", { cls: "verse-item" });

      // Clickable verse label
      const refLabel = refEl.createEl("b", { text: verse.text });
      refLabel.style.cursor = "pointer";

      refLabel.addEventListener("click", () => {
        const from = editor.offsetToPos(verse.start);
        const to = editor.offsetToPos(verse.end);

        // Set cursor at verse start
        editor.setCursor(from);

        // Scroll roughly to middle of screen
        editor.scrollIntoView({ from, to }, true);

        // Optional manual centering for CodeMirror
        const cm = editor.cm as any;
        if (cm && cm.display) {
          const line = from.line;
          const coords = cm.charCoords({ line, ch: 0 }, "local");
          const halfHeight = cm.getScrollerElement().clientHeight / 2;
          cm.scrollTo(null, coords.top - halfHeight + 10);
        }

        new Notice(`Jumped to: ${verse.text}`);
      });

      const isRange = verse.text.includes("-");

      if (!isRange) {
        new ButtonComponent(refEl)
          .setIcon("link-2")
          .setTooltip(linkSingleVerse(verse.text))
          .onClick(() => this.replaceInEditor(editor, verse, linkSingleVerse(verse.text)));

        new ButtonComponent(refEl)
          .setIcon("rectangle-horizontal")
          .setTooltip(embedSingleVerse(verse.text))
          .onClick(() => this.replaceInEditor(editor, verse, embedSingleVerse(verse.text)));
      } else {
        new ButtonComponent(refEl)
          .setIcon("link")
          .setTooltip(linkVerseRange(verse.text))
          .onClick(() => this.replaceInEditor(editor, verse, linkVerseRange(verse.text)));

        new ButtonComponent(refEl)
          .setIcon("rows-3")
          .setTooltip(embedVerseRange(verse.text))
          .onClick(() => this.replaceInEditor(editor, verse, embedVerseRange(verse.text)));
      }
    });
  }

  replaceInEditor(editor: any, verse: DetectedVerse, replacement: string) {
    editor.replaceRange(
      replacement,
      editor.offsetToPos(verse.start),
      editor.offsetToPos(verse.end)
    );

    // Keep cursor at end of inserted text and scroll it into view
    const endPos = editor.offsetToPos(verse.start + replacement.length);
    editor.setCursor(endPos);
    editor.scrollIntoView({ from: editor.offsetToPos(verse.start), to: endPos }, true);

    this.updateDetectedVerses(editor);
    this.renderSidebar(editor);

    new Notice(`Formatted: ${verse.text}`);
  }
}
