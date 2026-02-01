import { ItemView, WorkspaceLeaf, ButtonComponent, Notice, debounce, TFile } from "obsidian";
import {
  linkSingleVerse,
  embedSingleVerse,
  linkVerseRange,
  embedVerseRange,
  bibleBooks
} from "./verseFormatter";

import { VerseDetectorService, DetectedVerse } from "./VerseDetectorService";

export class VerseDetectorView extends ItemView {
  plugin: any;
  detectedVerses: DetectedVerse[] = [];
  private service: VerseDetectorService;
  private debouncedUpdate: any;
  private isLocked: boolean = false;
  private lockedFile: TFile | null = null;
  private currentVerseIndex: number = 0;
  private skippedVerses: Set<number> = new Set();

  constructor(leaf: WorkspaceLeaf, plugin: any) {
    super(leaf);
    this.plugin = plugin;
    this.containerEl.addClass("verse-detector-view");
    this.service = new VerseDetectorService();
    this.refreshDebounce();
  }

  refreshDebounce() {
    this.debouncedUpdate = debounce(
      (editor: any) => {
        if (this.plugin.settings.autoDetect) {
          this.updateDetectedVerses(editor);
          this.renderSidebar(editor);
        }
      },
      this.plugin.settings.autoDetectDelay,
      true
    );
  }

  getViewType() { return "verse-detector-view"; }
  getDisplayText() { return "Bible Verse Detector"; }
  getIcon(): string { return "book-open"; }

