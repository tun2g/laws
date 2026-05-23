/** Events emitted on the device-code login SSE stream. */
export type CodexLoginEvent =
  | { type: 'starting' }
  | { type: 'awaiting-user'; verificationUrl: string; userCode: string }
  | { type: 'connected'; connectedAt: string }
  | { type: 'error'; message: string };

/**
 * Events emitted on the run SSE stream. We pass through whatever `codex exec
 * --json` writes (it's already a clean event stream) and add a final
 * `connection.done` marker so the client knows the stream ended cleanly.
 */
export type CodexRunEvent =
  | { type: 'codex'; event: Record<string, unknown> }
  | { type: 'connection.done'; exitCode: number | null }
  | { type: 'connection.error'; message: string };
