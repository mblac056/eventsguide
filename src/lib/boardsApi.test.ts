import { describe, expect, it } from 'vitest';
import { handleBoardsRequest, type GoogleClient } from './boardsApi';

const files = [
  { id: 'sheet-sat', name: 'County Fair · Saturday' },
  { id: 'sheet-sun', name: 'County Fair · Sunday' },
];

const saturdayValues = [
  ['venue', 'item', 'item details', 'start time', 'end time'],
  ['Main Stage', 'Ramblers', 'Bluegrass', '1:00 PM', '2:00 PM'],
];

function client(overrides: Partial<GoogleClient> = {}): GoogleClient {
  return {
    listSpreadsheets: async () => files,
    fetchSpreadsheet: async (id) => ({
      title: files.find((f) => f.id === id)?.name ?? id,
      tabs: [{ title: 'Saturday', values: saturdayValues }],
    }),
    ...overrides,
  };
}

async function get(path: string, google: GoogleClient, folderId = 'folder-1') {
  return handleBoardsRequest(new Request(`https://example.com${path}`), {
    folderId,
    google,
  });
}

describe('handleBoardsRequest', () => {
  it('lists spreadsheet titles and slugs', async () => {
    const res = await get('/api/boards', client());
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('max-age=60');
    await expect(res.json()).resolves.toEqual({
      boards: [
        { title: 'County Fair · Saturday', slug: 'county-fair-saturday' },
        { title: 'County Fair · Sunday', slug: 'county-fair-sunday' },
      ],
    });
  });

  it('returns raw tab values for a slug', async () => {
    const res = await get('/api/boards/county-fair-saturday', client());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      title: 'County Fair · Saturday',
      tabs: [{ title: 'Saturday', values: saturdayValues }],
    });
  });

  it('returns only the first tab for a slug', async () => {
    const res = await get(
      '/api/boards/county-fair-saturday',
      client({
        fetchSpreadsheet: async () => ({
          title: 'County Fair · Saturday',
          tabs: [
            { title: 'Saturday', values: saturdayValues },
            { title: 'Sunday', values: [['venue'], ['Other']] },
          ],
        }),
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      title: 'County Fair · Saturday',
      tabs: [{ title: 'Saturday', values: saturdayValues }],
    });
  });

  it('returns 404 for an unknown slug', async () => {
    const res = await get('/api/boards/no-such-board', client());
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: 'Not found.' });
  });

  it('returns 503 when the folder is not configured', async () => {
    const res = await get('/api/boards', client(), '');
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ error: "Couldn't load the schedule." });
  });

  it('hides Google errors behind a generic 503', async () => {
    const res = await get(
      '/api/boards',
      client({
        listSpreadsheets: async () => {
          throw new Error('Google Drive API quota exceeded');
        },
      }),
    );
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({ error: "Couldn't load the schedule." });
  });
});
