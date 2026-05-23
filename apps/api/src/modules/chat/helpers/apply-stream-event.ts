import type { ChatTurnEvent } from '@laws/shared';
import type { ChatSession } from '../entities/chat-session.entity';
import type { ChatMessage } from '../entities/chat-message.entity';
import type { ChatStreamPart } from '../../codex-cli/types/stream-parts';
import type { ChatRepos, ChatStreamSink } from '../types/repos';
import { appendOrMergeReasoning } from './append-or-merge-reasoning';

/**
 * Apply a single ChatStreamPart to the in-flight session + assistant message.
 * Mutates `session`, `assistantMsg`, and `events` in place; persists to DB so
 * a page reload mid-stream shows partial state. Forwards a public event to
 * the SSE subscriber when appropriate.
 */
export async function applyPartToMessage(
  repos: ChatRepos,
  session: ChatSession,
  assistantMsg: ChatMessage,
  events: ChatTurnEvent[],
  part: ChatStreamPart,
  sink: ChatStreamSink,
): Promise<void> {
  switch (part.kind) {
    case 'session-id':
      if (!session.codexSessionId) {
        session.codexSessionId = part.sessionId;
        await repos.sessions.save(session);
      }
      break;
    case 'reasoning.delta':
      appendOrMergeReasoning(events, part.text);
      sink.next({ type: 'reasoning.delta', text: part.text });
      break;
    case 'tool_call.start':
      events.push({
        type: 'tool_call',
        toolCallId: part.toolCallId,
        name: part.name,
        argsText: part.argsText,
      });
      sink.next({
        type: 'tool_call.start',
        toolCallId: part.toolCallId,
        name: part.name,
        argsText: part.argsText,
      });
      break;
    case 'tool_call.output': {
      const existing = events.find(
        (e): e is Extract<ChatTurnEvent, { type: 'tool_call' }> =>
          e.type === 'tool_call' && e.toolCallId === part.toolCallId,
      );
      if (existing) {
        existing.output = part.output;
        existing.exitCode = part.exitCode;
      } else {
        events.push({
          type: 'tool_call',
          toolCallId: part.toolCallId,
          name: 'unknown',
          argsText: '',
          output: part.output,
          exitCode: part.exitCode,
        });
      }
      sink.next({
        type: 'tool_call.output',
        toolCallId: part.toolCallId,
        output: part.output,
        exitCode: part.exitCode,
      });
      break;
    }
    case 'file_change':
      events.push({
        type: 'file_change',
        path: part.path,
        change: part.change,
        diff: part.diff,
      });
      sink.next({
        type: 'file_change',
        path: part.path,
        change: part.change,
        diff: part.diff,
      });
      break;
    case 'assistant.delta':
      assistantMsg.content += part.text;
      sink.next({ type: 'assistant.delta', text: part.text });
      break;
    case 'usage':
      assistantMsg.tokenUsage = part.tokens;
      sink.next({ type: 'usage', tokens: part.tokens });
      break;
  }
  assistantMsg.eventsJson = JSON.stringify(events);
  await repos.messages.save(assistantMsg);
}

/** Final write to the assistant row when the turn ends (done or error). */
export async function finalizeMessage(
  repos: ChatRepos,
  assistantMsg: ChatMessage,
  events: ChatTurnEvent[],
  fullText: string,
  tokenUsage: number | null,
  status: 'complete' | 'failed',
  errorMessage: string | null,
): Promise<void> {
  if (fullText && fullText !== assistantMsg.content) {
    assistantMsg.content = fullText;
  }
  assistantMsg.eventsJson = JSON.stringify(events);
  if (tokenUsage !== null) assistantMsg.tokenUsage = tokenUsage;
  assistantMsg.status = status;
  assistantMsg.errorMessage = errorMessage;
  assistantMsg.finishedAt = new Date();
  await repos.messages.save(assistantMsg);
}
