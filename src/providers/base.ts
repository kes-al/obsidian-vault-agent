import type { VaultAgentSettings, ModelProvider, ProviderId, WorkflowKey } from "../types";

export interface ProviderContext {
  settings: VaultAgentSettings;
}

export interface ProviderFactory {
  forWorkflow(workflow: WorkflowKey): ModelProvider | null;
  forProvider(providerId: ProviderId): ModelProvider | null;
}

export function providerForWorkflow(settings: VaultAgentSettings, workflow: WorkflowKey): ProviderId {
  return settings.routing[workflow] ?? settings.defaultProvider;
}
