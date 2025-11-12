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
			/* ==== Verse Detector Sidebar ==== */

			/* Verse item buttons, Refresh & Undo buttons */
			.verse-detector-view .verse-item button,
			.verse-detector-view .refresh-button button,
			.verse-detector-view .undo-button button {
			filter: drop-shadow(0 0 2px var(--interactive-accent));
			transition: filter 0.2s ease, transform 0.1s ease;
			}

			/* Glow & scale on hover for all buttons */
			.verse-detector-view .verse-item button:hover,
			.verse-detector-view .refresh-button button:hover,
			.verse-detector-view .undo-button button:hover {
			filter: drop-shadow(0 0 2px var(--interactive-accent));
			transform: scale(1.1);
			}

			/* Soft pulse animation for Refresh & Undo */
			.verse-detector-view .refresh-button button,
			.verse-detector-view .undo-button button {
			animation: softGlow 2.5s ease-in-out infinite alternate;
			}

			@keyframes softGlow {
			from {
				filter: drop-shadow(0 0 2px var(--interactive-accent));
			}
			to {
				filter: drop-shadow(0 0 8px var(--interactive-accent));
			}
			}

			/* Verse list items */
			.verse-detector-view .verse-item {
			display: flex;
			align-items: center;
			gap: 6px;
			margin-bottom: 3px;
			padding: 3px 4px;
			border-radius: 6px;
			transition: background 0.2s ease;
			}

			/* Hover background for verse rows */
			.verse-detector-view .verse-item:hover {
			background-color: var(--background-modifier-hover);
			}

			/* Verse label text */
			.verse-detector-view .verse-item b {
			flex: 1;
			font-weight: 500;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			color: var(--interactive-accent);
			opacity: 0.55;
			cursor: pointer;
			transition: all 0.25s ease;
			}

			/* Hover glow for verse label */
			.verse-detector-view .verse-item b:hover {
			opacity: 1;
			text-shadow: 0 0 8px var(--interactive-accent);
			}

			/* Sidebar header */
			.verse-detector-view h3 {
			color: var(--interactive-accent);
			text-shadow: 0 0 2px var(--interactive-accent);
			font-weight: 400;
			margin-top: 0;
			margin-bottom: 6px;
			text-align: center;
			}

			/* Flash highlight when jumping to verse */
			.verse-highlight {
			background-color: var(--interactive-accent);
			opacity: 0.35;
			animation: verseFlash 1.2s ease-out;
			}

			@keyframes verseFlash {
			0% {
				background-color: var(--interactive-accent);
				opacity: 0.6;
			}
			100% {
				background-color: transparent;
				opacity: 0;
			}
			}

			/* ==== Top Control Row ==== */
			.verse-detector-view .top-controls {
			display: flex;
			justify-content: space-between; /* Undo left, Refresh right */
			align-items: center;
			margin-bottom: 6px;
			padding: 2px 4px;
			}

			/* Button containers inside top-controls */
			.verse-detector-view .top-controls .undo-button,
			.verse-detector-view .top-controls .refresh-button {
			display: flex;
			}

			/* Undo & Refresh buttons glow & pulse (already inherited) */
			.verse-detector-view .top-controls button {
			filter: drop-shadow(0 0 2px var(--interactive-accent));
			transition: filter 0.2s ease, transform 0.1s ease;
			animation: softGlow 2.5s ease-in-out infinite alternate;
			}

			/* Hover glow & scale for top controls */
			.verse-detector-view .top-controls button:hover {
			filter: drop-shadow(0 0 2px var(--interactive-accent));
			transform: scale(1.1);
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
