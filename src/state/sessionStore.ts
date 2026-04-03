import type { PendingWriteOperation, SessionMessage, SessionState } from "../types";
import { randomId } from "../utils/id";

export class SessionStore {
  private active: SessionState;
  private listeners: Set<() => void>;

  constructor() {
    this.active = this.createSession();
    this.listeners = new Set();
  }

  private createSession(): SessionState {
    return {
      id: randomId("session"),
      messages: [],
      pendingOperationIds: [],
      lastUpdatedAt: new Date().toISOString()
    };
  }

  reset(): SessionState {
    this.active = this.createSession();
    this.emit();
    return this.active;
  }

  getActive(): SessionState {
    return this.active;
  }

  addMessage(kind: SessionMessage["kind"], content: string): SessionMessage {
    const message: SessionMessage = {
      id: randomId("msg"),
      kind,
      content,
      createdAt: new Date().toISOString()
    };

    this.active.messages.push(message);
    this.active.lastUpdatedAt = message.createdAt;
    this.emit();
    return message;
  }

  addOperations(operations: PendingWriteOperation[]): void {
    for (const op of operations) {
      if (!this.active.pendingOperationIds.includes(op.id)) {
        this.active.pendingOperationIds.push(op.id);
      }
    }
    this.active.lastUpdatedAt = new Date().toISOString();
    this.emit();
  }

  removeOperation(operationId: string): void {
    this.active.pendingOperationIds = this.active.pendingOperationIds.filter((id) => id !== operationId);
    this.active.lastUpdatedAt = new Date().toISOString();
    this.emit();
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
