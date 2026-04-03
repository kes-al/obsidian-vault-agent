export function normalizeVaultPath(path: string): string {
  return path.replace(/^\/+/, "").replace(/\\/g, "/");
}

export function hasH2Section(content: string, sectionHeader: string): boolean {
  const escaped = escapeRegExp(sectionHeader.trim());
  const re = new RegExp(`^${escaped}$`, "m");
  return re.test(content);
}

export function ensureH2Section(content: string, sectionHeader: string): string {
  if (hasH2Section(content, sectionHeader)) {
    return content;
  }

  const trimmed = content.trimEnd();
  return `${trimmed}\n\n${sectionHeader}\n`;
}

export function ensureH3SectionWithinH2(content: string, h2: string, h3: string): string {
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
  return `${before}\n\n${h3}\n${after}`;
}

export function appendToSection(content: string, h2: string, line: string, h3?: string): string {
  let next = content;
  if (h3) {
    next = ensureH3SectionWithinH2(next, h2, h3);
    return appendInsideHeading(next, h3, line);
  }

  next = ensureH2Section(next, h2);
  return appendInsideHeading(next, h2, line);
}

export function replaceSectionContent(content: string, heading: string, sectionBody: string): string {
  const bounds = findHeadingBounds(content, heading);
  const cleanBody = sectionBody.trim();
  if (!bounds) {
    const appended = `${content.trimEnd()}\n\n${heading}\n${cleanBody}\n`;
    return appended;
  }

  const before = content.slice(0, bounds.contentStart);
  const after = content.slice(bounds.end);
  return `${before}${cleanBody}\n${after}`;
}

export function replaceSubsectionContent(content: string, parentH2: string, childH3: string, subsectionBody: string): string {
  let next = ensureH3SectionWithinH2(content, parentH2, childH3);
  const parent = findHeadingBounds(next, parentH2);
  if (!parent) {
    return next;
  }

  const parentChunk = next.slice(parent.start, parent.end);
  const localBounds = findHeadingBounds(parentChunk, childH3);
  if (!localBounds) {
    const appended = `${parentChunk.trimEnd()}\n\n${childH3}\n${subsectionBody.trim()}\n`;
    return `${next.slice(0, parent.start)}${appended}${next.slice(parent.end)}`;
  }

  const globalStart = parent.start + localBounds.start;
  const globalContentStart = parent.start + localBounds.contentStart;
  const globalEnd = parent.start + localBounds.end;

  const before = next.slice(0, globalContentStart);
  const after = next.slice(globalEnd);
  const clean = subsectionBody.trim();
  next = `${before}${clean}\n${after}`;
  return next;
}

export function getSectionBody(content: string, heading: string): string {
  const bounds = findHeadingBounds(content, heading);
  if (!bounds) {
    return "";
  }

  return content.slice(bounds.contentStart, bounds.end).trim();
}

export function isSectionEmpty(content: string, heading: string): boolean {
  const body = getSectionBody(content, heading);
  return body.length === 0;
}

export function findHeadingBounds(content: string, heading: string): { start: number; contentStart: number; end: number } | null {
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

function findH2Bounds(content: string, h2: string): { start: number; end: number } | null {
  const bounds = findHeadingBounds(content, h2);
  if (!bounds) {
    return null;
  }

  return { start: bounds.start, end: bounds.end };
}

function appendInsideHeading(content: string, heading: string, line: string): string {
  const bounds = findHeadingBounds(content, heading);
  if (!bounds) {
    return `${content.trimEnd()}\n\n${heading}\n${line}\n`;
  }

  const sectionBody = content.slice(bounds.contentStart, bounds.end).trimEnd();
  const nextBody = sectionBody.length > 0 ? `${sectionBody}\n${line}` : line;

  const before = content.slice(0, bounds.contentStart);
  const after = content.slice(bounds.end);
  return `${before}${nextBody}\n${after}`;
}

function lineOffset(lines: string[], target: number): number {
  let offset = 0;
  for (let i = 0; i < target; i += 1) {
    offset += lines[i].length + 1;
  }
  return offset;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
