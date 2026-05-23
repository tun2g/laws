/** Public SSE event shape, mirrors @laws/shared NewsSummaryEvent. */
export type NewsSummaryEvent =
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };
