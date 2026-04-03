import { ItemView, Notice } from "obsidian";
import type VaultAgentPlugin from "../main";
import { VAULT_AGENT_VIEW_TYPE } from "../types";

export class VaultAgentView extends ItemView {
  plugin: VaultAgentPlugin;
  private messagesEl!: HTMLElement;
  private pendingEl!: HTMLElement;
  private inputEl!: HTMLTextAreaElement;

  constructor(leaf: WorkspaceLeaf, plugin: VaultAgentPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VAULT_AGENT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Vault Agent";
  }

  async onOpen(): Promise<void> {
    this.plugin.attachView(this);
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("vault-agent-view");

    const toolbar = contentEl.createDiv({ cls: "vault-agent-toolbar" });
    this.buildToolbar(toolbar);

    this.messagesEl = contentEl.createDiv({ cls: "vault-agent-messages" });
    this.pendingEl = contentEl.createDiv({ cls: "vault-agent-pending" });

    const composer = contentEl.createDiv({ cls: "vault-agent-composer" });
    this.inputEl = composer.createEl("textarea", {
      cls: "vault-agent-input",
      attr: { placeholder: "Ask Vault Agent or run a command (e.g. /capture ...)" }
    });
    this.inputEl.rows = 3;
    this.inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void this.submitInput();
      }
    });

    const sendBtn = composer.createEl("button", { text: "Send", cls: "mod-cta" });
    sendBtn.onclick = () => void this.submitInput();

    this.render();
  }

  async onClose(): Promise<void> {
    this.plugin.detachView(this);
  }

  render(): void {
    this.renderMessages();
    this.renderPending();
  }

  private buildToolbar(toolbar: HTMLElement): void {
    const openCapture = toolbar.createEl("button", { text: "/capture" });
    openCapture.onclick = () => this.inputEl.value = "/capture ";

    const runStart = toolbar.createEl("button", { text: "/startday" });
    runStart.onclick = async () => this.plugin.runInput("/startday");

    const runClose = toolbar.createEl("button", { text: "/closeday" });
    runClose.onclick = async () => this.plugin.runInput("/closeday");

    const runContext = toolbar.createEl("button", { text: "/context-load" });
    runContext.onclick = () => this.inputEl.value = "/context-load ";

    const refresh = toolbar.createEl("button", { text: "Refresh" });
    refresh.onclick = () => this.render();
  }

  private renderMessages(): void {
    this.messagesEl.empty();
    const messages = this.plugin.getSessionMessages();

    if (messages.length === 0) {
      this.messagesEl.createEl("p", { text: "No messages yet. Run a command or ask a question." });
      return;
    }

    for (const msg of messages) {
      const card = this.messagesEl.createDiv({ cls: `vault-agent-msg vault-agent-msg-${msg.kind}` });
      card.createDiv({ cls: "vault-agent-msg-meta", text: `${msg.kind} • ${new Date(msg.createdAt).toLocaleTimeString()}` });
      card.createEl("pre", { text: msg.content, cls: "vault-agent-msg-body" });
    }
  }

  private renderPending(): void {
    this.pendingEl.empty();
    const pending = this.plugin.getPendingOperations();

    this.pendingEl.createEl("h4", { text: `Pending Writes (${pending.length})` });
    if (pending.length === 0) {
      this.pendingEl.createEl("p", { text: "No pending writes." });
      return;
    }

    for (const op of pending) {
      const card = this.pendingEl.createDiv({ cls: "vault-agent-op-card" });
      card.createDiv({ text: `${op.reason}` });
      card.createDiv({ text: op.filePath, cls: "vault-agent-op-path" });

      const details = card.createEl("details");
      details.createEl("summary", { text: "Preview" });
      details.createEl("pre", { text: formatPreview(op.before, op.after), cls: "vault-agent-op-preview" });

      const controls = card.createDiv({ cls: "vault-agent-op-controls" });
      const applyBtn = controls.createEl("button", { text: "Apply", cls: "mod-cta" });
      applyBtn.onclick = async () => {
        await this.plugin.applyOperation(op.id);
      };

      const skipBtn = controls.createEl("button", { text: "Skip" });
      skipBtn.onclick = async () => {
        await this.plugin.skipOperation(op.id);
      };
    }
  }

  private async submitInput(): Promise<void> {
    const value = this.inputEl.value.trim();
    if (!value) {
      return;
    }

    this.inputEl.value = "";
    try {
      await this.plugin.runInput(value);
    } catch (error) {
      new Notice(`Vault Agent error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function formatPreview(before: string, after: string): string {
  if (before === after) {
    return "No content changes.";
  }
  const previewBefore = before.slice(0, 900);
  const previewAfter = after.slice(0, 900);
  return `--- before ---\n${previewBefore}\n\n--- after ---\n${previewAfter}`;
}

type WorkspaceLeaf = import("obsidian").WorkspaceLeaf;
