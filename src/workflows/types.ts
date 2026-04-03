import type { VaultAgentSettings, WorkflowContext, WorkflowResult } from "../types";
import { CommandPackService } from "../services/commandPackService";
import { VaultService } from "../services/vaultService";
import { WriteOperationStore } from "../services/writeOperationStore";
import { ModelProviderFactory } from "../providers/factory";

export interface WorkflowDeps {
  vaultService: VaultService;
  commandPackService: CommandPackService;
  writeStore: WriteOperationStore;
  providerFactory: ModelProviderFactory;
  getSettings: () => VaultAgentSettings;
}

export type WorkflowHandler = (ctx: WorkflowContext, deps: WorkflowDeps) => Promise<WorkflowResult>;
