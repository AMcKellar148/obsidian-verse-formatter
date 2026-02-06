import { ItemView, WorkspaceLeaf, ButtonComponent, Notice, debounce, TFile, Editor, Menu, Modal, Setting, App } from "obsidian";
import {
  linkSingleVerse,
  embedSingleVerse,
  linkVerseRange,
  embedVerseRange,
} from "./verseFormatter";
import { getBookAbbreviation } from "./sblAbbreviations";
import { VerseDetectorService, DetectedVerse } from "./VerseDetectorService";
import type VerseFormatter from "../main";

export const VIEW_TYPE_VERSE = 'bible-verse-formatter-view';

export class VerseDetectorView extends ItemView {
  plugin: VerseFormatter;
  detectedVerses: DetectedVerse[] = [];
  private service: VerseDetectorService;
  private debouncedUpdate: ((editor: Editor) => void) & { cancel(): void };
  private isLocked = false;
  private lockedFile: TFile | null = null;
  private currentVerseIndex = 0;
  private skippedVerses: Set<number> = new Set();

  constructor(leaf: WorkspaceLeaf, plugin: VerseFormatter) {
    super(leaf);
    this.plugin = plugin;
    this.containerEl.addClass("verse-detector-view");
    this.service = new VerseDetectorService();
    this.refreshDebounce();
  }

  refreshDebounce(): void {
    this.debouncedUpdate = debounce(
      (editor: Editor) => {
        if (this.plugin.settings.autoDetect) {
          this.updateDetectedVerses(editor);
          this.renderSidebar(editor);
        }
      },
      this.plugin.settings.autoDetectDelay,
      true
    );
  }

  getViewType(): string { return VIEW_TYPE_VERSE; }
  getDisplayText(): string { return "bible verse detector"; }
  getIcon(): string { return "book-open"; }

