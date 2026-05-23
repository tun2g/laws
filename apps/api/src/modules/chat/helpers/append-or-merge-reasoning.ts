import type { ChatTurnEvent } from '@laws/shared';

/** Merge contiguous reasoning deltas into one event so the UI sees one block. */
export function appendOrMergeReasoning(events: ChatTurnEvent[], text: string): void {
  const last = events[events.length - 1];
  if (last && last.type === 'reasoning') {
    last.text += text;
    return;
  }
  events.push({ type: 'reasoning', text });
}
