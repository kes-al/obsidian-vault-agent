import type { PendingWriteOperation } from "../types";
import { randomId } from "../utils/id";
import { VaultService } from "./vaultService";

export class WriteOperationStore {
  private operations: Map<string, PendingWriteOperation>;
  private listeners: Set<() => void>;
  private vaultService: VaultService;

  constructor(vaultService: VaultService) {
    this.vaultService = vaultService;
    this.operations = new Map();
    this.listeners = new Set();
  }

  make(reason: string, filePath: string, before: string, after: string): PendingWriteOperation {
    return {
      id: randomId("op"),
      reason,
      filePath,
      before,
      after,
      status: "pending",
      createdAt: new Date().toISOString()
    };
  }

  queue(ops: PendingWriteOperation[]): void {
    for (const op of ops) {
      this.operations.set(op.id, op);
    }
    this.emit();
  }

  listPending(): PendingWriteOperation[] {
    return [...this.operations.values()].filter((op) => op.status === "pending");
  }

  get(id: string): PendingWriteOperation | null {
    return this.operations.get(id) ?? null;
  }

  async apply(id: string): Promise<PendingWriteOperation> {
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

  skip(id: string): PendingWriteOperation {
    const op = this.operations.get(id);
    if (!op) {
      throw new Error(`Operation not found: ${id}`);
    }

    op.status = "skipped";
    this.operations.set(id, op);
    this.emit();
    return op;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
