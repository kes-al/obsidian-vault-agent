import type { CommandDefinition } from "../types";
import { normalizeVaultPath } from "../utils/markdown";
import { VaultService } from "./vaultService";

export class CommandPackService {
  private vaultService: VaultService;

  constructor(vaultService: VaultService) {
    this.vaultService = vaultService;
  }

  async listCommands(paths: string[]): Promise<CommandDefinition[]> {
    const normalized = paths.map((path) => normalizeVaultPath(path).replace(/\/$/, ""));
    const files = this.vaultService.listAllMarkdownFiles();
    const commands: CommandDefinition[] = [];

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

  async getCommand(name: string, paths: string[]): Promise<CommandDefinition | null> {
    const lower = name.toLowerCase();
    const commands = await this.listCommands(paths);

    const direct = commands.find((cmd) => cmd.name.toLowerCase() === lower);
    if (direct) {
      return direct;
    }

    return commands.find((cmd) => cmd.name.toLowerCase().replace(/\s+/g, "-") === lower) ?? null;
  }
}
