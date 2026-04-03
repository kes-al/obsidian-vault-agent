import { replaceSectionContent } from "../utils/markdown";
import type { WorkflowHandler } from "./types";
import { extractCompletedTasks, listSuggestedTasks, listUncheckedTasks, resolveOpenDay } from "./common";

export const runCloseday: WorkflowHandler = async (ctx, deps) => {
  const open = await resolveOpenDay(deps.vaultService);
  if (!open) {
    return {
      assistantMessage: "No open day found. Daily notes already appear closed."
    };
  }

  const targetPath = open.file.path;
  const before = open.content;
  const completed = extractCompletedTasks(before);
  const carryOver = listUncheckedTasks(before);
  const suggested = listSuggestedTasks(before);

  const summary = buildEndOfDaySummary({
    dateLabel: open.file.basename,
    completed,
    carryOver,
    suggested
  });

  const after = replaceSectionContent(before, "## End of Day", summary);
  const op = deps.writeStore.make("/closeday summary", targetPath, before, after);

  return {
    assistantMessage: `/closeday prepared a summary for \`${targetPath}\`. Review and apply the pending write.`,
    receipts: [
      `Completed tasks: ${completed.length}`,
      `Carry-over tasks: ${carryOver.length}`,
      `Suggested tasks awaiting triage: ${suggested.length}`
    ],
    operations: [op]
  };
};

function buildEndOfDaySummary(args: {
  dateLabel: string;
  completed: string[];
  carryOver: string[];
  suggested: string[];
}): string {
  const completedBody = args.completed.length > 0
    ? args.completed.slice(0, 8).map((line) => `- ${line.replace(/^\s*-\s*\[x\]\s*/, "")}`).join("\n")
    : "- No completed tasks were marked.";

  const carryBody = args.carryOver.length > 0
    ? args.carryOver.slice(0, 8).map((line) => `- ${line.replace(/^\s*-\s*\[\s\]\s*/, "")}`).join("\n")
    : "- No open tasks to carry forward.";

  const suggestedBody = args.suggested.length > 0
    ? args.suggested.slice(0, 6).map((line) => `- ${line.replace(/^\s*-\s*\[\s\]\s*/, "")}`).join("\n")
    : "- No suggested tasks waiting.";

  return `### What Got Done
${completedBody}

### Carry-Over Tasks
${carryBody}

### Suggested Tasks Review
${suggestedBody}

### Connections Noticed
- Keep project hub notes fresh for any decisions captured today.
- Promote or clear suggested tasks before the next /startday for cleaner planning.`;
}
