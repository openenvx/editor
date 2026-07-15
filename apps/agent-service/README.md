# @openenvx/agent-service

Cloudflare Worker that powers the OpenEnvx AI agent sidebar via Mastra + OpenRouter.

## Features

- **Supervisor agent** with design / layout / style specialists
- **Parallel specialists** via `run-parallel-specialists` tool (`Promise.all` fan-out; avoids Mastra workflow→AJV on Workers)
- **Mastra skills** (wedding venue invitation, typography, color harmony)
- **Scene tools** (`list-layers`, `get-layer`, `get-page`) + compact scene summary
- **Proposal tools** (create / update / delete / commands) — supervisor only
- **D1 Memory** — multi-thread conversations scoped per `sceneId` (Cloudflare D1)

## Development

```bash
# From repo root
cp apps/agent-service/.dev.vars.example apps/agent-service/.dev.vars
# Add your OPENROUTER_API_KEY to .dev.vars (never commit this file)

bun run --filter @openenvx/agent-service dev
```

Default port: **8789**

Local D1 is configured in `wrangler.toml` (`binding = "DB"`). Wrangler creates a local database automatically; Mastra calls `storage.init()` on first request to create memory tables.

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/health` | Liveness check |
| POST | `/api/agent/chat` | Streaming chat with optional scene context |
| GET | `/api/agent/threads?sceneId=` | List conversation threads for a scene |
| POST | `/api/agent/threads` | Create a new thread `{ sceneId, title? }` |
| GET | `/api/agent/threads/:threadId/messages?sceneId=` | Load UI messages for a thread |
| PATCH | `/api/agent/threads/:threadId` | Rename thread `{ sceneId, title }` |
| DELETE | `/api/agent/threads/:threadId?sceneId=` | Delete a thread |

Thread routes return **503** when the D1 `DB` binding is not configured. PATCH/DELETE/chat memory writes require `sceneId` and verify thread ownership (`resourceId === sceneId`).

### Chat body

```json
{
  "messages": [{ "role": "user", "content": "…" }],
  "sceneContext": { "scene": {…}, "selection": {…}, "activePageId": "…" },
  "sceneId": "stable-document-id",
  "threadId": "uuid-conversation-id"
}
```

- `sceneId` — Mastra Memory **resource** (per editor document URI). The canvas client persists one in `localStorage` keyed by editor URI.
- `threadId` — Mastra Memory **thread** (one conversation). Required with `sceneId` for D1 persistence.
- When Memory + `sceneId` + `threadId` are present, the server stores history in D1 and only needs the latest user turn (still accepts a messages array for compatibility).

## Secrets

| Name                              | Description                                                                 |
| --------------------------------- | --------------------------------------------------------------------------- |
| `OPENROUTER_API_KEY`              | OpenRouter API key (required)                                               |
| `OPENROUTER_MODEL`                | Model id, e.g. `anthropic/claude-sonnet-4` (optional)                       |
| `OPENROUTER_REASONING_EFFORT`     | Cap thinking: `none` \| `minimal` \| `low` (default) \| `medium` \| `high`… |
| `OPENROUTER_REASONING_MAX_TOKENS` | Optional hard reasoning token budget (overrides effort when set)            |

Reasoning models (e.g. `z-ai/glm-5.2`) can spend a long time on extended thinking. Use `OPENROUTER_REASONING_EFFORT=none` to disable it, or `low` / a max-token budget to keep latency interactive. Note: some models only support a subset of effort levels (`glm-5.2` supports `high` / `xhigh`, plus disable via `none`).

## Bindings

| Binding | Type | Description              |
| ------- | ---- | ------------------------ |
| `DB`    | D1   | Mastra Memory persistence |

Local `wrangler.toml` uses `database_id = "local-openenvx-agent"` for `wrangler dev`. For Cloudflare deploy, create a real D1 database and replace `database_id` with the UUID from `wrangler d1 create openenvx-agent`.
