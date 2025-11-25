import { App, PluginSettingTab, Setting, Plugin } from 'obsidian';

export interface VerseFormatterSettings {
    useCustomTemplate: boolean;
    template: string;
}

export const DEFAULT_SETTINGS: VerseFormatterSettings = {
    useCustomTemplate: false,
    template: "[[{book} {chapter}.{verse}]]"
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
    }
}
