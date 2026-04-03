import type { ModelProvider, ProviderId, VaultAgentSettings, WorkflowKey } from "../types";
import { AnthropicProvider } from "./anthropic";
import { OpenAICompatibleProvider } from "./openaiCompatible";

export class ModelProviderFactory {
  private settings: VaultAgentSettings;

  constructor(settings: VaultAgentSettings) {
    this.settings = settings;
  }

  updateSettings(settings: VaultAgentSettings): void {
    this.settings = settings;
  }

  forWorkflow(workflow: WorkflowKey): ModelProvider | null {
    const providerId = this.settings.routing[workflow] ?? this.settings.defaultProvider;
    return this.forProvider(providerId);
  }

  forProvider(providerId: ProviderId): ModelProvider | null {
    const config = this.settings.providers[providerId];
    if (!config || !config.enabled) {
      return null;
    }

    if (providerId === "anthropic") {
      return new AnthropicProvider(config);
    }

    return new OpenAICompatibleProvider({
      providerName: providerId,
      settings: config
    });
  }
}
