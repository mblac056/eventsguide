import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadBoard, loadBoards, MOCK_BOARD_SLUG, NotFoundError } from './sheets';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('loadBoards', () => {
  it('uses sample data when the API is not available', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } })),
    );
    const result = await loadBoards();
    expect(result.isMock).toBe(true);
    expect(result.boards).toEqual([{ title: 'Events Guide (Sample)', slug: MOCK_BOARD_SLUG }]);
  });

  it('returns live titles when the API responds with JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ boards: [{ title: 'County Fair', slug: 'county-fair' }] }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    await expect(loadBoards()).resolves.toEqual({
      boards: [{ title: 'County Fair', slug: 'county-fair' }],
      isMock: false,
    });
  });
});

describe('loadBoard', () => {
  it('loads the sample board when the API is not available', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } })),
    );
    const data = await loadBoard(MOCK_BOARD_SLUG);
    expect(data.isMock).toBe(true);
    expect(data.events.length).toBeGreaterThan(0);
  });

  it('throws NotFoundError for an unknown sample slug', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } })),
    );
    await expect(loadBoard('no-such-board')).rejects.toBeInstanceOf(NotFoundError);
  });
});
