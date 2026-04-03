import { requestUrl } from "obsidian";
import type { ChatRequest, ChatResponse, ModelProvider, ProviderSettings } from "../types";

export class AnthropicProvider implements ModelProvider {
  private settings: ProviderSettings;

  constructor(settings: ProviderSettings) {
    this.settings = settings;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const base = this.settings.baseUrl.replace(/\/$/, "");
    const url = `${base}/v1/messages`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01"
    };

    if (this.settings.apiKey.trim().length > 0) {
      headers["x-api-key"] = this.settings.apiKey.trim();
    }

    const systemParts = request.messages.filter((m) => m.role === "system").map((m) => m.content.trim()).filter(Boolean);
    const messages = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

    const payload = {
      model: request.model,
      max_tokens: request.maxTokens ?? 1200,
      temperature: request.temperature ?? 0.3,
      system: systemParts.join("\n\n") || undefined,
      messages
    };

    const response = await requestUrl({
      url,
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const json = response.json as Record<string, unknown>;
    const contentArray = Array.isArray(json.content) ? json.content : [];

    let output = "";
    for (const item of contentArray) {
      const obj = item as Record<string, unknown>;
      if (obj.type === "text" && typeof obj.text === "string") {
        output += obj.text;
      }
    }

    return {
      content: output,
      raw: json
    };
  }
}
