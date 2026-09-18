/**
 * Flexible time parsing for sheet cells.
 *
 * Cells may contain either a time-of-day ("10:30 AM", "14:00", "9pm", "noon")
 * or a full date+time ("2026-06-22 10:30", "6/22/2026 10:30 AM"). Time-of-day
 * values are anchored to a reference day so every slot can be compared against
 * a single moment in time.
 */

export interface ParsedTime {
  /** Minutes since midnight, when the value is a plain time-of-day. */
  minutesOfDay: number | null;
  /** Absolute instant, when the value carried a calendar date. */
  date: Date | null;
}

const TIME_OF_DAY =
  /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?\s*$/i;

function wordTime(raw: string): number | null {
  const v = raw.trim().toLowerCase();
  if (v === 'noon' || v === '12 noon' || v === 'midday') return 12 * 60;
  if (v === 'midnight') return 0;
  return null;
}

/** Parse a time-of-day string into minutes since midnight, or null. */
export function parseTimeOfDay(raw: string): number | null {
  if (!raw) return null;
  const word = wordTime(raw);
  if (word !== null) return word;

  const m = TIME_OF_DAY.exec(raw);
  if (!m) return null;

  let hours = Number(m[1]);
  const minutes = m[2] ? Number(m[2]) : 0;
  const meridiem = m[3]?.toLowerCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) return null;

  if (meridiem) {
    const isPm = meridiem.startsWith('p');
    if (hours === 12) hours = isPm ? 12 : 0;
    else if (isPm) hours += 12;
  }
  if (hours > 23) return null;
  return hours * 60 + minutes;
}

/** Try to parse a string that contains a calendar date. */
function parseDateTime(raw: string): Date | null {
  const v = raw.trim();
  // Only attempt full-date parsing when the value actually looks like it has a
  // date component (a slash/dash separated date or a month name); otherwise a
  // bare time would be mis-parsed by the Date constructor.
  const looksLikeDate =
    /\d{1,4}[/-]\d{1,2}([/-]\d{1,4})?/.test(v) ||
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(v);
  if (!looksLikeDate) return null;

  // Normalise "2026-06-22 10:30" -> "2026-06-22T10:30" for Safari/strict parsers.
  const normalised = v.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T');
  const t = Date.parse(normalised);
  if (!Number.isNaN(t)) return new Date(t);
  return null;
}

/**
 * Parse a date-only cell ("9/13/2026", "2026-09-13", "Sep 13, 2026") into a
 * Date at local midnight. Returns null when no date can be read.
 */
export function parseDateOnly(raw: string): Date | null {
  const v = (raw ?? '').trim();
  if (!v) return null;

  // ISO yyyy-mm-dd -> build as LOCAL midnight (Date.parse would treat it as UTC
  // and could shift to the previous day in negative-offset timezones).
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  // m/d or m/d/yyyy (how Google Sheets typically renders a US-locale date).
  const slash = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/.exec(v);
  if (slash) {
    const month = Number(slash[1]) - 1;
    const day = Number(slash[2]);
    let year = slash[3] ? Number(slash[3]) : new Date().getFullYear();
    if (year < 100) year += 2000;
    return new Date(year, month, day);
  }

  // Fall back to Date.parse for textual dates; supply the current year when the
  // value omits one (e.g. "September 13").
  const hasYear = /\d{4}/.test(v);
  const t = Date.parse(hasYear ? v : `${v} ${new Date().getFullYear()}`);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

export function parseCell(raw: string): ParsedTime {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return { minutesOfDay: null, date: null };

  const date = parseDateTime(trimmed);
  if (date) return { minutesOfDay: null, date };

  const minutes = parseTimeOfDay(trimmed);
  return { minutesOfDay: minutes, date: null };
}

function atMinutes(anchor: Date, minutesOfDay: number): Date {
  const d = new Date(anchor);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutesOfDay);
  return d;
}

export interface ResolvedRange {
  start: Date;
  end: Date;
  hasDate: boolean;
}

/**
 * Resolve start/end cell values into absolute Date objects.
 *
 * - A `dateRaw` value (from a date column) anchors time-of-day start/end values
 *   to that specific calendar day.
 * - Full datetimes in the start/end cells are used as-is.
 * - Otherwise time-of-day values are anchored to `anchor`'s calendar day.
 * - If the end is earlier than the start, it is assumed to cross midnight and
 *   rolls over to the next day.
 *
 * Returns null when the start time cannot be parsed at all.
 */
export function resolveRange(
  startRaw: string,
  endRaw: string,
  anchor: Date,
  dateRaw?: string,
): ResolvedRange | null {
  const s = parseCell(startRaw);
  const e = parseCell(endRaw);

  const explicitDate = dateRaw ? parseDateOnly(dateRaw) : null;
  const dayAnchor = explicitDate ?? anchor;

  let start: Date | null = null;
  let hasDate = Boolean(explicitDate);

  if (s.date) {
    start = s.date;
    hasDate = true;
  } else if (s.minutesOfDay !== null) {
    start = atMinutes(dayAnchor, s.minutesOfDay);
  }
  if (!start) return null;

  let end: Date | null = null;
  if (e.date) {
    end = e.date;
    hasDate = true;
  } else if (e.minutesOfDay !== null) {
    end = atMinutes(start, e.minutesOfDay);
  }

  // No end time: default to a 1-hour block so it still renders.
  if (!end) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }

  // Roll over past midnight for time-of-day ranges.
  if (end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  return { start, end, hasDate };
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Time, plus a short weekday when `d` is not the same calendar day as `relativeTo`. */
export function formatWhen(d: Date, relativeTo: Date): string {
  const time = formatTime(d);
  if (sameDay(d, relativeTo)) return time;
  const day = d.toLocaleDateString([], { weekday: 'short' });
  return `${day} ${time}`;
}

export function formatRange(start: Date, end: Date, relativeTo?: Date): string {
  if (!relativeTo) return `${formatTime(start)} – ${formatTime(end)}`;
  const startLabel = formatWhen(start, relativeTo);
  const endLabel = sameDay(end, start) ? formatTime(end) : formatWhen(end, relativeTo);
  return `${startLabel} – ${endLabel}`;
}

/** Human "in 25 min" / "2h 10m" style label for a future instant. */
export function formatUntil(from: Date, to: Date): string {
  const ms = to.getTime() - from.getTime();
  if (ms <= 0) return 'now';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