  onOpen(): Promise<void> {
    this.registerEvent(
      this.app.workspace.on('editor-change', (editor) => {
        if (this.debouncedUpdate) {
          // If locked, only update if the editor belongs to the locked file
          if (this.isLocked && this.lockedFile) {
            const activeFile = this.app.workspace.activeEditor?.file;
            if (activeFile && activeFile.path === this.lockedFile.path) {
              this.debouncedUpdate(editor);
            }
          } else {
            this.debouncedUpdate(editor);
          }
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        if (this.isLocked) return; // Don't switch if locked

        const editor = this.plugin.app.workspace.activeEditor?.editor;
        if (editor) {
          this.updateDetectedVerses(editor);
          this.renderSidebar(editor);
        }
      })
    );

    const editor = this.plugin.app.workspace.activeEditor?.editor;
    if (editor) {
      this.renderSidebar(editor);
    }
    return Promise.resolve();
  }

  onClose(): Promise<void> {
    this.contentEl.empty();
    return Promise.resolve();
  }

  private formatDisplayLabel(text: string): string {
    if (!text) return "";

    // Check if it's an incomplete reference (starts with "verse")
    if (text.toLowerCase().startsWith("verse")) return text;

    const style = this.plugin.settings.abbreviationStyle || 'full';

    // Try to split book and the rest (chapter/verse)
    // Matches "1 Corinthians 13.1", "Genesis 1", etc.
    const match = text.match(/^((?:\d\s)?[A-Za-z\s]+?)\s+(\d+(?:[.:]\d+)?.*)$/);

    if (match) {
      const book = match[1].trim();
      const rest = match[2];
      const abbreviatedBook = getBookAbbreviation(book, style);

      // Handle separator in the "rest" part for display
      const sep = (style === 'sblPrimary' || style === 'sblSecondary') ? ':' : '.';
      const formattedRest = rest.replace(/[.:]/, sep);

      return `${abbreviatedBook} ${formattedRest}`;
    }

    // If no match, it might be just a book name (used in inferred context)
    // Be careful not to abbreviate things that aren't books
    const abbreviatedBook = getBookAbbreviation(text, style);
    return abbreviatedBook;
  }

  updateDetectedVerses(editor: Editor): void {
    const text = editor.getValue();
    this.detectedVerses = this.service.detectVerses(text);
  }

  renderSidebar(editor: Editor): void {
    const container = this.contentEl;
    container.empty();

    // 🔹 Header with Refresh and Undo
    const controlsRow = container.createEl("div", { cls: "view-header nav-header" });

    // Undo button
    const leftControls = controlsRow.createEl("div", { cls: "nav-buttons-container" });
    const undoBtn = new ButtonComponent(leftControls)
      .setIcon("undo-2")
      .setTooltip("Undo last verse formatting")
      .onClick(() => {
        editor.undo();
        this.updateDetectedVerses(editor);
        this.renderSidebar(editor);
        new Notice("Undid last action");
      });
    undoBtn.buttonEl.addClass("header-icon-btn");

    // File Name Header
    // Determine displayed filename
    let displayFileName = "No file";
    if (this.isLocked && this.lockedFile) {
      displayFileName = this.lockedFile.basename;
    } else {
      const activeFile = this.plugin.app.workspace.getActiveFile();
      if (activeFile) displayFileName = activeFile.basename;
    }

    controlsRow.createEl("div", {
      cls: "view-header-title u-bold",
      text: displayFileName
    });

    // Right Controls (Lock + Refresh)
    const rightControls = controlsRow.createEl("div", { cls: "nav-buttons-container" });

    // Lock Button
    const lockBtn = new ButtonComponent(rightControls)
      .setIcon(this.isLocked ? "lock" : "unlock")
      .setTooltip(this.isLocked ? "Unlock view" : "Lock view to this note")
      .onClick(() => {
        this.isLocked = !this.isLocked;
        if (this.isLocked) {
          // Lock to current
          this.lockedFile = this.plugin.app.workspace.getActiveFile();
          new Notice(`Locked to ${this.lockedFile ? this.lockedFile.basename : 'current file'}`);
        } else {
          this.lockedFile = null;
          new Notice("Unlocked");
        }
        this.renderSidebar(editor);
      });
    lockBtn.buttonEl.addClass("header-icon-btn");
    if (this.isLocked) lockBtn.buttonEl.addClass("is-active");

    // Refresh button
    const refreshBtn = new ButtonComponent(rightControls)
      .setIcon("refresh-cw")
      .setTooltip("Refresh detected verses")
      .onClick(() => {
        // Re-create debounce in case settings changed
        this.refreshDebounce();
        this.updateDetectedVerses(editor);
        this.renderSidebar(editor);
        new Notice("Verse detection refreshed");
      });
    refreshBtn.buttonEl.addClass("header-icon-btn");

    // Context Control Section
    const manualContext = this.service.getManualContext();
    const contextRow = container.createEl("div", { cls: "context-control-row" });

    contextRow.createEl("span", {
      text: "Context:",
      cls: "context-label"
    });

    contextRow.createEl("span", {
      text: manualContext ? `${manualContext.book} ${manualContext.chapter}` : "auto",
      cls: "context-value"
    });

    if (manualContext) {
      new ButtonComponent(contextRow)
        .setIcon("x")
        .setTooltip("Clear manual context")
        .onClick(() => {
          this.service.clearManualContext();
          this.updateDetectedVerses(editor);
          this.renderSidebar(editor);
          new Notice("Context cleared (switching to auto)");
        })
        .buttonEl.addClass("header-icon-btn");
    }

    new ButtonComponent(contextRow)
      .setIcon("edit")
      .setTooltip("Set manual context")
      .onClick(() => {
        this.showContextModal(editor);
      })
      .buttonEl.addClass("header-icon-btn");


    // 🔹 Update verses logic check (already updated, just rendering list)

    if (this.detectedVerses.length === 0) {
      container.createEl("p", { text: "No unformatted bible references found" });
      return;
    }

    container.createEl("h3", { text: "Detected bible references" });

    // Limit verses
    const maxVerses = this.plugin.settings.maxVerses || 50;
    const versusToShow = this.detectedVerses.slice(0, maxVerses);
    const hiddenCount = this.detectedVerses.length - maxVerses;

    versusToShow.forEach((verse, index) => {
      const refEl = container.createEl("div", { cls: "verse-item" });

      // Check if this verse is skipped
      const isSkipped = this.skippedVerses.has(index);

      // Apply skipped styling
      if (isSkipped) {
        refEl.addClass("verse-skipped");
      }

      // Clickable verse label
      let labelText = this.formatDisplayLabel(verse.text);
      if (verse.needsContext && verse.inferredContext) {
        labelText = `${this.formatDisplayLabel(verse.text)} (from ${this.formatDisplayLabel(verse.inferredContext)})`;
      } else if (verse.needsContext && !verse.inferredContext) {
        labelText = `${verse.text} (⚠️ needs context)`;
      }

      const refLabel = refEl.createEl("b", { text: labelText });

      // Add warning styling for verses needing context
      if (verse.needsContext && !verse.inferredContext) {
        refLabel.addClass("needs-context-warning");
      } else if (verse.needsContext) {
        refLabel.addClass("needs-context-info");
      }

      // Add context menu for skip/unskip
      refLabel.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const menu = new Menu();

        if (isSkipped) {
          menu.addItem((item) => {
            item
              .setTitle("Unskip verse")
              .setIcon("check")
              .onClick(() => {
                this.skippedVerses.delete(index);
                new Notice(`Unskipped: ${verse.text}`);
                this.renderSidebar(editor);
              });
          });
        } else {
          menu.addItem((item) => {
            item
              .setTitle("Skip verse")
              .setIcon("x")
              .onClick(() => {
                this.skippedVerses.add(index);
                new Notice(`Skipped: ${verse.text}`);
                this.renderSidebar(editor);
              });
          });
        }

        menu.showAtMouseEvent(e);
      });

      refLabel.addEventListener("click", () => {
        const from = editor.offsetToPos(verse.start);
        const to = editor.offsetToPos(verse.end);

        editor.setCursor(from);
        editor.scrollIntoView({ from, to }, true);

        new Notice(`Jumped to: ${verse.text}`);
      });

      const isRange = /[-&,]| and /i.test(verse.text);

      if (!isRange) {
        new ButtonComponent(refEl)
          .setIcon("link-2")
          .setTooltip(linkSingleVerse(verse.text, this.plugin.settings, verse.originalText))
          .onClick(() =>
            this.replaceInEditor(editor, verse, linkSingleVerse(verse.text, this.plugin.settings, verse.originalText))
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

    if (hiddenCount > 0) {
      container.createEl("div", {
        text: `... and ${hiddenCount} more verses`,
        cls: "more-verses-msg u-italic"
      });
    }
  }

  replaceInEditor(editor: Editor, verse: DetectedVerse, replacement: string): void {
    // Determine the index of the verse being formatted
    const verseIndex = this.detectedVerses.indexOf(verse);

    const startPos = editor.offsetToPos(verse.start);
    const endPos = editor.offsetToPos(verse.end);

    editor.replaceRange(replacement, startPos, endPos);

    const newEndPos = editor.offsetToPos(verse.start + replacement.length);
    editor.setCursor(newEndPos);
    editor.scrollIntoView({ from: startPos, to: newEndPos }, true);

    // Update skippedVerses indices since one item is being removed
    if (verseIndex !== -1) {
      const newSkipped = new Set<number>();
      this.skippedVerses.forEach(idx => {
        if (idx < verseIndex) {
          newSkipped.add(idx);
        } else if (idx > verseIndex) {
          newSkipped.add(idx - 1);
        }
        // if idx === verseIndex, it's now formatted, so we don't add it
      });
      this.skippedVerses = newSkipped;
    }

    // Refresh everything immediately after formatting
    this.updateDetectedVerses(editor); // Recalculate all verse positions
    this.renderSidebar(editor);       // Re-draw the list

    new Notice(`Formatted: ${verse.text}`);
  }

  // Format the next verse in the list using hotkey
  public formatNextVerse(type: 'link' | 'embed'): void {
    const editor = this.plugin.app.workspace.activeEditor?.editor;
    if (!editor) {
      new Notice("No active editor found");
      return;
    }

    if (this.detectedVerses.length === 0) {
      new Notice("No verses detected (open the sidebar to scan for verses)");
      return;
    }

    // Skip over any skipped verses
    const startIndex = this.currentVerseIndex;
    while (this.skippedVerses.has(this.currentVerseIndex)) {
      this.currentVerseIndex = (this.currentVerseIndex + 1) % this.detectedVerses.length;

      // If we've looped back, all verses are skipped
      if (this.currentVerseIndex === startIndex) {
        new Notice("All verses have been skipped or formatted");
        return;
      }
    }

    // Get the current verse
    const verse = this.detectedVerses[this.currentVerseIndex];

    // Determine if it's a range
    const isRange = verse.text.includes('-') || verse.text.includes(',');

    // Format based on type and range
    let replacement: string;
    if (type === 'link') {
      replacement = isRange
        ? linkVerseRange(verse.text, this.plugin.settings)
        : linkSingleVerse(verse.text, this.plugin.settings, verse.originalText);
    } else {
      replacement = isRange
        ? embedVerseRange(verse.text, this.plugin.settings)
        : embedSingleVerse(verse.text, this.plugin.settings);
    }

    // Replace in editor
    this.replaceInEditor(editor, verse, replacement);

    // After formatting, the list will refresh and this verse will be gone.
    // So the "next" verse will shift into the CURRENT index.
    // We only need to wrap around if we were at the very end.
    if (this.currentVerseIndex >= this.detectedVerses.length - 1) {
      this.currentVerseIndex = 0;
    }
  }

  // Skip the current verse and move to next
  public skipNextVerse(): void {
    if (this.detectedVerses.length === 0) {
      new Notice("No verses detected");
      return;
    }

    // Mark current verse as skipped
    this.skippedVerses.add(this.currentVerseIndex);

    // Move to next verse
    const startIndex = this.currentVerseIndex;
    do {
      this.currentVerseIndex = (this.currentVerseIndex + 1) % this.detectedVerses.length;

      // If we've looped back to start, all verses are skipped
      if (this.currentVerseIndex === startIndex) {
        new Notice("All verses have been skipped (resetting...)");
        this.skippedVerses.clear();
        this.currentVerseIndex = 0;
        const editor = this.plugin.app.workspace.activeEditor?.editor;
        if (editor) this.renderSidebar(editor);
        return;
      }
    } while (this.skippedVerses.has(this.currentVerseIndex));

    new Notice(`Skipped verse (next: ${this.detectedVerses[this.currentVerseIndex].text})`);
    const editor = this.plugin.app.workspace.activeEditor?.editor;
    if (editor) this.renderSidebar(editor);
  }

  // Unskip the current verse
  public unskipCurrentVerse(): void {
    if (this.detectedVerses.length === 0) {
      new Notice("No verses detected");
      return;
    }

    if (this.skippedVerses.has(this.currentVerseIndex)) {
      this.skippedVerses.delete(this.currentVerseIndex);
      new Notice(`Unskipped: ${this.detectedVerses[this.currentVerseIndex].text}`);
      const editor = this.plugin.app.workspace.activeEditor?.editor;
      if (editor) this.renderSidebar(editor);
    } else {
      new Notice(`Current verse is not skipped: ${this.detectedVerses[this.currentVerseIndex].text}`);
    }
  }

  // Reset all skipped verses
  public resetSkippedVerses(): void {
    const count = this.skippedVerses.size;
    this.skippedVerses.clear();
    new Notice(`Reset ${count} skipped verse(s)`);
    const editor = this.plugin.app.workspace.activeEditor?.editor;
    if (editor) this.renderSidebar(editor);
  }

  // Show modal to set manual context
  private showContextModal(editor: Editor): void {
    new ContextModal(this.app, (book, chapter) => {
      this.service.setManualContext(book, chapter);
      this.updateDetectedVerses(editor);
      this.renderSidebar(editor);
      new Notice(`Context set to ${book} ${chapter}`);
    }).open();
  }
}

class ContextModal extends Modal {
  book = '';
  chapter = '';
  onSubmit: (book: string, chapter: string) => void;

  constructor(app: App, onSubmit: (book: string, chapter: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;

    new Setting(contentEl)
      .setName('Set manual context')
      .setHeading();

    contentEl.createEl('p', {
      text: 'Set the book and chapter for incomplete verse references (e.g., "verse 6").',
      cls: 'setting-item-description'
    });

    new Setting(contentEl)
      .setName('Book')
      .setDesc('e.g., Romans, Genesis, 1 Corinthians')
      .addText((text) => text
        .setPlaceholder('Romans')
        .onChange((value: string) => {
          this.book = value;
        }));

    new Setting(contentEl)
      .setName('Chapter')
      .setDesc('Chapter number')
      .addText((text) => text
        .setPlaceholder('8')
        .onChange((value: string) => {
          this.chapter = value;
        }));

    new Setting(contentEl)
      .addButton((btn) => btn
        .setButtonText('Set context')
        .setCta()
        .onClick(() => {
          if (this.book && this.chapter) {
            this.onSubmit(this.book, this.chapter);
            this.close();
          } else {
            new Notice('Please enter both book and chapter');
          }
        }))
      .addButton((btn) => btn
        .setButtonText('Cancel')
        .onClick(() => {
          this.close();
        }));
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
