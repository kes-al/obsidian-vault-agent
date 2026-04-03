# Vault Agent (Obsidian Plugin)

Vault Agent adds an LLM workspace inside Obsidian so you can run command-driven workflows against your vault from desktop and mobile.

## Why this was built

Most Obsidian AI tools are chat-only. This plugin is built for operational workflows where an agent should:

- understand vault structure and command packs
- stage edits safely with preview/apply controls
- run recurring routines like `/startday` and `/closeday`
- work on iPhone through the existing Obsidian app

## Purpose

Vault Agent is designed as a configurable engine:

- fixed core: session state, provider adapters, vault tools, safe write pipeline
- flexible workflow layer: command packs from vault files or plain-language mode
- bring-your-own-model: local endpoint or cloud provider

The command names shown in this repository are opinionated defaults from the original author workflow. They are examples, not a universal standard. You should customize command packs and workflow behavior for your own vault structure.

## What is implemented

- Dedicated `Vault Agent` workspace view inside Obsidian.
- Session timeline with `user`, `assistant`, `tool`, and `receipt` messages.
- Pending write preview queue with `Apply` and `Skip`.
- Provider adapters:
  - Local OpenAI-compatible endpoint (for example llama.cpp)
  - OpenRouter
  - OpenAI
  - Anthropic
- Command-pack discovery from:
  - `/.vault-agent/commands/*.md`
  - `/.claude/commands/*.md`
- Default reference workflows (customize these for your own workflow):
  - `/capture`
  - `/startday`
  - `/closeday`
  - `/context-load`
- Plain chat fallback for non-slash input with vault context snippets.

## Quick install (Mac -> iPhone)

1. Build plugin:

```bash
cd /path/to/obsidian-vault-agent
npm install
npm run build
```

2. Copy plugin files to your vault:

```bash
VAULT="/path/to/your/vault"
PLUGIN_DIR="$VAULT/.obsidian/plugins/vault-agent"

mkdir -p "$PLUGIN_DIR"
cp manifest.json main.js styles.css "$PLUGIN_DIR"/
```

3. Enable in Obsidian:
- Open Obsidian.
- Go to `Settings -> Community plugins`.
- Turn off restricted mode if needed.
- Enable `Vault Agent`.

4. On iPhone:
- Wait for iCloud sync.
- Open Obsidian iOS for the same vault.
- Enable `Vault Agent` in Community Plugins.
- If it does not appear, force-close and reopen Obsidian.

## Fastest provider setup (OpenRouter free)

In `Settings -> Vault Agent`:

1. `Default provider`: `openrouter`
2. `Providers -> openrouter`:
- `Enabled`: on
- `Base URL`: `https://openrouter.ai/api/v1`
- `Model`: `openrouter/free` (random free model router)
- `API Key`: your OpenRouter key
- `Extra Headers`:
  - `HTTP-Referer: https://obsidian.md`
  - `X-Title: Vault Agent`
3. `Workflow Routing`: set all routes to `openrouter`

## Using local llama.cpp instead

Use this if you want local inference:

- Set `Providers -> local -> Base URL` to your API endpoint, for example `http://127.0.0.1:8080/v1` on desktop.
- On iPhone, `127.0.0.1` points to the phone itself. Use a reachable host (LAN/Tailscale) if model is running on your Mac.

## Mobile usage pattern

- Add command actions to mobile toolbar and/or Quick Action.
- Use `/capture` for quick task and note capture.
- Run `/startday` and `/closeday` as your daily bookends.
- Keep write policy on `preview_required` for safer mobile editing.

## Command customization

The plugin supports command packs loaded from vault folders:

- `/.vault-agent/commands/*.md`
- `/.claude/commands/*.md`

Recommended:

- keep command names and prompts specific to your own workflow
- adjust routing logic and section conventions for your vault
- treat `/capture`, `/startday`, `/closeday`, and `/context-load` as starter patterns

## Settings UX

Settings use accordion sections for mobile:

- `General`
- `Workflow Routing`
- `Providers` (provider-specific accordions)

Routing includes quick presets:

- `All -> openrouter`
- `All -> local`

## Write policy behavior

`Write policy` controls how file changes are applied:

- `preview_required`:
  - writes are staged in **Pending Writes**
  - you explicitly tap `Apply` or `Skip`
- `auto_apply`:
  - writes are applied immediately after generation
  - no pending queue interaction is required
  - the Pending Writes panel auto-hides when idle

During in-flight requests, the UI shows:

- disabled input/send button
- spinner + elapsed timer in status
- spinner + elapsed timer in Pending Writes area

## Project layout

- `src/main.ts`: plugin entrypoint and orchestration
- `src/ui/*`: workspace and settings UI
- `src/providers/*`: provider connectors
- `src/services/*`: vault I/O, command loading, pending-write storage
- `src/workflows/*`: command workflows
- `docs/vault-agent-mvp.md`: product and architecture spec

## Current limitations

- Only four default reference workflows currently perform deterministic vault writes.
- Command-pack execution currently treats command files as instruction prompts (not full deterministic interpreters).
- API keys are stored in plugin data for the vault profile, not in markdown files.
- No automated tests are included yet.
