import type { VaultAgentSettings } from "../types";

export const DEFAULT_SETTINGS: VaultAgentSettings = {
  defaultProvider: "local",
  commandPaths: [".vault-agent/commands", ".claude/commands"],
  writePolicy: "preview_required",
  maxSearchResults: 25,
  maxContextFiles: 8,
  providers: {
    openrouter: {
      enabled: false,
      baseUrl: "https://openrouter.ai/api/v1",
      model: "openrouter/free",
      apiKey: "",
      extraHeaders: ""
    },
    openai: {
      enabled: false,
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4.1-mini",
      apiKey: "",
      extraHeaders: ""
    },
    anthropic: {
      enabled: false,
      baseUrl: "https://api.anthropic.com",
      model: "claude-3-7-sonnet-latest",
      apiKey: "",
      extraHeaders: ""
    },
    local: {
      enabled: true,
      baseUrl: "http://127.0.0.1:8080/v1",
      model: "ggml-org/gemma-4-26B-A4B-it-GGUF:Q4_K_M",
      apiKey: "",
      extraHeaders: ""
    }
  },
  routing: {
    capture: "local",
    startday: "local",
    closeday: "local",
    "context-load": "local",
    default: "local"
  }
};
