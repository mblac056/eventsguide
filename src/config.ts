/**
 * Runtime configuration, read from Vite env vars.
 *
 * Create a `.env.local` file (see `.env.example`) with:
 *   VITE_SHEET_ID=<the spreadsheet id from its URL>
 *   VITE_GOOGLE_API_KEY=<a Google API key with the Sheets API enabled>
 *
 * The spreadsheet must be shared as "Anyone with the link can view".
 * If either value is missing, Events Guide falls back to bundled sample data.
 */
export const SHEET_ID: string = import.meta.env.VITE_SHEET_ID ?? '';
export const GOOGLE_API_KEY: string = import.meta.env.VITE_GOOGLE_API_KEY ?? '';

export const hasLiveConfig = Boolean(SHEET_ID && GOOGLE_API_KEY);

/** Column header aliases so the sheet can use slightly different wording. */
export const COLUMN_ALIASES: Record<keyof ColumnMap, string[]> = {
  date: ['date', 'day', 'event date', 'show date'],
  venue: ['venue', 'channel', 'location', 'stage', 'area'],
  item: ['item', 'event', 'act', 'title', 'show', 'name', 'activity'],
  details: ['item details', 'details', 'description', 'info', 'notes', 'desc'],
  startTime: ['start time', 'start', 'starts', 'from', 'begin', 'begins'],
  endTime: ['end time', 'end', 'ends', 'to', 'finish', 'until'],
};

export interface ColumnMap {
  /** Optional date column. -1 when the sheet has no date column. */
  date: number;
  venue: number;
  item: number;
  details: number;
  startTime: number;
  endTime: number;
}
