import type { TFile } from "obsidian";
import { VaultService } from "../services/vaultService";
import { getSectionBody, isSectionEmpty } from "../utils/markdown";
import { toDateStamp } from "../utils/date";

export const DAILY_NOTES_PATH = "daily-notes";
export const DAILY_TEMPLATE_PATH = "templates/daily-note.md";

export async function resolveOpenDay(vaultService: VaultService): Promise<{ file: TFile; content: string } | null> {
  const dailyFiles = await vaultService.getDailyNotes(DAILY_NOTES_PATH);
  const sorted = [...dailyFiles].sort((a, b) => b.path.localeCompare(a.path));

  for (const file of sorted) {
    const content = await vaultService.readFile(file);
    if (isOpenDayContent(content)) {
      return { file, content };
    }
  }

  return null;
}

export async function ensureDailyNote(vaultService: VaultService, date: Date): Promise<{ path: string; content: string; existed: boolean }> {
  const path = `${DAILY_NOTES_PATH}/${toDateStamp(date)}.md`;
  const existing = vaultService.getFileByPath(path);
  if (existing) {
    const content = await vaultService.readFile(existing);
    return { path, content, existed: true };
  }

  let template = await vaultService.read(DAILY_TEMPLATE_PATH);
  if (!template.trim()) {
    const stamp = toDateStamp(date);
    template = defaultDailyTemplate(stamp);
  } else {
    template = template
      .replace(/{{date}}/g, toDateStamp(date))
      .replace(/{{title}}/g, toDateStamp(date));
  }

  await vaultService.ensureFile(path, template);
  const created = await vaultService.read(path);
  return { path, content: created, existed: false };
}

export function extractActiveWorkTasks(content: string): string[] {
  const lines = content.split("\n");
  const out: string[] = [];

  let inSuggested = false;
  let inEndOfDay = false;
  let inTasks = false;
  let inWork = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      inSuggested = line === "## Suggested Tasks";
      inEndOfDay = line === "## End of Day";
      inTasks = line === "## Tasks" || line === "## Active Tasks";
      inWork = false;
      continue;
    }

    if (!inTasks) {
      continue;
    }

    if (line.startsWith("### ")) {
      inWork = line === "### Work";
      continue;
    }

    if (inSuggested || inEndOfDay || !inWork) {
      continue;
    }

    if (line.startsWith("- [ ]")) {
      out.push(raw);
    }
  }

  return out;
}

export function extractCompletedTasks(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- [x]"));
}

export function isOpenDayContent(content: string): boolean {
  if (!content.trim()) {
    return false;
  }

  const hasEndOfDay = /(^|\n)## End of Day\b/m.test(content);
  if (!hasEndOfDay) {
    return true;
  }

  return isSectionEmpty(content, "## End of Day");
}

export function listUncheckedTasks(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- [ ]"));
}

export function listSuggestedTasks(content: string): string[] {
  const body = getSectionBody(content, "## Suggested Tasks");
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- [ ]"));
}

function defaultDailyTemplate(dateStamp: string): string {
  return `# ${dateStamp}

## Tasks
### Work

### Personal

## Work Log

## Suggested Tasks

## Ideas

## End of Day
`;
}
