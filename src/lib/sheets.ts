import {
  COLUMN_ALIASES,
  GOOGLE_API_KEY,
  SHEET_ID,
  hasLiveConfig,
  type ColumnMap,
} from '../config';
import type { NowEvent, RawRow, SheetData, Slot, Venue } from '../types';
import { resolveRange } from './time';
import { MOCK_EVENTS } from './mockData';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

interface SheetTab {
  title: string;
  index: number;
}

function normaliseHeader(h: string): string {
  return h.trim().toLowerCase();
}

/** Resolve which column index maps to each field using header aliases. */
function mapColumns(header: string[]): ColumnMap {
  const normalised = header.map(normaliseHeader);
  const find = (key: keyof ColumnMap): number => {
    for (const alias of COLUMN_ALIASES[key]) {
      const idx = normalised.indexOf(alias);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const map: ColumnMap = {
    date: find('date'),
    venue: find('venue'),
    item: find('item'),
    details: find('details'),
    startTime: find('startTime'),
    endTime: find('endTime'),
  };

  // Positional fallback when headers are missing or unrecognised. The date
  // column is optional, so it is left unset (-1) when no header matches.
  if (map.venue === -1) map.venue = 0;
  if (map.item === -1) map.item = 1;
  if (map.details === -1) map.details = 2;
  if (map.startTime === -1) map.startTime = 3;
  if (map.endTime === -1) map.endTime = 4;
  return map;
}

function cell(row: string[], idx: number): string {
  return (row[idx] ?? '').toString().trim();
}

function rowsFromValues(values: string[][]): RawRow[] {
  if (!values.length) return [];
  const [header, ...body] = values;
  const map = mapColumns(header);
  return body
    .map((row) => ({
      date: map.date === -1 ? '' : cell(row, map.date),
      venue: cell(row, map.venue),
      item: cell(row, map.item),
      details: cell(row, map.details),
      startTime: cell(row, map.startTime),
      endTime: cell(row, map.endTime),
    }))
    .filter((r) => r.venue || r.item);
}

/** Turn raw rows into a structured event with resolved time slots. */
export function buildEvent(name: string, rows: RawRow[], anchor: Date): NowEvent {
  const slots: Slot[] = [];

  rows.forEach((row, i) => {
    if (!row.item && !row.venue) return;
    const range = resolveRange(row.startTime, row.endTime, anchor, row.date);
    if (!range) return;
    slots.push({
      id: `${name}::${i}`,
      venue: row.venue || 'General',
      item: row.item || 'Untitled',
      details: row.details,
      startRaw: row.startTime,
      endRaw: row.endTime,
      start: range.start,
      end: range.end,
      hasDate: range.hasDate,
    });
  });

  slots.sort((a, b) => a.start.getTime() - b.start.getTime());

  const byVenue = new Map<string, Slot[]>();
  for (const slot of slots) {
    const list = byVenue.get(slot.venue) ?? [];
    list.push(slot);
    byVenue.set(slot.venue, list);
  }

  const venues: Venue[] = [...byVenue.entries()].map(([venueName, venueSlots]) => ({
    name: venueName,
    slots: venueSlots,
  }));

  return { name, venues, slots };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error?.message ? `: ${body.error.message}` : '';
    } catch {
      /* ignore */
    }
    throw new Error(`Google Sheets request failed (${res.status})${detail}`);
  }
  return res.json() as Promise<T>;
}

async function fetchTabs(): Promise<{ title: string; tabs: SheetTab[] }> {
  const url =
    `${SHEETS_API}/${SHEET_ID}?key=${GOOGLE_API_KEY}` +
    `&fields=properties.title,sheets.properties(title,index,sheetType)`;
  const data = await fetchJson<{
    properties?: { title?: string };
    sheets?: { properties?: { title?: string; index?: number; sheetType?: string } }[];
  }>(url);

  const tabs: SheetTab[] = (data.sheets ?? [])
    .map((s) => s.properties)
    .filter((p): p is { title: string; index: number; sheetType?: string } =>
      Boolean(p?.title) && p?.sheetType !== 'OBJECT',
    )
    .map((p) => ({ title: p.title, index: p.index ?? 0 }))
    .sort((a, b) => a.index - b.index);

  return { title: data.properties?.title ?? 'Events Guide', tabs };
}

async function fetchValues(titles: string[]): Promise<Map<string, string[][]>> {
  const ranges = titles.map((t) => `ranges=${encodeURIComponent(`'${t.replace(/'/g, "''")}'`)}`);
  const url =
    `${SHEETS_API}/${SHEET_ID}/values:batchGet?key=${GOOGLE_API_KEY}` +
    `&majorDimension=ROWS&${ranges.join('&')}`;
  const data = await fetchJson<{
    valueRanges?: { range?: string; values?: string[][] }[];
  }>(url);

  // batchGet preserves request order, so zip back to titles.
  const result = new Map<string, string[][]>();
  (data.valueRanges ?? []).forEach((vr, i) => {
    result.set(titles[i] ?? vr.range ?? `Sheet${i}`, vr.values ?? []);
  });
  return result;
}

function buildMock(anchor: Date): SheetData {
  const events = MOCK_EVENTS.map((e) => buildEvent(e.name, e.rows, anchor));
  return { spreadsheetTitle: 'Events Guide (Sample)', events, isMock: true };
}

export async function loadSheetData(): Promise<SheetData> {
  const anchor = new Date();
  if (!hasLiveConfig) {
    return buildMock(anchor);
  }

  const { title, tabs } = await fetchTabs();
  const titles = tabs.map((t) => t.title);
  const valuesByTab = await fetchValues(titles);

  const events: NowEvent[] = tabs
    .map((tab) => buildEvent(tab.title, rowsFromValues(valuesByTab.get(tab.title) ?? []), anchor))
    .filter((e) => e.slots.length > 0);

  if (events.length === 0) {
    throw new Error(
      'Connected to the sheet but found no usable rows. Check that tabs have ' +
        'venue / item / start time / end time columns.',
    );
  }

  return { spreadsheetTitle: title, events, isMock: false };
}
