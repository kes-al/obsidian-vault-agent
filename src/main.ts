import { Notice, Plugin } from "obsidian";
import { WorkflowRouter } from "./engine/router";
import { ModelProviderFactory } from "./providers/factory";
import { CommandPackService } from "./services/commandPackService";
import { VaultService } from "./services/vaultService";
import { WriteOperationStore } from "./services/writeOperationStore";
import { DEFAULT_SETTINGS } from "./state/settings";
import { SessionStore } from "./state/sessionStore";
import { PromptModal } from "./ui/promptModal";
import { VaultAgentSettingTab } from "./ui/settingsTab";
import { VaultAgentView } from "./ui/vaultAgentView";
import { VAULT_AGENT_VIEW_TYPE, type PendingWriteOperation, type SessionMessage, type VaultAgentSettings } from "./types";
import type { WorkflowDeps } from "./workflows/types";

export default class VaultAgentPlugin extends Plugin {
  settings: VaultAgentSettings = structuredClone(DEFAULT_SETTINGS);

  private sessionStore!: SessionStore;
  private vaultService!: VaultService;
  private commandPackService!: CommandPackService;
  private writeStore!: WriteOperationStore;
  private providerFactory!: ModelProviderFactory;
  private router!: WorkflowRouter;
  private activeView: VaultAgentView | null = null;

  async onload(): Promise<void> {
    await this.loadPluginSettings();

    this.sessionStore = new SessionStore();
    this.vaultService = new VaultService(this.app);
    this.commandPackService = new CommandPackService(this.vaultService);
    this.writeStore = new WriteOperationStore(this.vaultService);
    this.providerFactory = new ModelProviderFactory(this.settings);
    this.router = new WorkflowRouter();

    this.registerView(
      VAULT_AGENT_VIEW_TYPE,
      (leaf) => new VaultAgentView(leaf, this)
    );

    this.addRibbonIcon("bot", "Open Vault Agent", () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open-vault-agent",
      name: "Open Vault Agent workspace",
      callback: () => {
        void this.activateView();
      }
    });

    this.addCommand({
      id: "run-startday",
      name: "Vault Agent: /startday",
      callback: () => void this.runInput("/startday")
    });

    this.addCommand({
      id: "run-closeday",
      name: "Vault Agent: /closeday",
      callback: () => void this.runInput("/closeday")
    });

    this.addCommand({
      id: "run-capture",
      name: "Vault Agent: /capture (prompt)",
      callback: () => {
        new PromptModal(this.app, "Vault Agent /capture", "task Follow up on...", (value) => {
          if (!value) {
            return;
          }
          void this.runInput(`/capture ${value}`);
        }).open();
      }
    });

    this.addCommand({
      id: "run-context-load",
      name: "Vault Agent: /context-load (prompt)",
      callback: () => {
        new PromptModal(this.app, "Vault Agent /context-load", "client or project", (value) => {
          if (!value) {
            return;
          }
          void this.runInput(`/context-load ${value}`);
        }).open();
      }
    });

    this.addCommand({
      id: "apply-all-pending-writes",
      name: "Vault Agent: Apply all pending writes",
      callback: () => void this.applyAllPending()
    });

    this.addSettingTab(new VaultAgentSettingTab(this.app, this));

