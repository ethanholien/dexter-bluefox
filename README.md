# Dexter-BlueFox

A fork of [virattt/dexter](https://github.com/virattt/dexter) wrapped in an HTTP API for [BlueFox Test Lab](https://bluefox.ai) agent evaluation.

Dexter is an autonomous financial research agent that uses multi-step tool use, task planning, and real-time market data to answer complex financial questions. This fork adds a thin HTTP wrapper matching the Fox Agent Factory API contract — zero changes to Dexter's core agent code.

## Live Deployment

| | |
|---|---|
| **URL** | https://dexter-bluefox-production.up.railway.app |
| **Platform** | Railway ("Fox Agent Fleet" project) |
| **Model** | gpt-4o-mini |

Quick test:
```bash
# Health check
curl https://dexter-bluefox-production.up.railway.app/health

# Agent info
curl https://dexter-bluefox-production.up.railway.app/info

# Chat
curl -X POST https://dexter-bluefox-production.up.railway.app/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What was Apple revenue in FY2024?"}'
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/info` | GET | Agent metadata and capabilities |
| `/chat` | POST | Send a message, get agent response |

### POST /chat

**Request:**
```json
{
  "message": "What was Apple's revenue in FY2024?",
  "conversation_id": "conv_abc123"  // optional, for multi-turn
}
```

**Response:**
```json
{
  "response": "Apple's total revenue for FY2024 was $391.04 billion...",
  "conversation_id": "conv_abc123",
  "metadata": {
    "model": "gpt-4o-mini",
    "agent_id": "dexter",
    "guardrail_tier": "baseline",
    "tools_used": [
      { "tool": "financial_search", "duration": 1234 }
    ]
  }
}
```

Response extraction JSONPath: `$.response`

## What We Changed

This fork adds 3 files and modifies 1, with zero changes to Dexter's core agent:

| File | Change | Purpose |
|------|--------|---------|
| `src/server.ts` | Added | Bun.serve HTTP wrapper calling `runAgentForMessage()` |
| `Dockerfile` | Added | `oven/bun:1-slim` container for Railway |
| `railway.toml` | Added | Railway deployment config with health check |
| `package.json` | Modified | Removed Playwright postinstall (saves ~400MB), added `server` script |

## Local Development

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- OpenAI API key
- Financial Datasets API key ([financialdatasets.ai](https://financialdatasets.ai) — free tier covers AAPL, GOOGL, MSFT, NVDA, TSLA)

### Setup

```bash
git clone https://github.com/ethanholien/dexter-bluefox.git
cd dexter-bluefox
bun install

# Create .env with your API keys
cp env.example .env
# Edit .env: OPENAI_API_KEY, FINANCIAL_DATASETS_API_KEY
```

### Run

```bash
# HTTP server (for API usage)
bun run server

# Original Dexter CLI (interactive TUI)
bun start
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | Required |
| `FINANCIAL_DATASETS_API_KEY` | — | Required for financial data tools |
| `DEXTER_MODEL` | `gpt-4o-mini` | LLM model to use |
| `PORT` | `8080` | HTTP server port |
| `DEXTER_MAX_ITERATIONS` | `10` | Max agent loop iterations per request |
| `DEXTER_TIMEOUT_MS` | `120000` | Per-request timeout (ms) |

## Agent Capabilities

Dexter can research and analyze:
- Income statements, balance sheets, cash flow
- Financial metrics and ratios
- SEC filings
- Insider trades
- Analyst estimates
- Stock price data
- Web search (with Exa or Tavily API key)

## Documents

- [CLAUDE.md](CLAUDE.md) — Project context, architecture details, and deployment notes for collaborators and Claude Code

## Related

- **Upstream:** [virattt/dexter](https://github.com/virattt/dexter) — Original Dexter project
- **Fox Agent Factory:** [ethanholien/fox-agent-factory](https://github.com/ethanholien/fox-agent-factory) — ShopFox, TravelFox, HealthFox
- **BlueFox:** [bluefox.ai](https://bluefox.ai) — AI agent certification platform

## License

MIT License (inherited from upstream).
