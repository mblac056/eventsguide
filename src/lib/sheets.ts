import type { BoardDetail, BoardSummary } from './boardsApi';
import { MOCK_EVENTS } from './mockData';
import { buildEvent, sheetDataFromPayload } from './parse';
import { slugify } from './slug';
import type { SheetData } from '../types';

export class NotFoundError extends Error {
  constructor(message = 'Not found.') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export const MOCK_BOARD_TITLE = 'Events Guide (Sample)';
export const MOCK_BOARD_SLUG = slugify(MOCK_BOARD_TITLE);

export function mockBoardList(): { boards: BoardSummary[]; isMock: true } {
  return {
    boards: [{ title: MOCK_BOARD_TITLE, slug: MOCK_BOARD_SLUG }],
    isMock: true,
  };
}

export function mockSheetData(): SheetData {
  const anchor = new Date();
  const events = MOCK_EVENTS.map((e) => buildEvent(e.name, e.rows, anchor));
  return { spreadsheetTitle: MOCK_BOARD_TITLE, events, isMock: true };
}

async function fetchApi<T>(path: string): Promise<T | 'unavailable'> {
  let res: Response;
  try {
    res = await fetch(path, { headers: { Accept: 'application/json' } });
  } catch {
    throw new Error("Couldn't load the schedule.");
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return 'unavailable';
  }

  const body = (await res.json()) as T & { error?: string };
  if (res.status === 404) {
    throw new NotFoundError(body.error ?? 'Not found.');
  }
  if (!res.ok) {
    throw new Error(
      typeof body.error === 'string' ? body.error : "Couldn't load the schedule.",
    );
  }
  return body;
}

export async function loadBoards(): Promise<{ boards: BoardSummary[]; isMock: boolean }> {
  const live = await fetchApi<{ boards: BoardSummary[] }>('/api/boards');
  if (live === 'unavailable') {
    return mockBoardList();
  }
  return { boards: live.boards, isMock: false };
}

export async function loadBoard(slug: string): Promise<SheetData> {
  const live = await fetchApi<BoardDetail>(`/api/boards/${encodeURIComponent(slug)}`);
  if (live === 'unavailable') {
    if (slug === MOCK_BOARD_SLUG) return mockSheetData();
    throw new NotFoundError();
  }
  return sheetDataFromPayload(live, false);
}
