/**
 * Column header aliases so a spreadsheet can use slightly different wording.
 */
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
