import { requestUrl } from "obsidian";
import type { ChatRequest, ChatResponse, ModelProvider, ProviderSettings } from "../types";

interface OpenAICompatibleOptions {
  providerName: string;
  settings: ProviderSettings;
}

export class OpenAICompatibleProvider implements ModelProvider {
  private providerName: string;
  private settings: ProviderSettings;

  constructor(options: OpenAICompatibleOptions) {
    this.providerName = options.providerName;
    this.settings = options.settings;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const base = this.settings.baseUrl.replace(/\/$/, "");
    const url = `${base}/chat/completions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...parseHeaderString(this.settings.extraHeaders)
    };

    if (this.settings.apiKey.trim().length > 0) {
      headers.Authorization = `Bearer ${this.settings.apiKey.trim()}`;
    }

    if (this.providerName === "openrouter") {
      headers["HTTP-Referer"] = headers["HTTP-Referer"] ?? "https://obsidian.md";
      headers["X-Title"] = headers["X-Title"] ?? "Vault Agent";
    }

    const payload = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens ?? 1200
    };

    const response = await requestUrl({
      url,
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const json = response.json as Record<string, unknown>;
    const choices = Array.isArray(json.choices) ? json.choices : [];
    const first = (choices[0] ?? {}) as Record<string, unknown>;
    const message = (first.message ?? {}) as Record<string, unknown>;
    const content = typeof message.content === "string" ? message.content : "";

    return {
      content,
      raw: json
    };
  }
}

function parseHeaderString(text: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx <= 0) {
      continue;
    }

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key && value) {
      headers[key] = value;
    }
  }

  return headers;
}
