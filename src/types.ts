export interface RawRow {
  /** Optional calendar date the row's times belong to (e.g. "9/13/2026"). */
  date?: string;
  venue: string;
  item: string;
  details: string;
  startTime: string;
  endTime: string;
}

/**
 * A scheduled item at a venue. Start/end are resolved to absolute Date
 * objects against an anchor day so that "now" logic and the timeline grid
 * can treat every slot uniformly.
 */
export interface Slot {
  id: string;
  venue: string;
  item: string;
  details: string;
  startRaw: string;
  endRaw: string;
  start: Date;
  end: Date;
  /** True when start/end carried an explicit calendar date (multi-day events). */
  hasDate: boolean;
}

export interface Venue {
  name: string;
  slots: Slot[];
}

export interface NowEvent {
  /** The sheet tab name. */
  name: string;
  venues: Venue[];
  slots: Slot[];
}

export interface SheetData {
  spreadsheetTitle: string;
  events: NowEvent[];
  /** True when the data is the bundled sample rather than a live sheet. */
  isMock: boolean;
}
