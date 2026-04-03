var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => VaultAgentPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian7 = require("obsidian");

// src/utils/date.ts
function toDateStamp(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function toMMDD(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${m}${d}`;
}
function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
function isLikelyDate(text) {
  return /^\d{4}-\d{2}-\d{2}$/.test(text.trim());
}

// src/utils/markdown.ts
function normalizeVaultPath(path) {
  return path.replace(/^\/+/, "").replace(/\\/g, "/");
}
function hasH2Section(content, sectionHeader) {
  const escaped = escapeRegExp(sectionHeader.trim());
  const re = new RegExp(`^${escaped}$`, "m");
  return re.test(content);
}
function ensureH2Section(content, sectionHeader) {
  if (hasH2Section(content, sectionHeader)) {
    return content;
  }
  const trimmed = content.trimEnd();
  return `${trimmed}

${sectionHeader}
`;
}
function ensureH3SectionWithinH2(content, h2, h3) {
  const withH2 = ensureH2Section(content, h2);
  const bounds = findH2Bounds(withH2, h2);
  if (!bounds) {
    return withH2;
  }
  const chunk = withH2.slice(bounds.start, bounds.end);
  const h3Regex = new RegExp(`^${escapeRegExp(h3)}$`, "m");
  if (h3Regex.test(chunk)) {
    return withH2;
  }
  const before = withH2.slice(0, bounds.end).trimEnd();
  const after = withH2.slice(bounds.end);
  return `${before}

${h3}
${after}`;
}
function appendToSection(content, h2, line, h3) {
  let next = content;
  if (h3) {
    next = ensureH3SectionWithinH2(next, h2, h3);
    return appendInsideHeading(next, h3, line);
  }
  next = ensureH2Section(next, h2);
  return appendInsideHeading(next, h2, line);
}
function replaceSectionContent(content, heading, sectionBody) {
  const bounds = findHeadingBounds(content, heading);
  const cleanBody = sectionBody.trim();
  if (!bounds) {
    const appended = `${content.trimEnd()}

${heading}
${cleanBody}
`;
    return appended;
  }
  const before = content.slice(0, bounds.contentStart);
  const after = content.slice(bounds.end);
  return `${before}${cleanBody}
${after}`;
}
function replaceSubsectionContent(content, parentH2, childH3, subsectionBody) {
  let next = ensureH3SectionWithinH2(content, parentH2, childH3);
  const parent = findHeadingBounds(next, parentH2);
  if (!parent) {
    return next;
  }
  const parentChunk = next.slice(parent.start, parent.end);
  const localBounds = findHeadingBounds(parentChunk, childH3);
  if (!localBounds) {
    const appended = `${parentChunk.trimEnd()}

${childH3}
${subsectionBody.trim()}
`;
    return `${next.slice(0, parent.start)}${appended}${next.slice(parent.end)}`;
  }
  const globalStart = parent.start + localBounds.start;
  const globalContentStart = parent.start + localBounds.contentStart;
  const globalEnd = parent.start + localBounds.end;
  const before = next.slice(0, globalContentStart);
  const after = next.slice(globalEnd);
  const clean = subsectionBody.trim();
  next = `${before}${clean}
${after}`;
  return next;
}
function getSectionBody(content, heading) {
  const bounds = findHeadingBounds(content, heading);
  if (!bounds) {
    return "";
  }
  return content.slice(bounds.contentStart, bounds.end).trim();
}
function isSectionEmpty(content, heading) {
  const body = getSectionBody(content, heading);
  return body.length === 0;
}
function findHeadingBounds(content, heading) {
  const lines = content.split("\n");
  let startLine = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim() === heading.trim()) {
      startLine = i;
      break;
    }
  }
  if (startLine === -1) {
    return null;
  }
  let endLine = lines.length;
  for (let j = startLine + 1; j < lines.length; j += 1) {
    const line = lines[j].trim();
    if (line.startsWith("## ") && line !== heading.trim()) {
      endLine = j;
      break;
    }
  }
  const start = lineOffset(lines, startLine);
  const contentStart = start + lines[startLine].length + 1;
  const end = lineOffset(lines, endLine);
  return { start, contentStart, end };
}
function findH2Bounds(content, h2) {
  const bounds = findHeadingBounds(content, h2);
  if (!bounds) {
    return null;
  }
  return { start: bounds.start, end: bounds.end };
}
function appendInsideHeading(content, heading, line) {
  const bounds = findHeadingBounds(content, heading);
  if (!bounds) {
    return `${content.trimEnd()}

${heading}
${line}
`;
  }
  const sectionBody = content.slice(bounds.contentStart, bounds.end).trimEnd();
  const nextBody = sectionBody.length > 0 ? `${sectionBody}
${line}` : line;
  const before = content.slice(0, bounds.contentStart);
  const after = content.slice(bounds.end);
  return `${before}${nextBody}
${after}`;
}
function lineOffset(lines, target) {
  let offset = 0;
  for (let i = 0; i < target; i += 1) {
    offset += lines[i].length + 1;
  }
  return offset;
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/utils/tasks.ts
var BLOCK_ID_RE = /\^(t-\d{4}-\d{3})\b/;
var DATE_RE = /\b(\d{4}-\d{2}-\d{2})\b/;
function parseTaskLine(line) {
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
    priority: line.includes("\u2757") ? 1 : line.includes("\u{1F53C}") ? 2 : 3,
    dueDate: dateMatch ? dateMatch[1] : null
  };
}
function nextBlockId(content, now) {
  const mmdd = toMMDD(now);
  const re = /\^t-(\d{4})-(\d{3})\b/g;
  let max = 0;
  let match = re.exec(content);
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
function dedupeTasks(lines) {
  const seenBlock = /* @__PURE__ */ new Set();
  const seenText = /* @__PURE__ */ new Set();
  const out = [];
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
function sortTasks(lines) {
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
function normalizeTaskText(line) {
  return line.replace(/^\s*-\s*\[\s\]\s*/, "").replace(/\^t-\d{4}-\d{3}\b/g, "").replace(/\d{4}-\d{2}-\d{2}/g, "").replace(/[❗🔼]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

// src/workflows/common.ts
var DAILY_NOTES_PATH = "daily-notes";
var DAILY_TEMPLATE_PATH = "templates/daily-note.md";
async function resolveOpenDay(vaultService) {
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
async function ensureDailyNote(vaultService, date) {
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
    template = template.replace(/{{date}}/g, toDateStamp(date)).replace(/{{title}}/g, toDateStamp(date));
  }
  await vaultService.ensureFile(path, template);
  const created = await vaultService.read(path);
  return { path, content: created, existed: false };
}
function extractActiveWorkTasks(content) {
  const lines = content.split("\n");
  const out = [];
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
function extractCompletedTasks(content) {
  return content.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("- [x]"));
}
function isOpenDayContent(content) {
  if (!content.trim()) {
    return false;
  }
  const hasEndOfDay = /(^|\n)## End of Day\b/m.test(content);
  if (!hasEndOfDay) {
    return true;
  }
  return isSectionEmpty(content, "## End of Day");
}
function listUncheckedTasks(content) {
  return content.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("- [ ]"));
}
function listSuggestedTasks(content) {
  const body = getSectionBody(content, "## Suggested Tasks");
  return body.split("\n").map((line) => line.trim()).filter((line) => line.startsWith("- [ ]"));
}
function defaultDailyTemplate(dateStamp) {
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

// src/workflows/capture.ts
var runCapture = async (ctx, deps) => {
  var _a;
  const rawArgs = ctx.args.trim();
  if (!rawArgs) {
    return {
      assistantMessage: "Usage: `/capture [task|idea] <text>` or `/capture <text>`."
    };
  }
  const kind = detectKind(rawArgs);
  const payload = stripKindPrefix(rawArgs);
  const open = await resolveOpenDay(deps.vaultService);
  const target = open != null ? open : await (async () => {
    const ensured = await ensureDailyNote(deps.vaultService, ctx.now);
    return { file: deps.vaultService.getFileByPath(ensured.path), content: ensured.content };
  })();
  const targetPath = target.file.path;
  const before = target.content;
  const taskId = nextBlockId(before, ctx.now);
  const due = (_a = findExplicitDate(payload)) != null ? _a : toDateStamp(addDays(ctx.now, 1));
  const entry = buildEntry(kind, payload, due, taskId);
  const after = kind === "task" ? appendToSection(before, "## Tasks", entry, "### Work") : kind === "idea" ? appendToSection(before, "## Ideas", entry) : appendToSection(before, "## Work Log", entry);
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
function detectKind(input) {
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
function stripKindPrefix(input) {
  return input.replace(/^(task|idea)\s+/i, "").trim();
}
function findExplicitDate(input) {
  for (const token of input.split(/\s+/)) {
    if (isLikelyDate(token)) {
      return token;
    }
  }
  return null;
}
function buildEntry(kind, payload, dueDate, blockId) {
  if (kind === "task") {
    const urgent = /\b(urgent|asap|blocker|today)\b/i.test(payload);
    const marker = urgent ? "\u2757" : "\u{1F53C}";
    return `- [ ] ${marker} ${dueDate} ${payload} ${blockId}`.replace(/\s+/g, " ").trim();
  }
  if (kind === "idea") {
    const withTag = payload.includes("#idea") ? payload : `${payload} #idea`;
    return `- ${withTag}`.trim();
  }
  return `- ${payload}`.trim();
}