    const rerender = () => this.activeView?.render();
    this.sessionStore.subscribe(rerender);
    this.writeStore.subscribe(rerender);
  }

  async onunload(): Promise<void> {
    this.app.workspace.detachLeavesOfType(VAULT_AGENT_VIEW_TYPE);
  }

  attachView(view: VaultAgentView): void {
    this.activeView = view;
  }

  detachView(view: VaultAgentView): void {
    if (this.activeView === view) {
      this.activeView = null;
    }
  }

  async persistSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.providerFactory.updateSettings(this.settings);
    this.activeView?.render();
  }

  getSessionMessages(): SessionMessage[] {
    return this.sessionStore.getActive().messages;
  }

  getPendingOperations(): PendingWriteOperation[] {
    const sessionIds = new Set(this.sessionStore.getActive().pendingOperationIds);
    return this.writeStore.listPending().filter((op) => sessionIds.has(op.id));
  }

  async runInput(input: string): Promise<void> {
    const text = input.trim();
    if (!text) {
      return;
    }

    this.sessionStore.addMessage("user", text);
    const result = await this.router.runInput(text, this.workflowDeps());

    if (result.operations && result.operations.length > 0) {
      this.writeStore.queue(result.operations);
      this.sessionStore.addOperations(result.operations);

      if (this.settings.writePolicy === "auto_apply") {
        for (const op of result.operations) {
          await this.applyOperation(op.id);
        }
      }
    }

    this.sessionStore.addMessage("assistant", result.assistantMessage);
    for (const receipt of result.receipts ?? []) {
      this.sessionStore.addMessage("receipt", receipt);
    }
  }

  async applyOperation(operationId: string): Promise<void> {
    const result = await this.writeStore.apply(operationId);
    this.sessionStore.removeOperation(operationId);

    if (result.status === "applied") {
      this.sessionStore.addMessage("tool", `Applied write: ${result.filePath}`);
      new Notice(`Vault Agent applied changes to ${result.filePath}`);
      return;
    }

    this.sessionStore.addMessage("tool", `Failed write: ${result.filePath} (${result.error ?? "unknown error"})`);
    new Notice(`Vault Agent failed to apply ${result.filePath}`);
  }

  async skipOperation(operationId: string): Promise<void> {
    const op = this.writeStore.skip(operationId);
    this.sessionStore.removeOperation(operationId);
    this.sessionStore.addMessage("tool", `Skipped write: ${op.filePath}`);
  }

  private async applyAllPending(): Promise<void> {
    const pending = this.getPendingOperations();
    if (pending.length === 0) {
      new Notice("Vault Agent: no pending writes.");
      return;
    }

    for (const op of pending) {
      await this.applyOperation(op.id);
    }
  }

  private workflowDeps(): WorkflowDeps {
    return {
      vaultService: this.vaultService,
      commandPackService: this.commandPackService,
      writeStore: this.writeStore,
      providerFactory: this.providerFactory,
      getSettings: () => this.settings
    };
  }

  private async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VAULT_AGENT_VIEW_TYPE)[0];

    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({
        type: VAULT_AGENT_VIEW_TYPE,
        active: true
      });
    }

    workspace.revealLeaf(leaf);
  }

  private async loadPluginSettings(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<VaultAgentSettings> | null;
    this.settings = deepMergeSettings(structuredClone(DEFAULT_SETTINGS), loaded ?? {});
  }
}

function deepMergeSettings(base: VaultAgentSettings, patch: Partial<VaultAgentSettings>): VaultAgentSettings {
  const out = structuredClone(base);

  if (patch.defaultProvider) {
    out.defaultProvider = patch.defaultProvider;
  }
  if (patch.commandPaths) {
    out.commandPaths = patch.commandPaths;
  }
  if (patch.writePolicy) {
    out.writePolicy = patch.writePolicy;
  }
  if (typeof patch.maxSearchResults === "number") {
    out.maxSearchResults = patch.maxSearchResults;
  }
  if (typeof patch.maxContextFiles === "number") {
    out.maxContextFiles = patch.maxContextFiles;
  }

  if (patch.providers) {
    for (const [key, value] of Object.entries(patch.providers)) {
      const providerKey = key as keyof VaultAgentSettings["providers"];
      out.providers[providerKey] = {
        ...out.providers[providerKey],
        ...value
      };
    }
  }

  if (patch.routing) {
    for (const [key, value] of Object.entries(patch.routing)) {
      const workflow = key as keyof VaultAgentSettings["routing"];
      out.routing[workflow] = value as VaultAgentSettings["routing"][typeof workflow];
    }
  }

  return out;
}
