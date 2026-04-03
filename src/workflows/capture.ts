import { addDays, isLikelyDate, toDateStamp } from "../utils/date";
import { appendToSection } from "../utils/markdown";
import { nextBlockId } from "../utils/tasks";
import type { WorkflowHandler } from "./types";
import { ensureDailyNote, resolveOpenDay } from "./common";

type CaptureKind = "task" | "idea" | "observation";

export const runCapture: WorkflowHandler = async (ctx, deps) => {
  const rawArgs = ctx.args.trim();
  if (!rawArgs) {
    return {
      assistantMessage: "Usage: `/capture [task|idea] <text>` or `/capture <text>`."
    };
  }

  const kind = detectKind(rawArgs);
  const payload = stripKindPrefix(rawArgs);

  const open = await resolveOpenDay(deps.vaultService);
  const target = open ?? (await (async () => {
    const ensured = await ensureDailyNote(deps.vaultService, ctx.now);
    return { file: deps.vaultService.getFileByPath(ensured.path)!, content: ensured.content };
  })());

  const targetPath = target.file.path;
  const before = target.content;
  const taskId = nextBlockId(before, ctx.now);
  const due = findExplicitDate(payload) ?? toDateStamp(addDays(ctx.now, 1));

  const entry = buildEntry(kind, payload, due, taskId);
  const after = kind === "task"
    ? appendToSection(before, "## Tasks", entry, "### Work")
    : kind === "idea"
      ? appendToSection(before, "## Ideas", entry)
      : appendToSection(before, "## Work Log", entry);

  const op = deps.writeStore.make(`/capture (${kind})`, targetPath, before, after);

  return {
    assistantMessage: `Captured as ${kind} in \`${targetPath}\`. Review and apply the pending write to save it.`,
    receipts: [
      `Type: ${kind}`,
      `Destination: ${targetPath}`,
      `Content: ${entry}`
    ],
    operations: [op]
  };
};

function detectKind(input: string): CaptureKind {
  const lower = input.toLowerCase().trim();
  if (lower.startsWith("task ")) {
    return "task";
  }
  if (lower.startsWith("idea ")) {
    return "idea";
  }

  if (/\b(need to|follow up|send|review|schedule|todo|to-do|action item|must|should)\b/.test(lower)) {
    return "task";
  }
  if (/\b(maybe|what if|i wonder|could we)\b/.test(lower)) {
    return "idea";
  }
  return "observation";
}

function stripKindPrefix(input: string): string {
  return input.replace(/^(task|idea)\s+/i, "").trim();
}

function findExplicitDate(input: string): string | null {
  for (const token of input.split(/\s+/)) {
    if (isLikelyDate(token)) {
      return token;
    }
  }
  return null;
}

function buildEntry(kind: CaptureKind, payload: string, dueDate: string, blockId: string): string {
  if (kind === "task") {
    const urgent = /\b(urgent|asap|blocker|today)\b/i.test(payload);
    const marker = urgent ? "❗" : "🔼";
    return `- [ ] ${marker} ${dueDate} ${payload} ${blockId}`.replace(/\s+/g, " ").trim();
  }

  if (kind === "idea") {
    const withTag = payload.includes("#idea") ? payload : `${payload} #idea`;
    return `- ${withTag}`.trim();
  }

  return `- ${payload}`.trim();
}
