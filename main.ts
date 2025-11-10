import { App, ButtonComponent, Editor, ItemView, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { linkSingleVerse, linkVerseRange, embedSingleVerse, embedVerseRange } from './src/verseFormatter';
import { VerseDetectorView } from './src/VerseDetectorView';

const VIEW_TYPE_VERSE = 'verse-detector-view';

export default class VerseFormatter extends Plugin {

	async onload() {
		console.log("📖 Verse Formatter Plugin loaded");

		// Inject CSS dynamically
		const style = document.createElement('style');
		style.textContent = `
		.verse-detector-view .verse-item button svg,
		.verse-detector-view .refresh-button button svg {
			filter: drop-shadow(0 0 2px var(--interactive-accent));
			transition: filter 0.2s ease, transform 0.1s ease;
		}

		.verse-detector-view .verse-item button:hover svg,
		.verse-detector-view .refresh-button button:hover svg {
			filter: drop-shadow(0 0 6px var(--interactive-accent));
			transform: scale(1.1);
		}

		.verse-detector-view .verse-item {
			display: flex;
			align-items: center;
			gap: 4px;
			margin-bottom: 2px;
			padding: 2px 0;
		}

		.verse-detector-view .verse-item b {
			flex: 1;
			font-weight: 500;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			color: var(--interactive-accent);
			opacity: 0.5; /* lighter accent color */
		}

		.verse-detector-view .refresh-button {
			display: flex;
			justify-content: flex-end;
			margin-bottom: 4px;
		}

		.verse-detector-view h3 {
			color: var(--interactive-accent);
			text-shadow: 0 0 1px var(--interactive-accent);
		}
		`;

		document.head.appendChild(style);

		// Register side view
		this.registerView(VIEW_TYPE_VERSE, (leaf) => new VerseDetectorView(leaf, this));

		// Command to open the verse detection pane
		this.addCommand({
			id: "open-verse-detector",
			name: "Detect Bible References",
			callback: () => this.activateView()
		});

		// Ribbon icon
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
					view.updateDetectedVerses(editor);
					view.renderSidebar(editor);
					new Notice("Verse detection refreshed!");
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
				newView.updateDetectedVerses(editor);
				newView.renderSidebar(editor);
			}
		});


		// Link single verse
		this.addCommand({
			id: "link-single-verse",
			name: "Link Single Verse",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection().trim();
				if (!selection) return;
				editor.replaceSelection(linkSingleVerse(selection));
			},
		});

		// Embed single verse
		this.addCommand({
			id: "embed-single-verse",
			name: "Embed Single Verse",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection().trim();
				if (!selection) return;
				editor.replaceSelection(embedSingleVerse(selection));
			},
		});

		// Link verse range
		this.addCommand({
			id: "link-verse-range",
			name: "Link Verse Range",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection().trim();
				if (!selection) return;
				editor.replaceSelection(linkVerseRange(selection));
			},
		});

		// Embed verse range
		this.addCommand({
			id: "embed-verse-range",
			name: "Embed Verse Range",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection().trim();
				if (!selection) return;
				editor.replaceSelection(embedVerseRange(selection));
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
}
