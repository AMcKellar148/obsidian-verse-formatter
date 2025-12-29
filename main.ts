import { App, ButtonComponent, Editor, ItemView, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import type { VerseDetectorView } from './src/VerseDetectorView';

import { VerseFormatterSettings, DEFAULT_SETTINGS, VerseFormatterSettingTab } from './src/settings';

const VIEW_TYPE_VERSE = 'verse-detector-view';

export default class VerseFormatter extends Plugin {
	settings: VerseFormatterSettings;

	async onload() {
		console.log("📖 Verse Formatter Plugin loaded");

		await this.loadSettings();

		// Register side view
		this.registerView(VIEW_TYPE_VERSE, (leaf) => {
			const { VerseDetectorView } = require('./src/VerseDetectorView');
			return new VerseDetectorView(leaf, this);
		});

		// Command to open the verse detection pane
		this.addCommand({
			id: "open-verse-detector",
			name: "Detect Bible References",
			callback: () => this.activateView()
		});

		// Ribbon icon
		const ribbonIconEl = this.addRibbonIcon('book-open', 'Detect Verses', async (_evt: MouseEvent) => {
			// Check for existing detector view
			const existingLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_VERSE)[0];

			if (existingLeaf) {
				// Reveal existing leaf
				this.app.workspace.revealLeaf(existingLeaf);

				// Refresh its detection
				const view = existingLeaf.view as VerseDetectorView;
				const editor = this.app.workspace.activeEditor?.editor;
				if (view && editor) {
					// eslint-disable-next-line @typescript-eslint/no-var-requires
					// const { VerseDetectorView } = require('./src/VerseDetectorView'); 
					// We don't need to re-require for the instance method, but we cast it. 
					// Ideally methods are available on the view object. 
					if (typeof (view as any).updateDetectedVerses === 'function') {
						(view as any).updateDetectedVerses(editor);
						(view as any).renderSidebar(editor);
						new Notice("Verse detection refreshed!");
					}
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
			const newView = leaf.view as VerseDetectorView;
			const editor = this.app.workspace.activeEditor?.editor;
			if (editor) {
				if (typeof (newView as any).updateDetectedVerses === 'function') {
					(newView as any).updateDetectedVerses(editor);
					(newView as any).renderSidebar(editor);
				}
			}
		});

		// Add Settings Tab
		this.addSettingTab(new VerseFormatterSettingTab(this.app, this));

		// Link single verse
		this.addCommand({
			id: "link-single-verse",
			name: "Link Single Verse",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection().trim();
				if (!selection) return;
				const { linkSingleVerse } = require('./src/verseFormatter');
				editor.replaceSelection(linkSingleVerse(selection, this.settings));
			},
		});

		// Embed single verse
		this.addCommand({
			id: "embed-single-verse",
			name: "Embed Single Verse",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection().trim();
				if (!selection) return;
				const { embedSingleVerse } = require('./src/verseFormatter');
				editor.replaceSelection(embedSingleVerse(selection, this.settings));
			},
		});

		// Link verse range
		this.addCommand({
			id: "link-verse-range",
			name: "Link Verse Range",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection().trim();
				if (!selection) return;
				const { linkVerseRange } = require('./src/verseFormatter');
				editor.replaceSelection(linkVerseRange(selection, this.settings));
			},
		});

		// Embed verse range
		this.addCommand({
			id: "embed-verse-range",
			name: "Embed Verse Range",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection().trim();
				if (!selection) return;
				const { embedVerseRange } = require('./src/verseFormatter');
				editor.replaceSelection(embedVerseRange(selection, this.settings));
			},
		});
	}

	async activateView() {
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


	onunload() {
		console.log("📖 Verse Formatter Plugin unloaded");
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_VERSE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
