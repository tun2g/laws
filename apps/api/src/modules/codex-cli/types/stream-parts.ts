/** Higher-level "skill" interface (used by SkillsService). */
export type SkillStreamPart =
  | { kind: 'token'; text: string }
  | { kind: 'done'; fullText: string; tokenUsage: number | null }
  | { kind: 'error'; message: string };

/**
 * Structured chat events derived from raw Codex JSONL. Persisted on
 * `chat_messages.eventsJson` and rendered as cards in the chat UI.
 */
export type ChatStreamPart =
  | { kind: 'session-id'; sessionId: string }
  | { kind: 'reasoning.delta'; text: string }
  | { kind: 'tool_call.start'; toolCallId: string; name: string; argsText: string }
  | { kind: 'tool_call.output'; toolCallId: string; output: string; exitCode?: number }
  | { kind: 'file_change'; path: string; change: 'create' | 'modify' | 'delete'; diff?: string }
  | { kind: 'assistant.delta'; text: string }
  | { kind: 'usage'; tokens: number }
  | { kind: 'done'; fullText: string; tokenUsage: number | null }
  | { kind: 'error'; message: string };
