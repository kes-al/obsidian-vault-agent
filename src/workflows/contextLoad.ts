import type { ChatMessage } from "../types";
import type { WorkflowHandler } from "./types";

export const runContextLoad: WorkflowHandler = async (ctx, deps) => {
  const query = ctx.args.trim();
  if (!query) {
    return {
      assistantMessage: "Usage: `/context-load <client|project|topic>`."
    };
  }

  const settings = deps.getSettings();
  const hits = await deps.vaultService.search(query, settings.maxSearchResults);

  if (hits.length === 0) {
    return {
      assistantMessage: `No matching vault context found for "${query}".`
    };
  }

  const top = hits.slice(0, Math.max(1, settings.maxContextFiles));
  const provider = deps.providerFactory.forWorkflow("context-load");

  if (!provider) {
    return {
      assistantMessage: renderFallbackContext(top)
    };
  }

  const contextChunk = top
    .map((hit, i) => `#${i + 1} ${hit.file.path}\n${hit.snippet}`)
    .join("\n\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "You are a concise context briefer for an Obsidian vault. Summarize active context, risks, open items, and next actions."
    },
    {
      role: "user",
      content: `Create a focused context brief for: ${query}\n\nVault excerpts:\n${contextChunk}`
    }
  ];

  try {
    const response = await provider.chat({
      model: settings.providers[settings.routing["context-load"] ?? settings.defaultProvider].model,
      messages,
      temperature: 0.2,
      maxTokens: 1200
    });

    const references = top.map((hit) => `- ${hit.file.path}`).join("\n");
    return {
      assistantMessage: `${response.content.trim()}\n\nReferenced notes:\n${references}`
    };
  } catch (error) {
    return {
      assistantMessage: `${renderFallbackContext(top)}\n\n(LLM summary failed: ${error instanceof Error ? error.message : String(error)})`
    };
  }
};

function renderFallbackContext(topHits: Array<{ file: { path: string }; snippet: string }>): string {
  const lines = topHits.slice(0, 8).map((hit) => `- ${hit.file.path}: ${hit.snippet}`);
  return `Context matches:\n${lines.join("\n")}`;
}
