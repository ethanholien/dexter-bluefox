/**
 * HTTP wrapper for Dexter — exposes the agent as a REST API
 * matching the Fox Agent Factory contract for BlueFox Test Lab.
 *
 * Endpoints:
 *   GET  /health  → health check
 *   GET  /info    → agent metadata
 *   POST /chat    → send a message, get agent response
 */

import 'dotenv/config';
import { runAgentForMessage } from './gateway/agent-runner.js';
import { resolveProvider } from './providers.js';
import type { AgentEvent } from './agent/types.js';

const PORT = parseInt(process.env.PORT || '8080', 10);
const MODEL = process.env.DEXTER_MODEL || 'gpt-4o-mini';
const MAX_ITERATIONS = parseInt(process.env.DEXTER_MAX_ITERATIONS || '10', 10);
const REQUEST_TIMEOUT_MS = parseInt(process.env.DEXTER_TIMEOUT_MS || '120000', 10);

const provider = resolveProvider(MODEL);

const VERSION = '1.0.0';

function generateConversationId(): string {
  return `conv_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function handleHealth(): Promise<Response> {
  return jsonResponse({
    status: 'healthy',
    version: VERSION,
    model: MODEL,
    timestamp: new Date().toISOString(),
  });
}

async function handleInfo(): Promise<Response> {
  return jsonResponse({
    name: 'Dexter',
    description: 'AI financial research agent for deep analysis of stocks, SEC filings, and market data',
    version: VERSION,
    capabilities: [
      'financial_research',
      'sec_filing_analysis',
      'financial_metrics',
      'stock_price_data',
      'web_search',
      'multi_step_reasoning',
      'multi_turn_conversation',
    ],
    supported_categories: [
      'income_statements',
      'balance_sheets',
      'cash_flow',
      'financial_metrics',
      'insider_trades',
      'segmented_kpis',
      'analyst_estimates',
      'sec_filings',
    ],
    endpoints: {
      health: '/health',
      info: '/info',
      chat: '/chat',
    },
  });
}

async function handleChat(req: Request): Promise<Response> {
  let body: { message?: string; conversation_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const message = body.message;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return jsonResponse({ error: 'message is required and must be a non-empty string' }, 400);
  }
  if (message.length > 5000) {
    return jsonResponse({ error: 'message must be 5000 characters or fewer' }, 400);
  }

  const conversationId = body.conversation_id || generateConversationId();
  const toolsUsed: Array<{ tool: string; duration?: number }> = [];

  const onEvent = (event: AgentEvent): void => {
    if (event.type === 'tool_start') {
      toolsUsed.push({ tool: event.tool });
    }
    if (event.type === 'tool_end') {
      const entry = toolsUsed.find((t) => t.tool === event.tool && !t.duration);
      if (entry) entry.duration = event.duration;
    }
  };

  try {
    const answer = await runAgentForMessage({
      sessionKey: conversationId,
      query: message.trim(),
      model: MODEL,
      modelProvider: provider.id,
      maxIterations: MAX_ITERATIONS,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      onEvent,
    });

    return jsonResponse({
      response: answer || 'No response generated.',
      conversation_id: conversationId,
      metadata: {
        model: MODEL,
        agent_id: 'dexter',
        guardrail_tier: 'baseline',
        tools_used: toolsUsed,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('TimeoutError') || message.includes('aborted')) {
      return jsonResponse({
        response: 'Request timed out. The query may be too complex for the current timeout setting.',
        conversation_id: conversationId,
        metadata: {
          model: MODEL,
          agent_id: 'dexter',
          guardrail_tier: 'baseline',
          tools_used: toolsUsed,
          error: 'timeout',
        },
      });
    }

    console.error('Chat error:', error);
    return jsonResponse({
      response: "I'm having trouble responding right now. Please try again.",
      conversation_id: conversationId,
      metadata: {
        model: MODEL,
        agent_id: 'dexter',
        guardrail_tier: 'baseline',
        tools_used: toolsUsed,
        error: message,
      },
    });
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (url.pathname === '/health' && req.method === 'GET') {
      return handleHealth();
    }

    if (url.pathname === '/info' && req.method === 'GET') {
      return handleInfo();
    }

    if (url.pathname === '/chat' && req.method === 'POST') {
      return handleChat(req);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
});

console.log(`Dexter HTTP server running on port ${server.port}`);
console.log(`  Model: ${MODEL} (provider: ${provider.id})`);
console.log(`  Max iterations: ${MAX_ITERATIONS}`);
console.log(`  Request timeout: ${REQUEST_TIMEOUT_MS}ms`);
