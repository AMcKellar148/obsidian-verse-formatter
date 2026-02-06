import { Editor, Notice, Plugin } from 'obsidian';
import { VerseDetectorView, VIEW_TYPE_VERSE } from './src/VerseDetectorView';
import { VerseFormatterSettings, DEFAULT_SETTINGS, VerseFormatterSettingTab } from './src/settings';
import { linkSingleVerse, embedSingleVerse, linkVerseRange, embedVerseRange } from './src/verseFormatter';

export default class VerseFormatter extends Plugin {
	settings: VerseFormatterSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Register side view
		this.registerView(VIEW_TYPE_VERSE, (leaf) => {
			return new VerseDetectorView(leaf, this);
		});

		// Command to open the verse detection pane
		this.addCommand({
			id: "open-verse-detector",
			name: "Detect bible references",
			callback: () => {
				void this.activateView();
			}
		});

		// Ribbon icon
		this.addRibbonIcon('book-open', 'Detect verses', async (_evt: MouseEvent) => {
			// Check for existing detector view
			const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_VERSE)[0];

			if (existingLeaf) {
				// Reveal existing leaf
				this.app.workspace.revealLeaf(existingLeaf);

				// Refresh its detection
				const view = existingLeaf.view;
				const editor = this.app.workspace.activeEditor?.editor;
				if (view instanceof VerseDetectorView && editor) {
					view.updateDetectedVerses(editor);
					view.renderSidebar(editor);
					new Notice("Verse detection refreshed");
				}

				return;
			}

			// Otherwise, create a new leaf
			let leaf = this.app.workspace.getRightLeaf(false);
			if (!leaf) {
				leaf = this.app.workspace.getRightLeaf(true);
				if (!leaf) return;
			}

			await leaf.setViewState({ type: VIEW_TYPE_VERSE, active: true });
			this.app.workspace.revealLeaf(leaf);

			// Refresh detection for the new view
			const newView = leaf.view;
			const editor = this.app.workspace.activeEditor?.editor;
			if (editor && newView instanceof VerseDetectorView) {
				newView.updateDetectedVerses(editor);
				newView.renderSidebar(editor);
			}
		});

		// Add Settings Tab
		this.addSettingTab(new VerseFormatterSettingTab(this.app, this));

		// Link single verse
		this.addCommand({
			id: "link-single-verse",
			name: "Link single verse",
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection().trim();
				if (!selection) return;
				editor.replaceSelection(linkSingleVerse(selection, this.settings));
			},
		});

		// Embed single verse
		this.addCommand({
			id: "embed-single-verse",
			name: "Embed single verse",
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection().trim();
				if (!selection) return;
				editor.replaceSelection(embedSingleVerse(selection, this.settings));
			},
		});

		// Link verse range
		this.addCommand({
			id: "link-verse-range",
			name: "Link verse range",
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection().trim();
				if (!selection) return;
				editor.replaceSelection(linkVerseRange(selection, this.settings));
			},
		});

		// Embed verse range
		this.addCommand({
			id: "embed-verse-range",
			name: "Embed verse range",
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection().trim();
				if (!selection) return;
				editor.replaceSelection(embedVerseRange(selection, this.settings));
			},
		});

		// Link next verse (hotkey)
		this.addCommand({
			id: "link-next-verse",
			name: "Format next verse (link)",
			callback: () => {
				const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_VERSE)[0];
				if (!existingLeaf) {
					new Notice("Please open the verse detector sidebar first");
					return;
				}
				const view = existingLeaf.view;
				if (view instanceof VerseDetectorView) {
					void view.formatNextVerse('link');
				}
			},
		});

		// Embed next verse (hotkey)
		this.addCommand({
			id: "embed-next-verse",
			name: "Format next verse (embed)",
			callback: () => {
				const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_VERSE)[0];
				if (!existingLeaf) {
					new Notice("Please open the verse detector sidebar first");
					return;
				}
				const view = existingLeaf.view;
				if (view instanceof VerseDetectorView) {
					void view.formatNextVerse('embed');
				}
			},
		});

		// Skip next verse (hotkey)
		this.addCommand({
			id: "skip-next-verse",
			name: "Skip next verse",
			callback: () => {
				const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_VERSE)[0];
				if (!existingLeaf) {
					new Notice("Please open the verse detector sidebar first");
					return;
				}
				const view = existingLeaf.view;
				if (view instanceof VerseDetectorView) {
					view.skipNextVerse();
				}
			},
		});

		// Unskip current verse
		this.addCommand({
			id: "unskip-current-verse",
			name: "Unskip current verse",
			callback: () => {
				const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_VERSE)[0];
				if (!existingLeaf) {
					new Notice("Please open the verse detector sidebar first");
					return;
				}
				const view = existingLeaf.view;
				if (view instanceof VerseDetectorView) {
					view.unskipCurrentVerse();
				}
			},
		});

		// Reset all skipped verses
		this.addCommand({
			id: "reset-skipped-verses",
			name: "Reset all skipped verses",
			callback: () => {
				const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_VERSE)[0];
				if (!existingLeaf) {
					new Notice("Please open the verse detector sidebar first");
					return;
				}
				const view = existingLeaf.view;
				if (view instanceof VerseDetectorView) {
					view.resetSkippedVerses();
				}
			},
		});
	}

	async activateView(): Promise<void> {
		// Check if a leaf with our view type already exists
		const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_VERSE)[0];

		if (existingLeaf) {
			// If it exists, just reveal it
			this.app.workspace.revealLeaf(existingLeaf);
			return;
		}

		// Otherwise, create a new right leaf
		let leaf = this.app.workspace.getRightLeaf(false);
		if (!leaf) {
			leaf = this.app.workspace.getRightLeaf(true);
			if (!leaf) return;
		}

		await leaf.setViewState({ type: VIEW_TYPE_VERSE, active: true });
		this.app.workspace.revealLeaf(leaf);
	}

	onunload(): void {
		// Don't detach leaves in onunload to preserve user layout
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}

