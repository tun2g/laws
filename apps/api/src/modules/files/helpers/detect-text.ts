/**
 * Cheap binary sniff — check the first 512 bytes for a NUL or a high ratio
 * of non-printable bytes. Anything that survives is treated as text.
 */
export function looksLikeText(buf: Buffer): boolean {
  const slice = buf.subarray(0, Math.min(buf.length, 512));
  if (slice.includes(0)) return false;
  let nonPrintable = 0;
  for (const b of slice) {
    if (b === 9 || b === 10 || b === 13) continue;
    if (b < 32 || b === 127) nonPrintable++;
  }
  return nonPrintable / Math.max(1, slice.length) < 0.1;
}
