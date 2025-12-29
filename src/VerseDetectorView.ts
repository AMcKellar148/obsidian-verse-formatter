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

    versusToShow.forEach((verse) => {
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
}

// Utility to escape special characters in regex
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
