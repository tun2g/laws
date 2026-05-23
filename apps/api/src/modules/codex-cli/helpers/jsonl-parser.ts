/**
 * Parsers for Codex CLI's `exec --json` output (v0.133.0 verified).
 *
 * Observed event taxonomy:
 *   { type: "turn.started" }
 *   { type: "turn.completed", usage?: {...} }
 *   { type: "item.started",   item: { id, type: "agent_message" | "web_search" | "reasoning" | ..., ... } }
 *   { type: "item.completed", item: { id, type, text?, query?, action?, ... } }
 *   { type: "session.created" | "session.configured", session_id?, ... }   (varies)
 *
 * Item subtypes seen so far:
 *   - agent_message     → assistant text (item.text contains the full message)
 *   - web_search        → tool call; item.query / item.action.queries hold the search args
 *   - reasoning         → chain-of-thought (item.text)
 *
 * The helpers below dispatch on `event.type` first (turn / item envelope),
 * then on `event.item.type` for the inner kind. Older shapes from before
 * v0.133 are still tolerated as a fallback.
 */

import type { ChatStreamPart } from '../types/stream-parts';

export function mapCodexEventToChatParts(
  event: Record<string, unknown>,
  accumulatedAssistantText: string,
): ChatStreamPart[] {
  const out: ChatStreamPart[] = [];
  const type = typeof event['type'] === 'string' ? (event['type'] as string) : '';

  const sessionId = extractSessionId(event);
  if (sessionId) out.push({ kind: 'session-id', sessionId });

  const usage = extractTokenUsage(event);
  if (usage !== null) out.push({ kind: 'usage', tokens: usage });

  // ── Codex v0.133 envelope: item.started / item.completed ────────────
  if (type === 'item.started' || type === 'item.completed') {
    const item = (event['item'] as Record<string, unknown> | undefined) ?? {};
    const itemType = typeof item['type'] === 'string' ? (item['type'] as string) : '';
    const itemId = typeof item['id'] === 'string' ? (item['id'] as string) : `item_${Date.now()}`;

    if (itemType === 'agent_message') {
      const text = typeof item['text'] === 'string' ? (item['text'] as string) : '';
      const delta = computeDelta(text, accumulatedAssistantText);
      if (delta) out.push({ kind: 'assistant.delta', text: delta });
      return out;
    }

    if (itemType === 'reasoning') {
      const text = typeof item['text'] === 'string' ? (item['text'] as string) : '';
      if (text) out.push({ kind: 'reasoning.delta', text });
      return out;
    }

    if (itemType === 'web_search') {
      const query = typeof item['query'] === 'string' ? (item['query'] as string) : '';
      const action = (item['action'] as Record<string, unknown> | undefined) ?? {};
      const queries = Array.isArray(action['queries']) ? (action['queries'] as string[]) : [];

      if (type === 'item.started') {
        out.push({
          kind: 'tool_call.start',
          toolCallId: itemId,
          name: 'web_search',
          argsText: query,
        });
      } else {
        // Completed: surface the resolved query(ies) as the output.
        const display = queries.length > 0 ? queries.join('\n') : query;
        if (type === 'item.completed' && !out.find((p) => p.kind === 'tool_call.start')) {
          // Emit start *and* output for completed events that were never
          // preceded by a started event (defensive).
          out.push({ kind: 'tool_call.start', toolCallId: itemId, name: 'web_search', argsText: query });
        }
        out.push({
          kind: 'tool_call.output',
          toolCallId: itemId,
          output: display || '(no result)',
          exitCode: 0,
        });
      }
      return out;
    }

    // Generic tool call we don't have a special shape for — render as a
    // tool_call card with the item.type as the tool name.
    if (itemType && itemType !== 'agent_message') {
      const argsText =
        pickString(item, ['query', 'command', 'input', 'arguments', 'args']) ?? '';
      if (type === 'item.started') {
        out.push({ kind: 'tool_call.start', toolCallId: itemId, name: itemType, argsText });
      } else {
        const output = pickString(item, ['output', 'text', 'result', 'stdout']) ?? '';
        out.push({ kind: 'tool_call.output', toolCallId: itemId, output, exitCode: 0 });
      }
      return out;
    }
  }

  // ── turn lifecycle events — usage may piggyback here ───────────────
  if (type === 'turn.started' || type === 'turn.completed') return out;

  // ── Pre-v0.133 fallbacks (kept for compatibility) ──────────────────
  const lower = type.toLowerCase();
  if (lower.includes('reasoning')) {
    const text = extractDeltaOrText(event);
    if (text) out.push({ kind: 'reasoning.delta', text });
    return out;
  }
  if (lower.includes('tool') || lower.includes('exec') || lower.includes('command')) {
    const toolCallId = pickString(event, ['call_id', 'tool_call_id', 'id']) ?? `call_${Date.now()}`;
    if (lower.includes('start')) {
      out.push({
        kind: 'tool_call.start',
        toolCallId,
        name: pickString(event, ['name', 'tool_name']) ?? type,
        argsText: pickString(event, ['command', 'arguments', 'args', 'input']) ?? '',
      });
    } else {
      out.push({
        kind: 'tool_call.output',
        toolCallId,
        output: pickString(event, ['output', 'stdout', 'result']) ?? '',
      });
    }
    return out;
  }
  if (lower.includes('patch') || lower.includes('file_change')) {
    const path = pickString(event, ['path', 'file', 'filename']);
    if (path) {
      out.push({
        kind: 'file_change',
        path,
        change: (pickString(event, ['change', 'operation', 'op']) ?? 'modify') as 'create' | 'modify' | 'delete',
        diff: pickString(event, ['diff', 'patch', 'content']) ?? undefined,
      });
    }
    return out;
  }

  // Last resort: anything with a text-shaped field becomes assistant delta.
  const delta = extractAgentTextDelta(event, accumulatedAssistantText);
  if (delta) out.push({ kind: 'assistant.delta', text: delta });
  return out;
}

