/**
 * Parses Vietnamese-localized RSS pubDates, e.g.
 *   "Sáu, 22 Thg5 2026 16:17:04GMT"
 *   "Hai, 23/05/2026 14:30:00"
 * Returns null if the string doesn't match.
 */
export function parseVietnameseDate(input: string): Date | null {
  // Pattern A: "<weekday>?, <day> Thg<month> <year> <H>:<M>:<S>(GMT|UTC|±HHMM)?"
  const a = input.match(
    /(\d{1,2})\s+Thg\s*(\d{1,2})\s+(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(GMT|UTC|[+-]\d{2}:?\d{2})?/i,
  );
  if (a) {
    const [, day, month, year, hh, mm, ss, tz] = a;
    const iso = `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}T${hh!.padStart(2, '0')}:${mm}:${ss}${tzToOffset(tz)}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d;
  }
  // Pattern B: "<weekday>?, dd/mm/yyyy HH:MM:SS"
  const b = input.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (b) {
    const [, day, month, year, hh, mm, ss] = b;
    const iso = `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}T${hh!.padStart(2, '0')}:${mm}:${ss}+07:00`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function tzToOffset(tz: string | undefined): string {
  if (!tz || /^(GMT|UTC)$/i.test(tz)) return 'Z';
  return tz.includes(':') ? tz : `${tz.slice(0, 3)}:${tz.slice(3)}`;
}
