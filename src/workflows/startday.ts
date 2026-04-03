import { toDateStamp } from "../utils/date";
import { replaceSectionContent, replaceSubsectionContent } from "../utils/markdown";
import { dedupeTasks, sortTasks } from "../utils/tasks";
import type { WorkflowHandler } from "./types";
import { DAILY_NOTES_PATH, ensureDailyNote, extractActiveWorkTasks, resolveOpenDay } from "./common";

export const runStartday: WorkflowHandler = async (ctx, deps) => {
  const today = toDateStamp(ctx.now);
  const open = await resolveOpenDay(deps.vaultService);

  if (open && open.file.basename !== today) {
    return {
      assistantMessage: `Open day detected at \`${open.file.path}\`. Run \`/closeday\` first or close that note manually before starting ${today}.`
    };
  }

  const ensured = await ensureDailyNote(deps.vaultService, ctx.now);
  const targetFile = deps.vaultService.getFileByPath(ensured.path);
  if (!targetFile) {
    return {
      assistantMessage: `Failed to resolve daily note at \`${ensured.path}\`.`
    };
  }

  const before = ensured.content;
  const recentDailyNotes = (await deps.vaultService.getDailyNotes(DAILY_NOTES_PATH))
    .filter((f) => f.path !== targetFile.path)
    .sort((a, b) => b.path.localeCompare(a.path))
    .slice(0, 5);

  const pulledTasks: string[] = [];
  for (const note of recentDailyNotes) {
    const content = await deps.vaultService.readFile(note);
    pulledTasks.push(...extractActiveWorkTasks(content));
  }

  const existingTasks = extractActiveWorkTasks(before);
  const merged = sortTasks(dedupeTasks([...existingTasks, ...pulledTasks]));
  const nextWorkBody = merged.join("\n");

  let after = replaceSubsectionContent(before, "## Tasks", "### Work", nextWorkBody);
  const plan = buildPlan(merged, ctx.now);
  after = replaceSectionContent(after, "## Plan", plan);

  const op = deps.writeStore.make("/startday refresh tasks + plan", targetFile.path, before, after);

  return {
    assistantMessage: `/startday prepared ${targetFile.basename}. Review and apply the pending write.`,
    receipts: [
      `Daily note: ${targetFile.path}`,
      `Pulled tasks: ${pulledTasks.length}`,
      `Active work tasks after dedupe: ${merged.length}`
    ],
    operations: [op]
  };
};

function buildPlan(tasks: string[], now: Date): string {
  const date = toDateStamp(now);
  const must = tasks.filter((task) => task.includes("❗") || task.includes(date)).slice(0, 6);
  const should = tasks.filter((task) => !must.includes(task)).slice(0, 6);

  const mustBody = must.length > 0 ? must.map((t) => `- ${stripTaskPrefix(t)}`).join("\n") : "- None identified";
  const shouldBody = should.length > 0 ? should.map((t) => `- ${stripTaskPrefix(t)}`).join("\n") : "- None identified";

  return `> [!note]- Plan (click to expand)
>
> ### 1. Must-Do
> ${mustBody.replace(/\n/g, "\n> ")}
>
> ### 2. Should-Do
> ${shouldBody.replace(/\n/g, "\n> ")}
>
> ### 3. Could-Do
> - Keep inbox clean with /capture and process suggested tasks before end of day.`;
}

function stripTaskPrefix(taskLine: string): string {
  return taskLine.replace(/^\s*-\s*\[\s\]\s*/, "").trim();
}
