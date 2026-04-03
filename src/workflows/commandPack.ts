import type { ChatMessage } from "../types";
import type { WorkflowHandler } from "./types";

export const runCommandPackCommand: WorkflowHandler = async (ctx, deps) => {
  const match = ctx.input.trim().match(/^\/([a-z0-9-]+)\s*(.*)$/i);
  if (!match) {
    return { assistantMessage: "Not a command invocation." };
  }

  const commandName = match[1];
  const args = match[2] ?? "";
  const settings = deps.getSettings();
  const command = await deps.commandPackService.getCommand(commandName, settings.commandPaths);

  if (!command) {
    return {
      assistantMessage: `Unknown command: /${commandName}`
    };
  }

  const provider = deps.providerFactory.forWorkflow("default");
  if (!provider) {
    return {
      assistantMessage: `Command /${commandName} found at \`${command.path}\`, but no default LLM provider is configured to execute it.`
    };
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "You are executing a vault command spec. Follow instruction intent but do not fabricate file writes. If writes are needed, clearly propose the exact change."
    },
    {
      role: "user",
      content: `Command file: ${command.path}\n\nCommand spec:\n${command.body}\n\nArguments:\n${args || "(none)"}`
    }
  ];

  try {
    const providerId = settings.routing.default ?? settings.defaultProvider;
    const model = settings.providers[providerId].model;
    const response = await provider.chat({
      model,
      messages,
      temperature: 0.2,
      maxTokens: 1200
    });

    return {
      assistantMessage: response.content.trim() || `Command /${commandName} completed with no output.`
    };
  } catch (error) {
    return {
      assistantMessage: `Command /${commandName} failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