// src/workflows/closeday.ts
var runCloseday = async (ctx, deps) => {
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
function buildEndOfDaySummary(args) {
  const completedBody = args.completed.length > 0 ? args.completed.slice(0, 8).map((line) => `- ${line.replace(/^\s*-\s*\[x\]\s*/, "")}`).join("\n") : "- No completed tasks were marked.";
  const carryBody = args.carryOver.length > 0 ? args.carryOver.slice(0, 8).map((line) => `- ${line.replace(/^\s*-\s*\[\s\]\s*/, "")}`).join("\n") : "- No open tasks to carry forward.";
  const suggestedBody = args.suggested.length > 0 ? args.suggested.slice(0, 6).map((line) => `- ${line.replace(/^\s*-\s*\[\s\]\s*/, "")}`).join("\n") : "- No suggested tasks waiting.";
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

// src/workflows/commandPack.ts
var runCommandPackCommand = async (ctx, deps) => {
  var _a, _b;
  const match = ctx.input.trim().match(/^\/([a-z0-9-]+)\s*(.*)$/i);
  if (!match) {
    return { assistantMessage: "Not a command invocation." };
  }
  const commandName = match[1];
  const args = (_a = match[2]) != null ? _a : "";
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
  const messages = [
    {
      role: "system",
      content: "You are executing a vault command spec. Follow instruction intent but do not fabricate file writes. If writes are needed, clearly propose the exact change."
    },
    {
      role: "user",
      content: `Command file: ${command.path}

Command spec:
${command.body}

Arguments:
${args || "(none)"}`
    }
  ];
  try {
    const providerId = (_b = settings.routing.default) != null ? _b : settings.defaultProvider;
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

// src/workflows/contextLoad.ts
var runContextLoad = async (ctx, deps) => {
  var _a;
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
  const contextChunk = top.map((hit, i) => `#${i + 1} ${hit.file.path}
${hit.snippet}`).join("\n\n");
  const messages = [
    {
      role: "system",
      content: "You are a concise context briefer for an Obsidian vault. Summarize active context, risks, open items, and next actions."
    },
    {
      role: "user",
      content: `Create a focused context brief for: ${query}

Vault excerpts:
${contextChunk}`
    }
  ];
  try {
    const response = await provider.chat({
      model: settings.providers[(_a = settings.routing["context-load"]) != null ? _a : settings.defaultProvider].model,
      messages,
      temperature: 0.2,
      maxTokens: 1200
    });
    const references = top.map((hit) => `- ${hit.file.path}`).join("\n");
    return {
      assistantMessage: `${response.content.trim()}

Referenced notes:
${references}`
    };
  } catch (error) {
    return {
      assistantMessage: `${renderFallbackContext(top)}

(LLM summary failed: ${error instanceof Error ? error.message : String(error)})`
    };
  }
};
function renderFallbackContext(topHits) {
  const lines = topHits.slice(0, 8).map((hit) => `- ${hit.file.path}: ${hit.snippet}`);
  return `Context matches:
${lines.join("\n")}`;
}

// src/workflows/plainChat.ts
var runPlainChat = async (ctx, deps) => {
  var _a;
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
  const contextText = contextHits.slice(0, 6).map((hit) => `- ${hit.file.path}: ${hit.snippet}`).join("\n");
  const messages = [
    {
      role: "system",
      content: "You are Vault Agent inside Obsidian. Be concise, actionable, and preserve markdown formatting."
    },
    {
      role: "user",
      content: `User query:
${query}

Relevant vault excerpts:
${contextText || "- none"}.`
    }
  ];
  try {
    const providerId = (_a = settings.routing.default) != null ? _a : settings.defaultProvider;
    const model = settings.providers[providerId].model;
    const result = await provider.chat({
      model,
      messages,
      temperature: 0.3,
      maxTokens: 1e3
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

// src/workflows/startday.ts
var runStartday = async (ctx, deps) => {
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
  const recentDailyNotes = (await deps.vaultService.getDailyNotes(DAILY_NOTES_PATH)).filter((f) => f.path !== targetFile.path).sort((a, b) => b.path.localeCompare(a.path)).slice(0, 5);
  const pulledTasks = [];
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
function buildPlan(tasks, now) {
  const date = toDateStamp(now);
  const must = tasks.filter((task) => task.includes("\u2757") || task.includes(date)).slice(0, 6);
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
function stripTaskPrefix(taskLine) {
  return taskLine.replace(/^\s*-\s*\[\s\]\s*/, "").trim();
}

// src/engine/router.ts
var BUILTIN_COMMANDS = {
  capture: runCapture,
  startday: runStartday,
  closeday: runCloseday,
  "context-load": runContextLoad
};
var WorkflowRouter = class {
  async runInput(input, deps) {
    const trimmed = input.trim();
    const ctx = {
      now: /* @__PURE__ */ new Date(),
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
};
function extractCommand(input) {
  const match = input.match(/^\/([a-z0-9-]+)/i);
  return match ? match[1].toLowerCase() : "";
}
function extractArgs(input) {
  var _a;
  const match = input.match(/^\/[a-z0-9-]+\s*(.*)$/i);
  return match ? ((_a = match[1]) != null ? _a : "").trim() : input;
}

// src/providers/anthropic.ts
var import_obsidian = require("obsidian");
var AnthropicProvider = class {
  constructor(settings) {
    this.settings = settings;
  }
  async chat(request) {
    var _a, _b;
    const base = this.settings.baseUrl.replace(/\/$/, "");
    const url = `${base}/v1/messages`;
    const headers = {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01"
    };
    if (this.settings.apiKey.trim().length > 0) {
      headers["x-api-key"] = this.settings.apiKey.trim();
    }
    const systemParts = request.messages.filter((m) => m.role === "system").map((m) => m.content.trim()).filter(Boolean);
    const messages = request.messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
    const payload = {
      model: request.model,
      max_tokens: (_a = request.maxTokens) != null ? _a : 1200,
      temperature: (_b = request.temperature) != null ? _b : 0.3,
      system: systemParts.join("\n\n") || void 0,
      messages
    };
    const response = await (0, import_obsidian.requestUrl)({
      url,
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const json = response.json;
    const contentArray = Array.isArray(json.content) ? json.content : [];
    let output = "";
    for (const item of contentArray) {
      const obj = item;
      if (obj.type === "text" && typeof obj.text === "string") {
        output += obj.text;
      }
    }
    return {
      content: output,
      raw: json
    };
  }
};

// src/providers/openaiCompatible.ts
var import_obsidian2 = require("obsidian");
var OpenAICompatibleProvider = class {
  constructor(options) {
    this.providerName = options.providerName;
    this.settings = options.settings;
  }
  async chat(request) {
    var _a, _b, _c, _d, _e, _f;
    const base = this.settings.baseUrl.replace(/\/$/, "");
    const url = `${base}/chat/completions`;
    const headers = {
      "Content-Type": "application/json",
      ...parseHeaderString(this.settings.extraHeaders)
    };
    if (this.settings.apiKey.trim().length > 0) {
      headers.Authorization = `Bearer ${this.settings.apiKey.trim()}`;
    }
    if (this.providerName === "openrouter") {
      headers["HTTP-Referer"] = (_a = headers["HTTP-Referer"]) != null ? _a : "https://obsidian.md";
      headers["X-Title"] = (_b = headers["X-Title"]) != null ? _b : "Vault Agent";
    }
    const payload = {
      model: request.model,
      messages: request.messages,
      temperature: (_c = request.temperature) != null ? _c : 0.3,
      max_tokens: (_d = request.maxTokens) != null ? _d : 1200
    };
    const response = await (0, import_obsidian2.requestUrl)({
      url,
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    const json = response.json;
    const choices = Array.isArray(json.choices) ? json.choices : [];
    const first = (_e = choices[0]) != null ? _e : {};
    const message = (_f = first.message) != null ? _f : {};
    const content = typeof message.content === "string" ? message.content : "";
    return {
      content,
      raw: json
    };
  }
};
function parseHeaderString(text) {
  const headers = {};
  const lines = text.split(/\n+/).map((line) => line.trim()).filter((line) => line.length > 0);
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx <= 0) {
      continue;
    }
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key && value) {
      headers[key] = value;
    }
  }
  return headers;
}

// src/providers/factory.ts
var ModelProviderFactory = class {
  constructor(settings) {
    this.settings = settings;
  }
  updateSettings(settings) {
    this.settings = settings;
  }
  forWorkflow(workflow) {
    var _a;
    const providerId = (_a = this.settings.routing[workflow]) != null ? _a : this.settings.defaultProvider;
    return this.forProvider(providerId);
  }
  forProvider(providerId) {
    const config = this.settings.providers[providerId];
    if (!config || !config.enabled) {
      return null;
    }
    if (providerId === "anthropic") {
      return new AnthropicProvider(config);
    }
    return new OpenAICompatibleProvider({
      providerName: providerId,
      settings: config
    });
  }
};

// src/services/commandPackService.ts
var CommandPackService = class {
  constructor(vaultService) {
    this.vaultService = vaultService;
  }
  async listCommands(paths) {
    const normalized = paths.map((path) => normalizeVaultPath(path).replace(/\/$/, ""));
    const files = this.vaultService.listAllMarkdownFiles();
    const commands = [];
    for (const file of files) {
      const match = normalized.find((prefix) => file.path.startsWith(prefix + "/"));
      if (!match) {
        continue;
      }
      if (!file.path.endsWith(".md")) {
        continue;
      }
      const body = await this.vaultService.readFile(file);
      const name = file.basename;
      commands.push({
        name,
        path: file.path,
        body,
        sourceDir: match
      });
    }
    commands.sort((a, b) => a.name.localeCompare(b.name));
    return commands;
  }
  async getCommand(name, paths) {
    var _a;
    const lower = name.toLowerCase();
    const commands = await this.listCommands(paths);
    const direct = commands.find((cmd) => cmd.name.toLowerCase() === lower);
    if (direct) {
      return direct;
    }
    return (_a = commands.find((cmd) => cmd.name.toLowerCase().replace(/\s+/g, "-") === lower)) != null ? _a : null;
  }
};

// src/services/vaultService.ts
var import_obsidian3 = require("obsidian");
var VaultService = class {
  constructor(app) {
    this.app = app;
  }
  getFileByPath(path) {
    const normalized = (0, import_obsidian3.normalizePath)(normalizeVaultPath(path));
    const candidate = this.app.vault.getAbstractFileByPath(normalized);
    return candidate instanceof import_obsidian3.TFile ? candidate : null;
  }
  async read(path) {
    const file = this.getFileByPath(path);
    if (!file) {
      return "";
    }
    return this.app.vault.cachedRead(file);
  }
  async readFile(file) {
    return this.app.vault.cachedRead(file);
  }
  async write(path, content) {
    const normalized = (0, import_obsidian3.normalizePath)(normalizeVaultPath(path));
    const existing = this.getFileByPath(normalized);
    if (existing) {
      await this.app.vault.modify(existing, content);
      return;
    }
    await this.ensureParentFolders(normalized);
    await this.app.vault.create(normalized, content);
  }
  async ensureFile(path, initialContent) {
    const file = this.getFileByPath(path);
    if (file) {
      return;
    }
    await this.write(path, initialContent);
  }
  async listMarkdownFilesByPrefix(prefixes) {
    const normalizedPrefixes = prefixes.map((prefix) => normalizeVaultPath(prefix)).filter((prefix) => prefix.length > 0);
    const files = this.app.vault.getMarkdownFiles();
    return files.filter((file) => normalizedPrefixes.some((prefix) => file.path.startsWith(prefix)));
  }
  listAllMarkdownFiles() {
    return this.app.vault.getMarkdownFiles();
  }
  async search(query, maxResults) {
    const terms = query.toLowerCase().split(/\s+/).map((term) => term.trim()).filter((term) => term.length > 1);
    if (terms.length === 0) {
      return [];
    }
    const hits = [];
    const files = this.app.vault.getMarkdownFiles();
    for (const file of files) {
      const lowerPath = file.path.toLowerCase();
      const content = await this.app.vault.cachedRead(file);
      const lower = content.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (lowerPath.includes(term)) {
          score += 4;
        }
        const idx = lower.indexOf(term);
        if (idx >= 0) {
          score += 2;
          if (idx < 300) {
            score += 1;
          }
        }
      }
      if (score > 0) {
        hits.push({
          file,
          score,
          snippet: pickSnippet(content, terms)
        });
      }
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, maxResults);
  }
  async getDailyNotes(pathPrefix = "daily-notes") {
    const files = this.app.vault.getMarkdownFiles().filter((f) => f.path.startsWith(pathPrefix + "/"));
    files.sort((a, b) => a.path.localeCompare(b.path));
    return files;
  }
  async ensureParentFolders(path) {
    const slash = path.lastIndexOf("/");
    if (slash === -1) {
      return;
    }
    const folder = path.slice(0, slash);
    if (!folder) {
      return;
    }
    const segments = folder.split("/");
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      const exists = this.app.vault.getAbstractFileByPath(current);
      if (!exists) {
        await this.app.vault.createFolder(current);
      }
    }
  }
};
function pickSnippet(content, terms) {
  const lower = content.toLowerCase();
  let idx = -1;
  for (const term of terms) {
    const t = lower.indexOf(term);
    if (t >= 0) {
      idx = t;
      break;
    }
  }
  if (idx < 0) {
    return content.slice(0, 180).replace(/\n/g, " ");
  }
  const start = Math.max(0, idx - 60);
  const end = Math.min(content.length, idx + 120);
  return content.slice(start, end).replace(/\n/g, " ");
}

// src/utils/id.ts
function randomId(prefix) {
  const seed = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${seed}`;
}

// src/services/writeOperationStore.ts
var WriteOperationStore = class {
  constructor(vaultService) {
    this.vaultService = vaultService;
    this.operations = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Set();
  }
  make(reason, filePath, before, after) {
    return {
      id: randomId("op"),
      reason,
      filePath,
      before,
      after,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  queue(ops) {
    for (const op of ops) {
      this.operations.set(op.id, op);
    }
    this.emit();
  }
  listPending() {
    return [...this.operations.values()].filter((op) => op.status === "pending");
  }
  get(id) {
    var _a;
    return (_a = this.operations.get(id)) != null ? _a : null;
  }
  async apply(id) {
    const op = this.operations.get(id);
    if (!op) {
      throw new Error(`Operation not found: ${id}`);
    }
    try {
      await this.vaultService.write(op.filePath, op.after);
      op.status = "applied";
    } catch (error) {
      op.status = "error";
      op.error = error instanceof Error ? error.message : String(error);
    }
    this.operations.set(op.id, op);
    this.emit();
    return op;
  }
  skip(id) {
    const op = this.operations.get(id);
    if (!op) {
      throw new Error(`Operation not found: ${id}`);
    }
    op.status = "skipped";
    this.operations.set(id, op);
    this.emit();
    return op;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }
};

// src/state/settings.ts
var DEFAULT_SETTINGS = {
  defaultProvider: "local",
  commandPaths: [".vault-agent/commands", ".claude/commands"],
  writePolicy: "preview_required",
  maxSearchResults: 25,
  maxContextFiles: 8,
  providers: {
    openrouter: {
      enabled: false,
      baseUrl: "https://openrouter.ai/api/v1",
      model: "openrouter/free",
      apiKey: "",
      extraHeaders: ""
    },
    openai: {
      enabled: false,
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4.1-mini",
      apiKey: "",
      extraHeaders: ""
    },
    anthropic: {
      enabled: false,
      baseUrl: "https://api.anthropic.com",
      model: "claude-3-7-sonnet-latest",
      apiKey: "",
      extraHeaders: ""
    },
    local: {
      enabled: true,
      baseUrl: "http://127.0.0.1:8080/v1",
      model: "ggml-org/gemma-4-26B-A4B-it-GGUF:Q4_K_M",
      apiKey: "",
      extraHeaders: ""
    }
  },
  routing: {
    capture: "local",
    startday: "local",
    closeday: "local",
    "context-load": "local",
    default: "local"
  }
};

// src/state/sessionStore.ts
var SessionStore = class {
  constructor() {
    this.active = this.createSession();
    this.listeners = /* @__PURE__ */ new Set();
  }
  createSession() {
    return {
      id: randomId("session"),
      messages: [],
      pendingOperationIds: [],
      lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  reset() {
    this.active = this.createSession();
    this.emit();
    return this.active;
  }
  getActive() {
    return this.active;
  }
  addMessage(kind, content) {
    const message = {
      id: randomId("msg"),
      kind,
      content,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.active.messages.push(message);
    this.active.lastUpdatedAt = message.createdAt;
    this.emit();
    return message;
  }
  addOperations(operations) {
    for (const op of operations) {
      if (!this.active.pendingOperationIds.includes(op.id)) {
        this.active.pendingOperationIds.push(op.id);
      }
    }
    this.active.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.emit();
  }
  removeOperation(operationId) {
    this.active.pendingOperationIds = this.active.pendingOperationIds.filter((id) => id !== operationId);
    this.active.lastUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.emit();
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }
};

// src/ui/promptModal.ts
var import_obsidian4 = require("obsidian");
var PromptModal = class extends import_obsidian4.Modal {
  constructor(app, titleText, placeholder, onSubmit) {
    super(app);
    this.titleText = titleText;
    this.placeholder = placeholder;
    this.onSubmit = onSubmit;
    this.value = "";
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.titleText });
    new import_obsidian4.Setting(contentEl).setName("Input").addText((text) => text.setPlaceholder(this.placeholder).onChange((value) => {
      this.value = value;
    }));
    new import_obsidian4.Setting(contentEl).addButton((btn) => btn.setButtonText("Cancel").onClick(() => {
      this.close();
    })).addButton((btn) => btn.setButtonText("Run").setCta().onClick(() => {
      this.onSubmit(this.value.trim());
      this.close();
    }));
  }
};

// src/ui/settingsTab.ts
var import_obsidian5 = require("obsidian");
var WORKFLOW_KEYS = ["capture", "startday", "closeday", "context-load", "default"];
var PROVIDERS = ["local", "openrouter", "openai", "anthropic"];
var VaultAgentSettingTab = class extends import_obsidian5.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Vault Agent Settings" });
    new import_obsidian5.Setting(containerEl).setName("Default provider").setDesc("Used when workflow routing is not explicitly set.").addDropdown((dropdown) => {
      for (const provider of PROVIDERS) {
        dropdown.addOption(provider, provider);
      }
      dropdown.setValue(this.plugin.settings.defaultProvider);
      dropdown.onChange(async (value) => {
        this.plugin.settings.defaultProvider = value;
        await this.plugin.persistSettings();
      });
    });
    new import_obsidian5.Setting(containerEl).setName("Write policy").setDesc("Preview writes before apply, or auto-apply all generated writes.").addDropdown((dropdown) => {
      dropdown.addOption("preview_required", "preview_required");
      dropdown.addOption("auto_apply", "auto_apply");
      dropdown.setValue(this.plugin.settings.writePolicy);
      dropdown.onChange(async (value) => {
        this.plugin.settings.writePolicy = value;
        await this.plugin.persistSettings();
      });
    });
    new import_obsidian5.Setting(containerEl).setName("Command paths").setDesc("One path per line. Commands are loaded from these vault folders.").addTextArea((area) => {
      area.setPlaceholder(".vault-agent/commands\n.claude/commands");
      area.setValue(this.plugin.settings.commandPaths.join("\n"));
      area.onChange(async (value) => {
        this.plugin.settings.commandPaths = value.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
        await this.plugin.persistSettings();
      });
    });
    containerEl.createEl("h3", { text: "Workflow Routing" });
    for (const workflow of WORKFLOW_KEYS) {
      new import_obsidian5.Setting(containerEl).setName(workflow).addDropdown((dropdown) => {
        for (const provider of PROVIDERS) {
          dropdown.addOption(provider, provider);
        }
        dropdown.setValue(this.plugin.settings.routing[workflow]);
        dropdown.onChange(async (value) => {
          this.plugin.settings.routing[workflow] = value;
          await this.plugin.persistSettings();
        });
      });
    }
    containerEl.createEl("h3", { text: "Provider Configuration" });
    for (const provider of PROVIDERS) {
      this.renderProviderSection(containerEl, provider);
    }
  }
  renderProviderSection(container, provider) {
    const config = this.plugin.settings.providers[provider];
    container.createEl("h4", { text: provider });
    new import_obsidian5.Setting(container).setName("Enabled").addToggle((toggle) => {
      toggle.setValue(config.enabled);
      toggle.onChange(async (value) => {
        config.enabled = value;
        await this.plugin.persistSettings();
      });
    });
    new import_obsidian5.Setting(container).setName("Base URL").addText((text) => {
      text.setPlaceholder("https://api.example.com/v1");
      text.setValue(config.baseUrl);
      text.onChange(async (value) => {
        config.baseUrl = value.trim();
        await this.plugin.persistSettings();
      });
    });
    new import_obsidian5.Setting(container).setName("Model").addText((text) => {
      text.setPlaceholder("model-name");
      text.setValue(config.model);
      text.onChange(async (value) => {
        config.model = value.trim();
        await this.plugin.persistSettings();
      });
    });
    new import_obsidian5.Setting(container).setName("API Key").setDesc("Stored in plugin data for this vault.").addText((text) => {
      text.inputEl.type = "password";
      text.setPlaceholder("sk-...");
      text.setValue(config.apiKey);
      text.onChange(async (value) => {
        config.apiKey = value.trim();
        await this.plugin.persistSettings();
      });
    });
    new import_obsidian5.Setting(container).setName("Extra Headers").setDesc("Format: Header-Name: value (one per line)").addTextArea((area) => {
      var _a;
      area.setPlaceholder("X-My-Header: value");
      area.setValue((_a = config.extraHeaders) != null ? _a : "");
      area.onChange(async (value) => {
        config.extraHeaders = value;
        await this.plugin.persistSettings();
      });
    });
  }
};

// src/ui/vaultAgentView.ts
var import_obsidian6 = require("obsidian");

// src/types.ts
var VAULT_AGENT_VIEW_TYPE = "vault-agent-view";

// src/ui/vaultAgentView.ts
var VaultAgentView = class extends import_obsidian6.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return VAULT_AGENT_VIEW_TYPE;
  }
  getDisplayText() {
    return "Vault Agent";
  }
  async onOpen() {
    this.plugin.attachView(this);
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("vault-agent-view");
    const toolbar = contentEl.createDiv({ cls: "vault-agent-toolbar" });
    this.buildToolbar(toolbar);
    this.messagesEl = contentEl.createDiv({ cls: "vault-agent-messages" });
    this.pendingEl = contentEl.createDiv({ cls: "vault-agent-pending" });
    const composer = contentEl.createDiv({ cls: "vault-agent-composer" });
    this.inputEl = composer.createEl("textarea", {
      cls: "vault-agent-input",
      attr: { placeholder: "Ask Vault Agent or run a command (e.g. /capture ...)" }
    });
    this.inputEl.rows = 3;
    this.inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void this.submitInput();
      }
    });
    const sendBtn = composer.createEl("button", { text: "Send", cls: "mod-cta" });
    sendBtn.onclick = () => void this.submitInput();
    this.render();
  }
  async onClose() {
    this.plugin.detachView(this);
  }
  render() {
    this.renderMessages();
    this.renderPending();
  }
  buildToolbar(toolbar) {
    const openCapture = toolbar.createEl("button", { text: "/capture" });
    openCapture.onclick = () => this.inputEl.value = "/capture ";
    const runStart = toolbar.createEl("button", { text: "/startday" });
    runStart.onclick = async () => this.plugin.runInput("/startday");
    const runClose = toolbar.createEl("button", { text: "/closeday" });
    runClose.onclick = async () => this.plugin.runInput("/closeday");
    const runContext = toolbar.createEl("button", { text: "/context-load" });
    runContext.onclick = () => this.inputEl.value = "/context-load ";
    const refresh = toolbar.createEl("button", { text: "Refresh" });
    refresh.onclick = () => this.render();
  }
  renderMessages() {
    this.messagesEl.empty();
    const messages = this.plugin.getSessionMessages();
    if (messages.length === 0) {
      this.messagesEl.createEl("p", { text: "No messages yet. Run a command or ask a question." });
      return;
    }
    for (const msg of messages) {
      const card = this.messagesEl.createDiv({ cls: `vault-agent-msg vault-agent-msg-${msg.kind}` });
      card.createDiv({ cls: "vault-agent-msg-meta", text: `${msg.kind} \u2022 ${new Date(msg.createdAt).toLocaleTimeString()}` });
      card.createEl("pre", { text: msg.content, cls: "vault-agent-msg-body" });
    }
  }
  renderPending() {
    this.pendingEl.empty();
    const pending = this.plugin.getPendingOperations();
    this.pendingEl.createEl("h4", { text: `Pending Writes (${pending.length})` });
    if (pending.length === 0) {
      this.pendingEl.createEl("p", { text: "No pending writes." });
      return;
    }
    for (const op of pending) {
      const card = this.pendingEl.createDiv({ cls: "vault-agent-op-card" });
      card.createDiv({ text: `${op.reason}` });
      card.createDiv({ text: op.filePath, cls: "vault-agent-op-path" });
      const details = card.createEl("details");
      details.createEl("summary", { text: "Preview" });
      details.createEl("pre", { text: formatPreview(op.before, op.after), cls: "vault-agent-op-preview" });
      const controls = card.createDiv({ cls: "vault-agent-op-controls" });
      const applyBtn = controls.createEl("button", { text: "Apply", cls: "mod-cta" });
      applyBtn.onclick = async () => {
        await this.plugin.applyOperation(op.id);
      };
      const skipBtn = controls.createEl("button", { text: "Skip" });
      skipBtn.onclick = async () => {
        await this.plugin.skipOperation(op.id);
      };
    }
  }
  async submitInput() {
    const value = this.inputEl.value.trim();
    if (!value) {
      return;
    }
    this.inputEl.value = "";
    try {
      await this.plugin.runInput(value);
    } catch (error) {
      new import_obsidian6.Notice(`Vault Agent error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};
function formatPreview(before, after) {
  if (before === after) {
    return "No content changes.";
  }
  const previewBefore = before.slice(0, 900);
  const previewAfter = after.slice(0, 900);
  return `--- before ---
${previewBefore}

--- after ---
${previewAfter}`;
}

// src/main.ts
var VaultAgentPlugin = class extends import_obsidian7.Plugin {
  constructor() {
    super(...arguments);
    this.settings = structuredClone(DEFAULT_SETTINGS);
    this.activeView = null;
  }
  async onload() {
    await this.loadPluginSettings();
    this.sessionStore = new SessionStore();
    this.vaultService = new VaultService(this.app);
    this.commandPackService = new CommandPackService(this.vaultService);
    this.writeStore = new WriteOperationStore(this.vaultService);
    this.providerFactory = new ModelProviderFactory(this.settings);
    this.router = new WorkflowRouter();
    this.registerView(
      VAULT_AGENT_VIEW_TYPE,
      (leaf) => new VaultAgentView(leaf, this)
    );
    this.addRibbonIcon("bot", "Open Vault Agent", () => {
      void this.activateView();
    });
    this.addCommand({
      id: "open-vault-agent",
      name: "Open Vault Agent workspace",
      callback: () => {
        void this.activateView();
      }
    });
    this.addCommand({
      id: "run-startday",
      name: "Vault Agent: /startday",
      callback: () => void this.runInput("/startday")
    });
    this.addCommand({
      id: "run-closeday",
      name: "Vault Agent: /closeday",
      callback: () => void this.runInput("/closeday")
    });
    this.addCommand({
      id: "run-capture",
      name: "Vault Agent: /capture (prompt)",
      callback: () => {
        new PromptModal(this.app, "Vault Agent /capture", "task Follow up on...", (value) => {
          if (!value) {
            return;
          }
          void this.runInput(`/capture ${value}`);
        }).open();
      }
    });
    this.addCommand({
      id: "run-context-load",
      name: "Vault Agent: /context-load (prompt)",
      callback: () => {
        new PromptModal(this.app, "Vault Agent /context-load", "client or project", (value) => {
          if (!value) {
            return;
          }
          void this.runInput(`/context-load ${value}`);
        }).open();
      }
    });
    this.addCommand({
      id: "apply-all-pending-writes",
      name: "Vault Agent: Apply all pending writes",
      callback: () => void this.applyAllPending()
    });
    this.addSettingTab(new VaultAgentSettingTab(this.app, this));
    const rerender = () => {
      var _a;
      return (_a = this.activeView) == null ? void 0 : _a.render();
    };
    this.sessionStore.subscribe(rerender);
    this.writeStore.subscribe(rerender);
  }
  async onunload() {
    this.app.workspace.detachLeavesOfType(VAULT_AGENT_VIEW_TYPE);
  }
  attachView(view) {
    this.activeView = view;
  }
  detachView(view) {
    if (this.activeView === view) {
      this.activeView = null;
    }
  }
  async persistSettings() {
    var _a;
    await this.saveData(this.settings);
    this.providerFactory.updateSettings(this.settings);
    (_a = this.activeView) == null ? void 0 : _a.render();
  }
  getSessionMessages() {
    return this.sessionStore.getActive().messages;
  }
  getPendingOperations() {
    const sessionIds = new Set(this.sessionStore.getActive().pendingOperationIds);
    return this.writeStore.listPending().filter((op) => sessionIds.has(op.id));
  }
  async runInput(input) {
    var _a;
    const text = input.trim();
    if (!text) {
      return;
    }
    this.sessionStore.addMessage("user", text);
    const result = await this.router.runInput(text, this.workflowDeps());
    if (result.operations && result.operations.length > 0) {
      this.writeStore.queue(result.operations);
      this.sessionStore.addOperations(result.operations);
      if (this.settings.writePolicy === "auto_apply") {
        for (const op of result.operations) {
          await this.applyOperation(op.id);
        }
      }
    }
    this.sessionStore.addMessage("assistant", result.assistantMessage);
    for (const receipt of (_a = result.receipts) != null ? _a : []) {
      this.sessionStore.addMessage("receipt", receipt);
    }
  }
  async applyOperation(operationId) {
    var _a;
    const result = await this.writeStore.apply(operationId);
    this.sessionStore.removeOperation(operationId);
    if (result.status === "applied") {
      this.sessionStore.addMessage("tool", `Applied write: ${result.filePath}`);
      new import_obsidian7.Notice(`Vault Agent applied changes to ${result.filePath}`);
      return;
    }
    this.sessionStore.addMessage("tool", `Failed write: ${result.filePath} (${(_a = result.error) != null ? _a : "unknown error"})`);
    new import_obsidian7.Notice(`Vault Agent failed to apply ${result.filePath}`);
  }
  async skipOperation(operationId) {
    const op = this.writeStore.skip(operationId);
    this.sessionStore.removeOperation(operationId);
    this.sessionStore.addMessage("tool", `Skipped write: ${op.filePath}`);
  }
  async applyAllPending() {
    const pending = this.getPendingOperations();
    if (pending.length === 0) {
      new import_obsidian7.Notice("Vault Agent: no pending writes.");
      return;
    }
    for (const op of pending) {
      await this.applyOperation(op.id);
    }
  }
  workflowDeps() {
    return {
      vaultService: this.vaultService,
      commandPackService: this.commandPackService,
      writeStore: this.writeStore,
      providerFactory: this.providerFactory,
      getSettings: () => this.settings
    };
  }
  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VAULT_AGENT_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({
        type: VAULT_AGENT_VIEW_TYPE,
        active: true
      });
    }
    workspace.revealLeaf(leaf);
  }
  async loadPluginSettings() {
    const loaded = await this.loadData();
    this.settings = deepMergeSettings(structuredClone(DEFAULT_SETTINGS), loaded != null ? loaded : {});
  }
};
function deepMergeSettings(base, patch) {
  const out = structuredClone(base);
  if (patch.defaultProvider) {
    out.defaultProvider = patch.defaultProvider;
  }
  if (patch.commandPaths) {
    out.commandPaths = patch.commandPaths;
  }
  if (patch.writePolicy) {
    out.writePolicy = patch.writePolicy;
  }
  if (typeof patch.maxSearchResults === "number") {
    out.maxSearchResults = patch.maxSearchResults;
  }
  if (typeof patch.maxContextFiles === "number") {
    out.maxContextFiles = patch.maxContextFiles;
  }
  if (patch.providers) {
    for (const [key, value] of Object.entries(patch.providers)) {
      const providerKey = key;
      out.providers[providerKey] = {
        ...out.providers[providerKey],
        ...value
      };
    }
  }
  if (patch.routing) {
    for (const [key, value] of Object.entries(patch.routing)) {
      const workflow = key;
      out.routing[workflow] = value;
    }
  }
  return out;
}
