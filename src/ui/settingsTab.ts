import { PluginSettingTab, Setting } from "obsidian";
import type VaultAgentPlugin from "../main";
import type { ProviderId, WorkflowKey } from "../types";

const WORKFLOW_KEYS: WorkflowKey[] = ["capture", "startday", "closeday", "context-load", "default"];
const PROVIDERS: ProviderId[] = ["local", "openrouter", "openai", "anthropic"];

export class VaultAgentSettingTab extends PluginSettingTab {
  plugin: VaultAgentPlugin;

  constructor(app: App, plugin: VaultAgentPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Vault Agent Settings" });

    new Setting(containerEl)
      .setName("Default provider")
      .setDesc("Used when workflow routing is not explicitly set.")
      .addDropdown((dropdown) => {
        for (const provider of PROVIDERS) {
          dropdown.addOption(provider, provider);
        }
        dropdown.setValue(this.plugin.settings.defaultProvider);
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultProvider = value as ProviderId;
          await this.plugin.persistSettings();
        });
      });

    new Setting(containerEl)
      .setName("Write policy")
      .setDesc("Preview writes before apply, or auto-apply all generated writes.")
      .addDropdown((dropdown) => {
        dropdown.addOption("preview_required", "preview_required");
        dropdown.addOption("auto_apply", "auto_apply");
        dropdown.setValue(this.plugin.settings.writePolicy);
        dropdown.onChange(async (value) => {
          this.plugin.settings.writePolicy = value as "preview_required" | "auto_apply";
          await this.plugin.persistSettings();
        });
      });

    new Setting(containerEl)
      .setName("Command paths")
      .setDesc("One path per line. Commands are loaded from these vault folders.")
      .addTextArea((area) => {
        area.setPlaceholder(".vault-agent/commands\n.claude/commands");
        area.setValue(this.plugin.settings.commandPaths.join("\n"));
        area.onChange(async (value) => {
          this.plugin.settings.commandPaths = value
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
          await this.plugin.persistSettings();
        });
      });

    containerEl.createEl("h3", { text: "Workflow Routing" });
    for (const workflow of WORKFLOW_KEYS) {
      new Setting(containerEl)
        .setName(workflow)
        .addDropdown((dropdown) => {
          for (const provider of PROVIDERS) {
            dropdown.addOption(provider, provider);
          }
          dropdown.setValue(this.plugin.settings.routing[workflow]);
          dropdown.onChange(async (value) => {
            this.plugin.settings.routing[workflow] = value as ProviderId;
            await this.plugin.persistSettings();
          });
        });
    }

    containerEl.createEl("h3", { text: "Provider Configuration" });
    for (const provider of PROVIDERS) {
      this.renderProviderSection(containerEl, provider);
    }
  }

  private renderProviderSection(container: HTMLElement, provider: ProviderId): void {
    const config = this.plugin.settings.providers[provider];
    container.createEl("h4", { text: provider });

    new Setting(container)
      .setName("Enabled")
      .addToggle((toggle) => {
        toggle.setValue(config.enabled);
        toggle.onChange(async (value) => {
          config.enabled = value;
          await this.plugin.persistSettings();
        });
      });

    new Setting(container)
      .setName("Base URL")
      .addText((text) => {
        text.setPlaceholder("https://api.example.com/v1");
        text.setValue(config.baseUrl);
        text.onChange(async (value) => {
          config.baseUrl = value.trim();
          await this.plugin.persistSettings();
        });
      });

    new Setting(container)
      .setName("Model")
      .addText((text) => {
        text.setPlaceholder("model-name");
        text.setValue(config.model);
        text.onChange(async (value) => {
          config.model = value.trim();
          await this.plugin.persistSettings();
        });
      });

    new Setting(container)
      .setName("API Key")
      .setDesc("Stored in plugin data for this vault.")
      .addText((text) => {
        text.inputEl.type = "password";
        text.setPlaceholder("sk-...");
        text.setValue(config.apiKey);
        text.onChange(async (value) => {
          config.apiKey = value.trim();
          await this.plugin.persistSettings();
        });
      });

    new Setting(container)
      .setName("Extra Headers")
      .setDesc("Format: Header-Name: value (one per line)")
      .addTextArea((area) => {
        area.setPlaceholder("X-My-Header: value");
        area.setValue(config.extraHeaders ?? "");
        area.onChange(async (value) => {
          config.extraHeaders = value;
          await this.plugin.persistSettings();
        });
      });
  }
}

type App = import("obsidian").App;
