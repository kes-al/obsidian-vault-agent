import type { WorkflowContext, WorkflowResult } from "../types";
import { runCapture } from "../workflows/capture";
import { runCloseday } from "../workflows/closeday";
import { runCommandPackCommand } from "../workflows/commandPack";
import { runContextLoad } from "../workflows/contextLoad";
import { runPlainChat } from "../workflows/plainChat";
import { runStartday } from "../workflows/startday";
import type { WorkflowDeps, WorkflowHandler } from "../workflows/types";

const BUILTIN_COMMANDS: Record<string, WorkflowHandler> = {
  capture: runCapture,
  startday: runStartday,
  closeday: runCloseday,
  "context-load": runContextLoad
};

export class WorkflowRouter {
  async runInput(input: string, deps: WorkflowDeps): Promise<WorkflowResult> {
    const trimmed = input.trim();
    const ctx: WorkflowContext = {
      now: new Date(),
      input: trimmed,
      args: extractArgs(trimmed)
    };

    if (trimmed.startsWith("/")) {
      const command = extractCommand(trimmed);
      const builtin = BUILTIN_COMMANDS[command];
      if (builtin) {
        return builtin(ctx, deps);
      }

      return runCommandPackCommand(ctx, deps);
    }

    return runPlainChat(ctx, deps);
  }
}

function extractCommand(input: string): string {
  const match = input.match(/^\/([a-z0-9-]+)/i);
  return match ? match[1].toLowerCase() : "";
}

function extractArgs(input: string): string {
  const match = input.match(/^\/[a-z0-9-]+\s*(.*)$/i);
  return match ? (match[1] ?? "").trim() : input;
}
