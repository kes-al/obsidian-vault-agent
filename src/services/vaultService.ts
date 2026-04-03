import { App, TFile, normalizePath } from "obsidian";
import type { SearchHit } from "../types";
import { normalizeVaultPath } from "../utils/markdown";

export class VaultService {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  getFileByPath(path: string): TFile | null {
    const normalized = normalizePath(normalizeVaultPath(path));
    const candidate = this.app.vault.getAbstractFileByPath(normalized);
    return candidate instanceof TFile ? candidate : null;
  }

  async read(path: string): Promise<string> {
    const file = this.getFileByPath(path);
    if (!file) {
      return "";
    }

    return this.app.vault.cachedRead(file);
  }

  async readFile(file: TFile): Promise<string> {
    return this.app.vault.cachedRead(file);
  }

  async write(path: string, content: string): Promise<void> {
    const normalized = normalizePath(normalizeVaultPath(path));
    const existing = this.getFileByPath(normalized);

    if (existing) {
      await this.app.vault.modify(existing, content);
      return;
    }

    await this.ensureParentFolders(normalized);
    await this.app.vault.create(normalized, content);
  }

  async ensureFile(path: string, initialContent: string): Promise<void> {
    const file = this.getFileByPath(path);
    if (file) {
      return;
    }

    await this.write(path, initialContent);
  }

  async listMarkdownFilesByPrefix(prefixes: string[]): Promise<TFile[]> {
    const normalizedPrefixes = prefixes.map((prefix) => normalizeVaultPath(prefix)).filter((prefix) => prefix.length > 0);
    const files = this.app.vault.getMarkdownFiles();

    return files.filter((file) => normalizedPrefixes.some((prefix) => file.path.startsWith(prefix)));
  }

  listAllMarkdownFiles(): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }

  async search(query: string, maxResults: number): Promise<SearchHit[]> {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length > 1);

    if (terms.length === 0) {
      return [];
    }

    const hits: SearchHit[] = [];
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

  async getDailyNotes(pathPrefix = "daily-notes"): Promise<TFile[]> {
    const files = this.app.vault.getMarkdownFiles().filter((f) => f.path.startsWith(pathPrefix + "/"));
    files.sort((a, b) => a.path.localeCompare(b.path));
    return files;
  }

  private async ensureParentFolders(path: string): Promise<void> {
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
}

function pickSnippet(content: string, terms: string[]): string {
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
