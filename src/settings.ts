import { App, PluginSettingTab, Setting, Plugin } from 'obsidian';

export interface VerseFormatterSettings {
    useCustomTemplate: boolean;
    template: string;
    autoDetect: boolean;
    autoDetectDelay: number;
    maxVerses: number;
}

export const DEFAULT_SETTINGS: VerseFormatterSettings = {
    useCustomTemplate: false,
    template: "[[{book} {chapter}.{verse}]]",
    autoDetect: true,
    autoDetectDelay: 1000,
    maxVerses: 50
}

export class VerseFormatterSettingTab extends PluginSettingTab {
    plugin: any;

    constructor(app: App, plugin: Plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Verse Formatter Settings' });

        new Setting(containerEl)
            .setName('Use Custom Template')
            .setDesc('Enable to use a custom template for verse links. If disabled, the default formatting (with conditional aliasing) is used.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCustomTemplate)
                .onChange(async (value) => {
                    this.plugin.settings.useCustomTemplate = value;
                    await this.plugin.saveSettings();
                    // Force refresh of settings UI to show/hide template field if we wanted to be fancy, 
                    // but for now just letting it stay visible is fine or we can reload.
                    this.display();
                }));

        if (this.plugin.settings.useCustomTemplate) {
            new Setting(containerEl)
                .setName('Link Template')
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
            .setName('Auto-Detect Verses')
            .setDesc('Automatically detect verses when you stop typing.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoDetect)
                .onChange(async (value) => {
                    this.plugin.settings.autoDetect = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Auto-Detect Delay (ms)')
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
            .setName('Maximum Verses to Display')
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
    }
}
