# Vault Agent Plugin MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a functional Obsidian plugin named Vault Agent with provider-agnostic chat, command-pack discovery, safe write previews, and four core workflows.

**Architecture:** A modular TypeScript Obsidian plugin with separable layers: provider adapters, vault services, workflow engine, and UI view. Writes are staged as pending operations and applied only through explicit approval actions in the workspace view.

**Tech Stack:** TypeScript, Obsidian Plugin API, esbuild, markdown-based command packs.

---

### Task 1: Project scaffold

**Files:**
- Create: `manifest.json`, `package.json`, `tsconfig.json`, `esbuild.config.mjs`, `versions.json`
- Create: `src/main.ts`, `src/types.ts`

- [ ] Add Obsidian plugin manifest and metadata
- [ ] Add build/dev scripts with esbuild and TypeScript config
- [ ] Create initial plugin entrypoint and exported plugin class

### Task 2: Core services and models

**Files:**
- Create: `src/models/*.ts`, `src/services/*.ts`, `src/providers/*.ts`, `src/utils/*.ts`

- [ ] Add strongly-typed message/session/provider/workflow models
- [ ] Implement session manager and pending-write queue
- [ ] Implement vault read/search/update utilities and section editor
- [ ] Implement command-pack discovery and loader

### Task 3: Provider adapters

**Files:**
- Create: `src/providers/base.ts`, `src/providers/openaiCompatible.ts`, `src/providers/anthropic.ts`, `src/providers/factory.ts`

- [ ] Implement OpenAI-compatible client adapter
- [ ] Implement Anthropic adapter
- [ ] Add routing/fallback selection by workflow key

### Task 4: Workflow engine

**Files:**
- Create: `src/workflows/*.ts`, `src/engine/*.ts`

- [ ] Implement command router (slash + natural language fallback)
- [ ] Implement `/capture` workflow
- [ ] Implement `/startday` workflow
- [ ] Implement `/closeday` workflow
- [ ] Implement `/context-load` workflow

### Task 5: UI and settings integration

**Files:**
- Create: `src/ui/VaultAgentView.ts`, `src/ui/SettingsTab.ts`
- Modify: `src/main.ts`

- [ ] Build chat/workspace view with message timeline and pending approvals
- [ ] Build settings tab for providers, models, command paths, and write policy
- [ ] Wire Obsidian commands to open view and trigger key workflows

### Task 6: Documentation and handoff

**Files:**
- Create: `README.md`
- Modify: `docs/vault-agent-mvp.md`

- [ ] Document install/build/setup flow
- [ ] Document provider configuration and mobile usage pattern
- [ ] Document command-pack conventions and known limitations

