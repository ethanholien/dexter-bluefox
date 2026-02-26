# CLAUDE.md — Dexter-BlueFox

Project context for Claude Code and shared collaborators.

## What This Repo Is

This is a **fork of [virattt/dexter](https://github.com/virattt/dexter)** (15.8K stars) — an autonomous financial research agent that uses multi-step tool use, task planning, and real-time market data to answer financial questions.

We wrapped Dexter in an HTTP API matching the **Fox Agent Factory contract** and deployed it to Railway as a test subject for **BlueFox Test Lab** (bluefox.ai) — an AI agent certification platform.

**Zero changes were made to Dexter's core agent code.** Our additions are a thin HTTP wrapper and deployment config.

## Architecture

```
POST /chat  →  src/server.ts  →  runAgentForMessage()  →  Dexter agent loop  →  JSON response
                (Bun.serve)       (gateway/agent-runner.ts)   (tools, LLM calls)
```

- `src/server.ts` — HTTP wrapper (Bun.serve). Endpoints: GET /health, GET /info, POST /chat
- `src/gateway/agent-runner.ts` — Key integration point. `runAgentForMessage()` manages sessions and agent lifecycle
- `src/providers.ts` — `resolveProvider()` routes model names to LLM providers
- `src/agent/` — Core agent logic (unchanged from upstream)
- `src/tools/registry.ts` — Tool registry: financial_search, financial_metrics, read_filings, web_fetch, browser, file tools

## API Contract

All Fox agents (ShopFox, TravelFox, HealthFox, Dexter) share this contract:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check — returns `{ status, version, model, timestamp }` |
| `/info` | GET | Agent metadata — returns `{ name, description, capabilities, endpoints }` |
| `/chat` | POST | Chat — accepts `{ message, conversation_id? }`, returns `{ response, conversation_id, metadata }` |

Response extraction JSONPath: `$.response`

## Deployment

- **Platform:** Railway (in "Fox Agent Fleet" project)
- **URL:** https://dexter-bluefox-production.up.railway.app
- **Docker:** `oven/bun:1-slim` base image, no Playwright/Chromium (saves ~400MB)
- **Port:** 8080 (Railway sets PORT env var)

### Environment Variables (Railway)

| Variable | Value | Notes |
|----------|-------|-------|
| `OPENAI_API_KEY` | (secret) | Required for gpt-4o-mini |
| `FINANCIAL_DATASETS_API_KEY` | (secret) | financialdatasets.ai — free tier covers AAPL, GOOGL, MSFT, NVDA, TSLA |
| `DEXTER_MODEL` | `gpt-4o-mini` | Configurable; any OpenAI model works |
| `PORT` | `8080` | Set by Railway |
| `DEXTER_MAX_ITERATIONS` | `10` (default) | Max agent loop iterations |
| `DEXTER_TIMEOUT_MS` | `120000` (default) | Per-request timeout in ms |

## Files We Added/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/server.ts` | Created | HTTP wrapper with /health, /info, /chat |
| `Dockerfile` | Created | Bun-based container for Railway |
| `railway.toml` | Created | Railway deployment config |
| `CLAUDE.md` | Created | This file — project context |
| `package.json` | Modified | Removed Playwright postinstall, added `server` script |

## Key Commands

```bash
bun run server        # Start HTTP server locally (needs .env with API keys)
bun start             # Original Dexter CLI (interactive TUI)
bun dev               # Dexter CLI with watch mode
bun test              # Run tests
```

## Related Repos

- **Fox Agent Factory:** https://github.com/ethanholien/fox-agent-factory — ShopFox, TravelFox, HealthFox
- **Upstream Dexter:** https://github.com/virattt/dexter — Original project by @virattt

## BlueFox Context

BlueFox Test Lab evaluates AI agents for safety, compliance, prompt injection resistance, and ad-readiness. Dexter serves as a real-world, tool-using agent test subject — more complex than the simple Fox chatbots. Phase 2 (BlueFox testing) is handled by the BlueFox backend team.
