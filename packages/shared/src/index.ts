// Types shared between api, web, and admin. Keep this package dependency-free.

export type Role = 'USER' | 'ADMIN';

export type SkillRunStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED';

export type SkillRunKind = 'research' | 'review' | 'translate' | 'dual-lang' | 'docx';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** True once the user has completed the Codex CLI device-code login. */
  codexConnected: boolean;
  /** ISO timestamp of the most recent successful Codex login (null if never). */
  codexConnectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CodexUsageSummary {
  connected: boolean;
  totals: {
    tokens: number;
    skillRuns: number;
    chatMessages: number;
  };
  last30Days: {
    tokens: number;
    skillRuns: number;
    chatMessages: number;
  };
  lastActivityAt: string | null;
}

export interface CodexStatusSummary {
  connected: boolean;
  connectedAt: string | null;
  activeRuns: number;
  sandboxMode: 'read-only' | 'workspace-write' | 'danger-full-access' | string;
  maxConcurrent: number;
  maxConcurrentPerUser: number;
}

/** SSE event shape streamed by GET /api/codex/connect/stream. */
export type CodexLoginEvent =
  | { type: 'starting' }
  | { type: 'awaiting-user'; verificationUrl: string; userCode: string }
  | { type: 'connected'; connectedAt: string }
  | { type: 'error'; message: string };

/** SSE event shape streamed by POST /api/codex/run (one item per JSONL line from `codex exec --json`). */
export type CodexRunEvent =
  | { type: 'codex'; event: Record<string, unknown> }
  | { type: 'connection.done'; exitCode: number | null }
  | { type: 'connection.error'; message: string };

export interface AuthSession {
  accessToken: string;
  user: User;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  clientName: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkillRun {
  id: string;
  projectId: string;
  kind: SkillRunKind;
  status: SkillRunStatus;
  /** Free-text input (client scenario for research, or draft Markdown for review/translate/...). */
  input: string;
  /** Markdown output. Updated as the stream progresses. */
  output: string | null;
  /** Secondary output (review changelog, translation notes, etc.). */
  sideOutput: string | null;
  errorMessage: string | null;
  /** Total token usage (input + output) once the run finishes. */
  tokenUsage: number | null;
  citations: Citation[] | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface Citation {
  title: string;
  url: string;
  snippet?: string;
}

/** SSE event shape streamed by GET /api/skills/runs/:id/stream. */
export type SkillStreamEvent =
  | { type: 'status'; status: SkillRunStatus }
  | { type: 'token'; text: string }
  | { type: 'citation'; citation: Citation }
  | { type: 'done'; task: SkillRun }
  | { type: 'error'; message: string };

export interface CreateProjectInput {
  name: string;
  clientName?: string;
  description?: string;
}

export interface StartSkillInput {
  projectId: string;
  kind: SkillRunKind;
  /** Free-form input. For 'review', this is the draft to review. */
  input: string;
  /** Override the LLM model (admin only). */
  model?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SkillSummary {
  id: SkillRunKind;
  labelVi: string;
  labelEn: string;
  descriptionVi: string;
  needsWebSearch: boolean;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Chat — conversational interface to Codex CLI. A ChatSession holds many
 * ChatMessages; each assistant message accumulates structured events
 * (reasoning, tool calls, file changes) as the turn streams.
 * ────────────────────────────────────────────────────────────────────────── */

export type ChatSessionKind = 'research' | 'review' | 'translate' | 'dual-lang' | 'free';

export type ChatMessageRole = 'user' | 'assistant';

export type ChatMessageStatus =
  | 'pending'
  | 'streaming'
  | 'complete'
  | 'failed'
  | 'cancelled';

/** Structured events persisted on assistant messages, replayed on page load. */
export type ChatTurnEvent =
  | { type: 'reasoning'; text: string }
  | { type: 'tool_call'; toolCallId: string; name: string; argsText: string; output?: string; exitCode?: number }
  | { type: 'file_change'; path: string; change: 'create' | 'modify' | 'delete'; diff?: string };

export interface ChatSession {
  id: string;
  projectId: string;
  kind: ChatSessionKind;
  title: string;
  codexSessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  /** Assistant-only. Parsed from eventsJson. */
  events: ChatTurnEvent[] | null;
  tokenUsage: number | null;
  status: ChatMessageStatus;
  errorMessage: string | null;
  createdAt: string;
  finishedAt: string | null;
}

/** Live SSE event shape streamed by GET /api/chat/sessions/:id/messages/:msgId/stream. */
export type ChatStreamEvent =
  | { type: 'reasoning.delta'; text: string }
  | { type: 'tool_call.start'; toolCallId: string; name: string; argsText: string }
  | { type: 'tool_call.output'; toolCallId: string; output: string; exitCode?: number }
  | { type: 'file_change'; path: string; change: 'create' | 'modify' | 'delete'; diff?: string }
  | { type: 'assistant.delta'; text: string }
  | { type: 'usage'; tokens: number }
  | { type: 'done'; message: ChatMessage; session: ChatSession }
  | { type: 'error'; message: string };

export interface CreateChatSessionInput {
  projectId: string;
  kind: ChatSessionKind;
  /** First user message; becomes the seed for the session title. */
  firstMessage: string;
}

export interface AppendChatMessageInput {
  content: string;
}

/* ──────────────────────────────────────────────────────────────────────────
 * News — aggregated bulletin from Vietnamese legal-news RSS feeds.
 * ────────────────────────────────────────────────────────────────────────── */

export type NewsSourceId =
  | 'thuvienphapluat'
  | 'baochinhphu'
  | 'moj'
  | 'tapchitoaan'
  | 'luatvietnam';

export interface NewsSource {
  id: NewsSourceId;
  label: string;
  homepage: string;
}

export interface NewsArticle {
  id: string;
  source: NewsSourceId;
  sourceUrl: string;
  articleUrl: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: string;
  fetchedAt: string;
}

export interface NewsPage {
  items: NewsArticle[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** SSE event shape streamed by GET /api/news/:id/summarize/stream. */
export type NewsSummaryEvent =
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

/* ──────────────────────────────────────────────────────────────────────────
 * Files — per-project workspace tree under Codex CLI's --cd target.
 * ────────────────────────────────────────────────────────────────────────── */

export type FileNodeKind = 'folder' | 'file';

export interface FileNode {
  /** Path relative to the project workspace root. '' for the root itself. */
  path: string;
  /** Last segment of the path (display label). */
  name: string;
  kind: FileNodeKind;
  /** Byte size for files; null for folders. */
  size: number | null;
  /** ISO timestamp from mtime. */
  modifiedAt: string;
  /** Children present only when kind === 'folder'. */
  children?: FileNode[];
}

export interface FileTreeResponse {
  root: FileNode;
}

export interface FileContentResponse {
  path: string;
  content: string;
  size: number;
  modifiedAt: string;
}

export interface CreateNodeInput {
  kind: FileNodeKind;
  /** Relative path to create. Must not escape the workspace. */
  path: string;
  /** Initial text content for `kind: 'file'`. Defaults to ''. */
  content?: string;
}

export interface UpdateContentInput {
  path: string;
  content: string;
}

export interface MoveNodeInput {
  from: string;
  to: string;
}
