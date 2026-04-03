import type { ChatMessage } from "../types";
import type { WorkflowHandler } from "./types";

export const runPlainChat: WorkflowHandler = async (ctx, deps) => {
  const query = ctx.input.trim();
  if (!query) {
    return { assistantMessage: "Say something or run a slash command." };
  }

  const settings = deps.getSettings();
  const provider = deps.providerFactory.forWorkflow("default");
  if (!provider) {
    return {
      assistantMessage: "No enabled LLM provider for default chat. Configure one in Vault Agent settings."
    };
  }

  const contextHits = await deps.vaultService.search(query, Math.min(6, settings.maxContextFiles));
  const contextText = contextHits
    .slice(0, 6)
    .map((hit) => `- ${hit.file.path}: ${hit.snippet}`)
    .join("\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "You are Vault Agent inside Obsidian. Be concise, actionable, and preserve markdown formatting."
    },
    {
      role: "user",
      content: `User query:\n${query}\n\nRelevant vault excerpts:\n${contextText || "- none"}.`
    }
  ];

  try {
    const providerId = settings.routing.default ?? settings.defaultProvider;
    const model = settings.providers[providerId].model;
    const result = await provider.chat({
      model,
      messages,
      temperature: 0.3,
      maxTokens: 1000
    });

    return {
      assistantMessage: result.content.trim() || "No response generated."
    };
  } catch (error) {
    return {
      assistantMessage: `Chat failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
