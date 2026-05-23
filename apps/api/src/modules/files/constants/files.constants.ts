/** Directory name that is silently filtered from the tree + blocked for any
 * direct operation. This is where Codex CLI may persist state inside the
 * workspace; users shouldn't see or touch it. */
export const HIDDEN_DIRS = new Set<string>(['.codex']);

/** Hard cap on text-edit payload size. */
export const MAX_TEXT_BYTES = 5 * 1024 * 1024;

/** Hard cap on multipart upload size. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Threshold above which a file is treated as binary even if it would parse as text. */
export const TEXT_PREVIEW_THRESHOLD_BYTES = MAX_TEXT_BYTES;

/** Path segments that are never allowed in a relative file path. */
export const FORBIDDEN_PATH_SEGMENTS = new Set<string>(['', '.', '..']);
