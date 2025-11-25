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
  originalText: string;
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
    const text = editor.getValue();
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

    // Numeric verses (Romans 1:1, 1:1-3, 1:1, 3, 5, Romans 8, 9, 10)
    const numericRegex = new RegExp(
      `\\b(${this.getBookPattern()})\\s*(\\d{1,3}(?:(?:[.:]|\\s+(?:verse|v\\.?|vs\\.?)\\s+)\\d{1,3})?(?:\\s*(?:-|and|&|,)\\s*\\d{1,3})*)`,
      "gi"
    );

    // Written-out verses (Romans chapter 1, verse 1)
    const writtenRegex = /\b((?:[1-3]|I{1,3})?\s?[A-Za-z.]+(?:\s(?:of|the)\s[A-Za-z]+)?)\s+(?:chapter|chap\.?|ch\.?)\s*(\d{1,3})\s*,?\s*(?:verse|v\.?|vs\.?|v)\s*(\d{1,3})\.?/gi;

    // Numeric verses
    for (const m of text.matchAll(numericRegex)) {
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
    for (const m of text.matchAll(writtenRegex)) {
      const fullMatch = m[0];
      const start = m.index!;
      const end = start + fullMatch.length;

      if (!isInsideLink(start, end)) {
        matches.push({
          text: `${m[1]} ${m[2]}.${m[3]}`, // normalized
          originalText: fullMatch, // actual written-out text
          start,
          end,
        });
      }
    }

    // Keep order of appearance
    matches.sort((a, b) => a.start - b.start);
    this.detectedVerses = matches;
  }

  addUndoButton(editor: any, container: HTMLElement) {
    const undoEl = container.createEl("div", { cls: "undo-button" });
    new ButtonComponent(undoEl)
      .setIcon("undo")
      .setTooltip("Undo last verse formatting")
      .onClick(() => {
        editor.undo(); // undo last editor action
        this.updateDetectedVerses(editor); // re-run detection
        this.renderSidebar(editor); // update sidebar
        new Notice("Undid last action");
      });
  }

  addRefreshButton(editor: any, parent: HTMLElement) {
    const refreshEl = parent.createEl("div", { cls: "refresh-button" });

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

    // 🔹 Top row container for Undo (left) and Refresh (right)
    const topRow = container.createEl("div", { cls: "top-controls" });

    // Undo button container (left)
    const undoEl = topRow.createEl("div", { cls: "undo-button" });
    new ButtonComponent(undoEl)
      .setIcon("undo-2")
      .setTooltip("Undo last verse formatting")
      .onClick(() => {
        editor.undo(); // Use editor's native undo
        this.updateDetectedVerses(editor); // re-run detection
        this.renderSidebar(editor); // update sidebar
        new Notice("Undid last action");
      });

    // Refresh button container (right)
    const refreshEl = topRow.createEl("div", { cls: "refresh-button" });
    new ButtonComponent(refreshEl)
      .setIcon("refresh-cw")
      .setTooltip("Refresh detected verses")
      .onClick(() => {
        this.updateDetectedVerses(editor);
        this.renderSidebar(editor);
        new Notice("Verse detection refreshed!");
      });

    // 🔹 Update verses
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

        editor.setCursor(from);
        editor.scrollIntoView({ from, to }, true);

        // Optional: manual adjustment for centering in CodeMirror
        const cm = editor.cm as any;
        if (cm && cm.display) {
          const line = from.line;
          const coords = cm.charCoords({ line, ch: 0 }, "local");
          const halfHeight = cm.getScrollerElement().clientHeight / 2;
          cm.scrollTo(null, coords.top - halfHeight + 10);
        }

        new Notice(`Jumped to: ${verse.text}`);
      });

      const isRange = /[-&,]| and /i.test(verse.text);

      if (!isRange) {
        new ButtonComponent(refEl)
          .setIcon("link-2")
          .setTooltip(linkSingleVerse(verse.originalText, this.plugin.settings))
          .onClick(() =>
            this.replaceInEditor(editor, verse, linkSingleVerse(verse.originalText, this.plugin.settings))
          );

        new ButtonComponent(refEl)
          .setIcon("rectangle-horizontal")
          .setTooltip(embedSingleVerse(verse.text, this.plugin.settings))
          .onClick(() =>
            this.replaceInEditor(editor, verse, embedSingleVerse(verse.text, this.plugin.settings))
          );
      } else {
        new ButtonComponent(refEl)
          .setIcon("link")
          .setTooltip(linkVerseRange(verse.text, this.plugin.settings))
          .onClick(() =>
            this.replaceInEditor(editor, verse, linkVerseRange(verse.text, this.plugin.settings))
          );

        new ButtonComponent(refEl)
          .setIcon("rows-3")
          .setTooltip(embedVerseRange(verse.text, this.plugin.settings))
          .onClick(() =>
            this.replaceInEditor(editor, verse, embedVerseRange(verse.text, this.plugin.settings))
          );
      }
    });
  }

  replaceInEditor(editor: any, verse: DetectedVerse, replacement: string) {
    const startPos = editor.offsetToPos(verse.start);
    const endPos = editor.offsetToPos(verse.end);

    editor.replaceRange(replacement, startPos, endPos);

    const newEndPos = editor.offsetToPos(verse.start + replacement.length);
    editor.setCursor(newEndPos);
    editor.scrollIntoView({ from: startPos, to: newEndPos }, true);

    this.updateDetectedVerses(editor);
    this.renderSidebar(editor);

    new Notice(`Formatted: ${verse.text}`);
  }
}

// Utility to escape special characters in regex
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
