import type { TFile } from "obsidian";

export const VAULT_AGENT_VIEW_TYPE = "vault-agent-view";

export type ProviderId = "openrouter" | "openai" | "anthropic" | "local";
export type WorkflowKey = "capture" | "startday" | "closeday" | "context-load" | "default";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  raw?: unknown;
}

export interface ModelProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
}

export interface ProviderSettings {
  enabled: boolean;
  baseUrl: string;
  model: string;
  apiKey: string;
  extraHeaders: string;
}

export interface VaultAgentSettings {
  defaultProvider: ProviderId;
  commandPaths: string[];
  writePolicy: "preview_required" | "auto_apply";
  maxSearchResults: number;
  maxContextFiles: number;
  providers: Record<ProviderId, ProviderSettings>;
  routing: Record<WorkflowKey, ProviderId>;
}

export interface CommandDefinition {
  name: string;
  path: string;
  body: string;
  sourceDir: string;
}

export interface PendingWriteOperation {
  id: string;
  reason: string;
  filePath: string;
  before: string;
  after: string;
  status: "pending" | "applied" | "skipped" | "error";
  createdAt: string;
  error?: string;
}

export interface SessionMessage {
  id: string;
  kind: "user" | "assistant" | "tool" | "receipt";
  content: string;
  createdAt: string;
}

export interface SessionState {
  id: string;
  messages: SessionMessage[];
  pendingOperationIds: string[];
  lastUpdatedAt: string;
}

export interface WorkflowContext {
  now: Date;
  input: string;
  args: string;
}

export interface WorkflowResult {
  assistantMessage: string;
  receipts?: string[];
  operations?: PendingWriteOperation[];
}

export interface SearchHit {
  file: TFile;
  score: number;
  snippet: string;
}

export interface ParsedTask {
  raw: string;
  blockId: string | null;
  normalizedText: string;
  priority: number;
  dueDate: string | null;
}
