import type { ParsedTask } from "../types";
import { toMMDD } from "./date";

const BLOCK_ID_RE = /\^(t-\d{4}-\d{3})\b/;
const DATE_RE = /\b(\d{4}-\d{2}-\d{2})\b/;

export function parseTaskLine(line: string): ParsedTask | null {
  if (!line.trim().startsWith("- [ ]")) {
    return null;
  }

  const blockMatch = line.match(BLOCK_ID_RE);
  const dateMatch = line.match(DATE_RE);
  const normalizedText = normalizeTaskText(line);

  return {
    raw: line,
    blockId: blockMatch ? blockMatch[1] : null,
    normalizedText,
    priority: line.includes("❗") ? 1 : line.includes("🔼") ? 2 : 3,
    dueDate: dateMatch ? dateMatch[1] : null
  };
}

export function extractTaskLines(content: string): string[] {
  const lines = content.split("\n");
  return lines.filter((line) => line.trim().startsWith("- [ ]"));
}

export function nextBlockId(content: string, now: Date): string {
  const mmdd = toMMDD(now);
  const re = /\^t-(\d{4})-(\d{3})\b/g;
  let max = 0;
  let match: RegExpExecArray | null = re.exec(content);

  while (match) {
    const n = Number(match[2]);
    if (Number.isFinite(n) && n > max) {
      max = n;
    }
    match = re.exec(content);
  }

  const next = String(max + 1).padStart(3, "0");
  return `^t-${mmdd}-${next}`;
}

export function dedupeTasks(lines: string[]): string[] {
  const seenBlock = new Set<string>();
  const seenText = new Set<string>();
  const out: string[] = [];

  for (const line of lines) {
    const parsed = parseTaskLine(line);
    if (!parsed) {
      continue;
    }

    if (parsed.blockId) {
      if (seenBlock.has(parsed.blockId)) {
        continue;
      }
      seenBlock.add(parsed.blockId);
      out.push(line);
      continue;
    }

    if (seenText.has(parsed.normalizedText)) {
      continue;
    }

    seenText.add(parsed.normalizedText);
    out.push(line);
  }

  return out;
}

export function sortTasks(lines: string[]): string[] {
  return [...lines].sort((a, b) => {
    const pa = parseTaskLine(a);
    const pb = parseTaskLine(b);

    if (!pa || !pb) {
      return 0;
    }

    if (pa.priority !== pb.priority) {
      return pa.priority - pb.priority;
    }

    if (pa.dueDate && pb.dueDate) {
      return pa.dueDate.localeCompare(pb.dueDate);
    }

    if (pa.dueDate && !pb.dueDate) {
      return -1;
    }

    if (!pa.dueDate && pb.dueDate) {
      return 1;
    }

    return pa.normalizedText.localeCompare(pb.normalizedText);
  });
}

function normalizeTaskText(line: string): string {
  return line
    .replace(/^\s*-\s*\[\s\]\s*/, "")
    .replace(/\^t-\d{4}-\d{3}\b/g, "")
    .replace(/\d{4}-\d{2}-\d{2}/g, "")
    .replace(/[❗🔼]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