/** Public so SkillsService (legacy one-shot path) can still call it. */
export function extractAgentTextDelta(
  event: Record<string, unknown>,
  accumulated: string,
): string | null {
  // Modern shape first: item-envelope with agent_message.
  if ((event['type'] === 'item.completed' || event['type'] === 'item.started') && event['item']) {
    const item = event['item'] as Record<string, unknown>;
    if (item['type'] === 'agent_message' && typeof item['text'] === 'string') {
      return computeDelta(item['text'] as string, accumulated);
    }
    return null;
  }

  const type = typeof event['type'] === 'string' ? (event['type'] as string).toLowerCase() : '';
  const isClearlyNotText =
    type.includes('tool') ||
    type.includes('exec') ||
    type.includes('command') ||
    type.includes('patch') ||
    type.includes('reasoning') ||
    type.includes('error') ||
    type.includes('usage') ||
    type.includes('token_count') ||
    type.includes('session') ||
    type.includes('turn.') ||
    type.includes('item.started');
  if (isClearlyNotText) return null;

  if (typeof event['delta'] === 'string' && (event['delta'] as string).length > 0) {
    return event['delta'] as string;
  }
  const candidate = pickText(event);
  if (!candidate) return null;
  return computeDelta(candidate, accumulated);
}

export function extractTokenUsage(event: Record<string, unknown>): number | null {
  const usage = event['usage'] ?? event['token_usage'] ?? event['tokens'];
  if (usage && typeof usage === 'object') {
    const u = usage as Record<string, unknown>;
    const input = typeof u['input_tokens'] === 'number' ? (u['input_tokens'] as number) : 0;
    const output = typeof u['output_tokens'] === 'number' ? (u['output_tokens'] as number) : 0;
    const total = typeof u['total_tokens'] === 'number' ? (u['total_tokens'] as number) : 0;
    if (total > 0) return total;
    if (input + output > 0) return input + output;
  }
  return null;
}

function computeDelta(candidate: string, accumulated: string): string | null {
  if (!candidate) return null;
  if (candidate.length > accumulated.length && candidate.startsWith(accumulated)) {
    return candidate.slice(accumulated.length);
  }
  if (!accumulated) return candidate;
  return candidate.length > accumulated.length ? candidate.slice(accumulated.length) : null;
}

function extractSessionId(event: Record<string, unknown>): string | null {
  for (const key of ['session_id', 'sessionId', 'session']) {
    const v = event[key];
    if (typeof v === 'string' && v.length > 0) return v;
    if (v && typeof v === 'object') {
      const inner = (v as Record<string, unknown>)['id'];
      if (typeof inner === 'string' && inner.length > 0) return inner;
    }
  }
  return null;
}

function extractDeltaOrText(event: Record<string, unknown>): string | null {
  if (typeof event['delta'] === 'string' && (event['delta'] as string).length > 0) {
    return event['delta'] as string;
  }
  return pickText(event);
}

export function pickText(event: Record<string, unknown>): string | null {
  for (const key of ['text', 'content', 'message', 'value']) {
    const v = event[key];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  for (const key of ['item', 'message', 'agent_message', 'data']) {
    const nested = event[key];
    if (nested && typeof nested === 'object') {
      const inner = pickText(nested as Record<string, unknown>);
      if (inner) return inner;
    }
  }
  return null;
}

function pickString(event: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = event[key];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return null;
}

export function buildInitialPrompt(
  systemPrompt: string,
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>,
  newUserMessage: string,
): string {
  if (transcript.length === 0) {
    return `${systemPrompt}\n\n---\n\nUser:\n${newUserMessage}`;
  }
  const replay = transcript
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}:\n${m.content}`)
    .join('\n\n');
  return `${systemPrompt}\n\n---\n\n${replay}\n\nUser:\n${newUserMessage}`;
}