  async onOpen() {
    this.registerEvent(
      this.app.workspace.on('editor-change', (editor, info) => {
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
    if (!editor) return;

    // Initialize lockedFile if needed (though logic starts unlocked)
    this.renderSidebar(editor);
  }

  async onClose() {
    const container = this.containerEl.children[1];
    container.empty();
  }

  updateDetectedVerses(editor: any) {
    const text = editor.getValue();
    this.detectedVerses = this.service.detectVerses(text);
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

    // 🔹 Header with Refresh and Undo
    const controlsRow = container.createEl("div", { cls: "view-header nav-header" });
    controlsRow.style.display = "flex";
    controlsRow.style.justifyContent = "space-between";
    controlsRow.style.alignItems = "center";
    controlsRow.style.padding = "10px 5px";
    controlsRow.style.marginBottom = "5px";

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
    let displayFileName = "No File";
    if (this.isLocked && this.lockedFile) {
      displayFileName = this.lockedFile.basename;
    } else {
      const activeFile = this.plugin.app.workspace.getActiveFile();
      if (activeFile) displayFileName = activeFile.basename;
    }

    const titleEl = controlsRow.createEl("div", { cls: "view-header-title" });
    titleEl.setText(displayFileName);
    titleEl.style.fontWeight = "bold";
    // titleEl.style.flexGrow = "1";
    // titleEl.style.textAlign = "center";

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
        new Notice("Verse detection refreshed!");
      });
    refreshBtn.buttonEl.addClass("header-icon-btn");

    // Context Control Section
    const manualContext = this.service.getManualContext();
    const contextRow = container.createEl("div", { cls: "context-control-row" });

    contextRow.createEl("span", {
      text: "Context:",
      cls: "context-label"
    });

    const contextValueEl = contextRow.createEl("span", {
      text: manualContext ? `${manualContext.book} ${manualContext.chapter}` : "Auto",
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
      container.createEl("p", { text: "No unformatted Bible references found." });
      return;
    }

    container.createEl("h3", { text: "Detected Bible References" });

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
      let labelText = verse.text;
      if (verse.needsContext && verse.inferredContext) {
        labelText = `${verse.text} (from ${verse.inferredContext})`;
      } else if (verse.needsContext && !verse.inferredContext) {
        labelText = `${verse.text} (⚠️ needs context)`;
      }

      const refLabel = refEl.createEl("b", { text: labelText });
      refLabel.style.cursor = "pointer";

      // Add warning styling for verses needing context
      if (verse.needsContext && !verse.inferredContext) {
        refLabel.style.color = "var(--text-warning)";
      } else if (verse.needsContext) {
        refLabel.style.fontStyle = "italic";
      }

      // Add context menu for skip/unskip
      refLabel.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const menu = new (require('obsidian').Menu)();

        if (isSkipped) {
          menu.addItem((item: any) => {
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
          menu.addItem((item: any) => {
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
        cls: "more-verses-msg"
      }).style.fontStyle = "italic";
    }
  }

  replaceInEditor(editor: any, verse: DetectedVerse, replacement: string) {
    // DEBUG: Check what text is being used
    // new Notice(`Debug: Formatting '${verse.text}' -> '${replacement}'`);

    const startPos = editor.offsetToPos(verse.start);
    const endPos = editor.offsetToPos(verse.end);

    editor.replaceRange(replacement, startPos, endPos);

    const newEndPos = editor.offsetToPos(verse.start + replacement.length);
    editor.setCursor(newEndPos);
    editor.scrollIntoView({ from: startPos, to: newEndPos }, true);

    // Wait for editor to update before refreshing
    setTimeout(() => {
      this.renderSidebar(editor);
    }, 100);

    new Notice(`Formatted: ${verse.text}`);
  }

  // Format the next verse in the list using hotkey
  public formatNextVerse(type: 'link' | 'embed') {
    const editor = this.plugin.app.workspace.activeEditor?.editor;
    if (!editor) {
      new Notice("No active editor found.");
      return;
    }

    if (this.detectedVerses.length === 0) {
      new Notice("No verses detected. Open the sidebar to scan for verses.");
      return;
    }

    // Skip over any skipped verses
    const startIndex = this.currentVerseIndex;
    while (this.skippedVerses.has(this.currentVerseIndex)) {
      this.currentVerseIndex = (this.currentVerseIndex + 1) % this.detectedVerses.length;

      // If we've looped back, all verses are skipped
      if (this.currentVerseIndex === startIndex) {
        new Notice("All verses have been skipped or formatted.");
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

    // Move to next verse (wrap around if at end)
    this.currentVerseIndex = (this.currentVerseIndex + 1) % this.detectedVerses.length;
  }

  // Skip the current verse and move to next
  public skipNextVerse() {
    if (this.detectedVerses.length === 0) {
      new Notice("No verses detected.");
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
        new Notice("All verses have been skipped. Resetting...");
        this.skippedVerses.clear();
        this.currentVerseIndex = 0;
        this.renderSidebar(this.plugin.app.workspace.activeEditor?.editor);
        return;
      }
    } while (this.skippedVerses.has(this.currentVerseIndex));

    new Notice(`Skipped verse. Next: ${this.detectedVerses[this.currentVerseIndex].text}`);
    this.renderSidebar(this.plugin.app.workspace.activeEditor?.editor);
  }

  // Unskip the current verse
  public unskipCurrentVerse() {
    if (this.detectedVerses.length === 0) {
      new Notice("No verses detected.");
      return;
    }

    if (this.skippedVerses.has(this.currentVerseIndex)) {
      this.skippedVerses.delete(this.currentVerseIndex);
      new Notice(`Unskipped: ${this.detectedVerses[this.currentVerseIndex].text}`);
      this.renderSidebar(this.plugin.app.workspace.activeEditor?.editor);
    } else {
      new Notice(`Current verse is not skipped: ${this.detectedVerses[this.currentVerseIndex].text}`);
    }
  }

  // Reset all skipped verses
  public resetSkippedVerses() {
    const count = this.skippedVerses.size;
    this.skippedVerses.clear();
    new Notice(`Reset ${count} skipped verse(s).`);
    this.renderSidebar(this.plugin.app.workspace.activeEditor?.editor);
  }

  // Show modal to set manual context
  private showContextModal(editor: any) {
    const { Modal, Setting } = require('obsidian');

    class ContextModal extends Modal {
      book: string = '';
      chapter: string = '';
      onSubmit: (book: string, chapter: string) => void;

      constructor(app: any, onSubmit: (book: string, chapter: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
      }

      onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h3', { text: 'Set Manual Context' });
        contentEl.createEl('p', {
          text: 'Set the book and chapter for incomplete verse references (e.g., "verse 6").',
          cls: 'setting-item-description'
        });

        new Setting(contentEl)
          .setName('Book')
          .setDesc('e.g., Romans, Genesis, 1 Corinthians')
          .addText((text: any) => text
            .setPlaceholder('Romans')
            .onChange((value: string) => {
              this.book = value;
            }));

        new Setting(contentEl)
          .setName('Chapter')
          .setDesc('Chapter number')
          .addText((text: any) => text
            .setPlaceholder('8')
            .onChange((value: string) => {
              this.chapter = value;
            }));

        new Setting(contentEl)
          .addButton((btn: any) => btn
            .setButtonText('Set Context')
            .setCta()
            .onClick(() => {
              if (this.book && this.chapter) {
                this.onSubmit(this.book, this.chapter);
                this.close();
              } else {
                new (require('obsidian').Notice)('Please enter both book and chapter');
              }
            }))
          .addButton((btn: any) => btn
            .setButtonText('Cancel')
            .onClick(() => {
              this.close();
            }));
      }

      onClose() {
        const { contentEl } = this;
        contentEl.empty();
      }
    }

    new ContextModal(this.plugin.app, (book, chapter) => {
      this.service.setManualContext(book, chapter);
      this.updateDetectedVerses(editor);
      this.renderSidebar(editor);
      new Notice(`Context set to ${book} ${chapter}`);
    }).open();
  }
}

// Utility to escape special characters in regex
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
