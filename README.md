# Vault Agent (Obsidian Plugin)

Vault Agent is a plugin-first agent workspace for Obsidian. It lets you run slash-style workflows and plain-language vault interactions with configurable LLM providers.

## What is implemented

- Dedicated `Vault Agent` workspace view inside Obsidian.
- Session timeline with user/assistant/tool/receipt messages.
- Pending write preview queue with `Apply` and `Skip` controls.
- Provider adapters:
  - Local OpenAI-compatible endpoint (e.g. llama.cpp)
  - OpenRouter
  - OpenAI
  - Anthropic
- Command-pack discovery from vault paths:
  - `/.vault-agent/commands/*.md`
  - `/.claude/commands/*.md`
- Built-in workflow handlers:
  - `/capture`
  - `/startday`
  - `/closeday`
  - `/context-load`
- Plain chat fallback (non-slash input) with vault snippet retrieval.

## Project layout

- `src/main.ts` plugin entrypoint and orchestration.
- `src/ui/*` workspace and settings UI.
- `src/providers/*` provider connectors.
- `src/services/*` vault I/O, command loading, write-op storage.
- `src/workflows/*` command workflows.
- `docs/vault-agent-mvp.md` product and architecture spec.

## Install for local development

1. Install dependencies:
```bash
npm install
```

2. Build plugin:
```bash
npm run build
```

3. Copy these files into your vault plugin directory:
- `manifest.json`
- `main.js`
- `styles.css`

Target folder:
`<your-vault>/.obsidian/plugins/vault-agent/`

4. In Obsidian:
- Settings -> Community plugins -> turn on `Vault Agent`.

## Configure providers

Open:
Settings -> Vault Agent

For each provider you can set:
- `Enabled`
- `Base URL`
- `Model`
- `API Key`
- `Extra Headers`

Routing is configurable per workflow key:
- `capture`
- `startday`
- `closeday`
- `context-load`
- `default`

## Mobile usage

Because this is an Obsidian plugin, you can use it on Obsidian mobile.

Recommended:
- Add key commands to mobile toolbar or Quick Action.
- Use `/capture` for quick mobile task capture.
- Use `/startday` and `/closeday` for daily bookends.

## Notes and current limitations

- Write operations are generated as pending previews by default (`preview_required`).
- Command-pack files are discovered and can be used as instruction prompts, but only the four built-in workflows currently perform deterministic vault edits.
- API keys are stored in plugin data (vault-local plugin storage), not in markdown files.
- This repository currently does not include automated tests.
