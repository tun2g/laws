import type { ChatMessage, ChatStreamEvent, ChatTurnEvent } from '@laws/shared';

/**
 * Pure reducer-style applier: take an incoming SSE event + the current
 * assistant message, return the next assistant message. Keeps the chat page
 * thin by centralising the event-to-state mapping.
 *
 * Returns null for events that don't mutate the assistant row (`done` and
 * `error` are handled at the page level since they touch other state).
 */
export function applyStreamEventToAssistant(
  msg: ChatMessage,
  event: ChatStreamEvent,
): ChatMessage | null {
  if (event.type === 'assistant.delta') {
    return { ...msg, status: 'streaming', content: msg.content + event.text };
  }
  if (event.type === 'reasoning.delta') {
    return { ...msg, events: mergeReasoning(msg.events, event.text) };
  }
  if (event.type === 'tool_call.start') {
    return {
      ...msg,
      events: [
        ...(msg.events ?? []),
        {
          type: 'tool_call',
          toolCallId: event.toolCallId,
          name: event.name,
          argsText: event.argsText,
        },
      ],
    };
  }
  if (event.type === 'tool_call.output') {
    return {
      ...msg,
      events: (msg.events ?? []).map((e) =>
        e.type === 'tool_call' && e.toolCallId === event.toolCallId
          ? { ...e, output: event.output, exitCode: event.exitCode }
          : e,
      ),
    };
  }
  if (event.type === 'file_change') {
    return {
      ...msg,
      events: [
        ...(msg.events ?? []),
        {
          type: 'file_change',
          path: event.path,
          change: event.change,
          diff: event.diff,
        },
      ],
    };
  }
  if (event.type === 'usage') {
    return { ...msg, tokenUsage: event.tokens };
  }
  return null;
}

function mergeReasoning(events: ChatTurnEvent[] | null, text: string): ChatTurnEvent[] {
  const list = events ? [...events] : [];
  const last = list[list.length - 1];
  if (last && last.type === 'reasoning') {
    list[list.length - 1] = { ...last, text: last.text + text };
    return list;
  }
  list.push({ type: 'reasoning', text });
  return list;
}
