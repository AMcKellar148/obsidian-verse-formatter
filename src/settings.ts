import { App, PluginSettingTab, Setting } from 'obsidian';
import type { AbbreviationStyle } from './sblAbbreviations';
import type VerseFormatter from '../main';

export interface VerseFormatterSettings {
    useCustomTemplate: boolean;
    template: string;
    autoDetect: boolean;
    autoDetectDelay: number;
    maxVerses: number;
    abbreviationStyle: AbbreviationStyle;
    aliasInferredVerses: boolean;
}

export const DEFAULT_SETTINGS: VerseFormatterSettings = {
    useCustomTemplate: false,
    template: "[[{book} {chapter}.{verse}]]",
    autoDetect: true,
    autoDetectDelay: 1000,
    maxVerses: 50,
    abbreviationStyle: 'full',
    aliasInferredVerses: true
}

export class VerseFormatterSettingTab extends PluginSettingTab {
    plugin: VerseFormatter;

    constructor(app: App, plugin: VerseFormatter) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Use custom template')
            .setDesc('Enable to use a custom template for verse links. If disabled, the default formatting (with conditional aliasing) is used.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCustomTemplate)
                .onChange(async (value) => {
                    this.plugin.settings.useCustomTemplate = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.useCustomTemplate) {
            new Setting(containerEl)
                .setName('Link template')
                .setDesc('Available placeholders: {book}, {chapter}, {verse}, {original} (the original text). Example: [[{book} {chapter}:{verse}]]')
                .addText(text => text
                    .setPlaceholder('[[{book} {chapter}.{verse}]]')
                    .setValue(this.plugin.settings.template)
                    .onChange(async (value) => {
                        this.plugin.settings.template = value;
                        await this.plugin.saveSettings();
                    }));
        }

        new Setting(containerEl)
            .setName('Auto-detect verses')
            .setDesc('Automatically detect verses when you stop typing.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoDetect)
                .onChange(async (value) => {
                    this.plugin.settings.autoDetect = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Auto-detect delay (ms)')
            .setDesc('How long to wait after typing before detecting verses (1000ms = 1 second).')
            .addText(text => text
                .setPlaceholder('1000')
                .setValue(String(this.plugin.settings.autoDetectDelay))
                .onChange(async (value) => {
                    const parsed = parseInt(value);
                    if (!isNaN(parsed)) {
                        this.plugin.settings.autoDetectDelay = parsed;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Maximum verses to display')
            .setDesc('Limit the number of verses shown in the detection panel for performance.')
            .addText(text => text
                .setPlaceholder('50')
                .setValue(String(this.plugin.settings.maxVerses))
                .onChange(async (value) => {
                    const parsed = parseInt(value);
                    if (!isNaN(parsed)) {
                        this.plugin.settings.maxVerses = parsed;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Book name style')
            .setDesc('Choose how book names appear in verse links. SBL abbreviations follow academic standards.')
            .addDropdown(dropdown => dropdown
                .addOption('full', 'Full names (e.g., "Genesis", "1 Corinthians")')
                .addOption('sblPrimary', 'SBL primary (e.g., "Gen", "1 Cor")')
                .addOption('sblSecondary', 'SBL secondary (e.g., "Gn", "1 Cor")')
                .setValue(this.plugin.settings.abbreviationStyle)
                .onChange(async (value: AbbreviationStyle) => {
                    this.plugin.settings.abbreviationStyle = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Alias inferred verses')
            .setDesc('When formatting inferred verses (like "verse 6"), use the original text as the alias so the flow of the text is preserved.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.aliasInferredVerses)
                .onChange(async (value) => {
                    this.plugin.settings.aliasInferredVerses = value;
                    await this.plugin.saveSettings();
                }));
    }
}

