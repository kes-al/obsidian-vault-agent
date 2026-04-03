# Vault Agent MVP Spec

## 1. Product Goal

Vault Agent is an Obsidian plugin that adds an agent workspace inside the vault.

Primary outcomes:
- Run agent workflows (slash-command style or plain language) against vault data.
- Support interactive approval loops for writes and routing decisions.
- Work on desktop and mobile Obsidian (plugin-first), with no separate iOS app required for MVP.

## 2. Scope

### In scope (MVP)
- Obsidian plugin with a dedicated "Vault Agent" view.
- Provider-agnostic LLM connector (OpenRouter, OpenAI, Anthropic, Local OpenAI-compatible endpoint).
- Command-pack loader from vault files.
- Plain-language mode when no command pack exists.
- Safe write pipeline with preview + explicit apply.
- First validated workflows:
  - `/capture`
  - `/startday`
  - `/closeday`
  - `/context-load`

### Out of scope (MVP)
- Native iOS app + custom share extension.
- Fully on-device model runtime inside plugin.
- Advanced multi-agent orchestration.
- Full parity for every existing command file on day 1.

## 3. Core Principles

- Engine fixed, workflow configurable.
- Commands are optional overlays, not required to use the product.
- Vault is source of truth; config should be portable and user-owned.
- Writes are explicit and reversible-minded (preview before apply).

## 4. System Architecture

## 4.1 Plugin modules

1. UI Layer
- Agent workspace view (chat, tool traces, pending approvals, receipts).
- Command runner panel (discover and launch commands).
- Settings panel (providers, policies, paths).

2. Orchestration Layer
- Session manager (message history + run state).
- Planner/router (slash command vs plain-language intent).
- Approval state machine (`pending_confirmation`, `applied`, `cancelled`).

3. Tool Layer
- Vault tools (read/list/search/write/append/update section).
- Context tools (entity lookup, daily note resolver, task parser).
- Command-pack tool (load/parse command definitions).

4. Provider Layer
- Unified `ModelProvider` interface.
- Connectors: OpenRouter, OpenAI, Anthropic, Local endpoint.

## 4.2 Data flow

1. User sends message in Vault Agent view.
2. Router determines:
- explicit command (`/capture ...`), or
- plain-language intent.
3. Planner builds tool calls + model prompt.
4. Model returns candidate actions.
5. If write action and approval required -> queue preview.
6. User approves/edits/rejects.
7. Tool applies write.
8. Receipt logged in session timeline.

## 5. Configurability Model

## 5.1 Command packs

Default load order:
1. `/.vault-agent/commands/*.md`
2. `/.claude/commands/*.md`
3. Built-in fallback commands

Manifest file (optional): `/.vault-agent/manifest.json`

```json
{
  "name": "My Workflow Pack",
  "version": "1.0.0",
  "commandsPath": ".vault-agent/commands",
  "defaultMode": "mixed"
}
```

## 5.2 Workflow profile

File: `/.vault-agent/profile.json`

```json
{
  "dailyNotesPath": "daily-notes",
  "dailyDateFormat": "YYYY-MM-DD",
  "sections": {
    "tasks": "## Tasks",
    "work": "### Work",
    "personal": "### Personal",
    "suggested": "## Suggested Tasks",
    "workLog": "## Work Log",
    "ideas": "## Ideas",
    "endOfDay": "## End of Day"
  },
  "task": {
    "blockIdPattern": "^t-MMDD-NNN",
    "priorityMarkers": ["❗", "🔼"]
  },
  "entitiesFile": "_meta/entities.md"
}
```

## 5.3 Model config

Stored in plugin data (not vault):

```json
{
  "defaultProvider": "openrouter",
  "providers": {
    "openrouter": {"apiKeyRef": "keychain:openrouter", "model": "openrouter/free"},
    "openai": {"apiKeyRef": "keychain:openai", "model": "gpt-4.1-mini"},
    "anthropic": {"apiKeyRef": "keychain:anthropic", "model": "claude-3-7-sonnet"},
    "local": {"baseUrl": "http://127.0.0.1:8080/v1", "model": "ggml-org/gemma-4-26B-A4B-it-GGUF:Q4_K_M"}
  },
  "routing": {
    "capture": "local",
    "startday": "openrouter",
    "closeday": "openrouter",
    "context-load": "openrouter"
  }
}
```

## 5.4 Policy config

```json
{
  "writePolicy": "preview_required",
  "allowedWriteRoots": ["/", "daily-notes", "intake", "agent-output"],
  "cloudSendPolicy": {
    "mode": "allow_all",
    "denyPaths": ["work/clients/**/files/**"]
  }
}
```

## 6. UX Specification

## 6.1 Main view

Panels:
- Chat timeline
- Tool/action trace (collapsible)
- Pending approvals queue
- Run receipt

Message types:
- user
- assistant
- tool action
- approval card
- receipt

## 6.2 Approval card

For every write candidate:
- target file
- section/path
- diff preview
- actions: `Apply`, `Edit`, `Skip`

## 6.3 Command launcher

- Searchable command list from discovered command packs.
- Category tags if inferred from command filename or metadata.
- One-tap run with argument prompt.

## 6.4 Mobile usage inside Obsidian

- Expose commands so user can add them to mobile toolbar and Quick Action.
- Keep interactions short, button-driven where possible.
- Persist unfinished sessions for resume after app/background interruptions.

## 7. Workflow Semantics (MVP-critical)

1. Open day rule
- "Today" = most recent daily note with empty `## End of Day`.

2. Task semantics
- `/capture` task goes to `Tasks > Work`.
- `/ingest-meeting`-style extraction goes to `Suggested Tasks`.

3. Block IDs
- Preserve existing IDs.
- Assign only when missing.
- Deduplicate by block ID for carry-forward logic.

4. Read-before-write
- Always read target file before mutation.
- Prefer section-based updates over whole-file rewrite.

## 8. Security and Privacy

- API keys never stored in vault files.
- Keys kept in plugin private storage / secure platform storage if available.
- Strict path checks for all write operations.
- Optional local-only mode (no remote API calls).
- Redaction hooks for cloud-bound prompts (future enhancement).

## 9. Implementation Plan

## Phase A: Scaffold (1-2 days)
- Plugin skeleton
- Vault Agent custom view
- Settings tab
- Session store

## Phase B: Providers (1-2 days)
- Unified provider interface
- OpenRouter connector
- Local OpenAI-compatible connector
- Basic error/retry handling

## Phase C: Command pack + plain mode (2-3 days)
- Discover command files
- Parse and run command prompts
- Plain-language fallback with tool routing

## Phase D: Safe writes + receipts (2-3 days)
- Approval cards + diff previews
- Apply/skip/edit flow
- Receipt generator

## Phase E: First workflows (3-5 days)
- `/capture`
- `/startday`
- `/closeday`
- `/context-load`
- Validate behavior against your current vault conventions

## 10. Definition of Done (MVP)

- User can install plugin and configure at least one provider.
- User can run 4 core workflows end-to-end with safe writes.
- User can load commands from vault command pack files.
- User can use plain language if no commands exist.
- Mobile Obsidian can run the same core workflows through plugin commands.

## 11. Post-MVP

- Full command-pack compatibility for all existing slash commands.
- Share-sheet-first native iOS app companion.
- On-device small model option (`Qwen3-0.6B` class) outside plugin runtime.
- Multi-vault and remote vault adapters.

