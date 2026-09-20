import { describe, expect, it } from 'vitest';
import { createGoogleClient } from './googleClient';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createGoogleClient', () => {
  it('lists spreadsheets in the folder', async () => {
    const calls: string[] = [];
    const google = createGoogleClient(async () => 'token-1', async (input) => {
      calls.push(String(input));
      return jsonResponse({
        files: [
          { id: 'abc', name: 'County Fair' },
          { id: 'def', name: 'Truck Pull' },
        ],
      });
    });

    const files = await google.listSpreadsheets('folder-99');
    expect(files).toEqual([
      { id: 'abc', name: 'County Fair' },
      { id: 'def', name: 'Truck Pull' },
    ]);
    const listed = new URL(calls[0] ?? '');
    expect(listed.pathname).toBe('/drive/v3/files');
    expect(listed.searchParams.get('q')).toContain("'folder-99' in parents");
    expect(listed.searchParams.get('q')).toContain('application/vnd.google-apps.spreadsheet');
  });

  it('fetches spreadsheet title and tab values', async () => {
    const google = createGoogleClient(async () => 'token-1', async (input) => {
      const url = String(input);
      if (url.includes('/values:batchGet')) {
        return jsonResponse({
          valueRanges: [{ values: [['venue', 'item'], ['Main Stage', 'Ramblers']] }],
        });
      }
      return jsonResponse({
        properties: { title: 'County Fair' },
        sheets: [
          { properties: { title: 'Saturday', index: 0, sheetType: 'GRID' } },
          { properties: { title: 'Chart', index: 1, sheetType: 'OBJECT' } },
        ],
      });
    });

    const sheet = await google.fetchSpreadsheet('sheet-1');
    expect(sheet).toEqual({
      title: 'County Fair',
      tabs: [{ title: 'Saturday', values: [['venue', 'item'], ['Main Stage', 'Ramblers']] }],
    });
  });

  it('throws a generic error when Google returns a failure', async () => {
    const google = createGoogleClient(async () => 'token-1', async () =>
      jsonResponse({ error: { message: 'quota exceeded' } }, 403),
    );
    await expect(google.listSpreadsheets('folder-99')).rejects.toThrow("Couldn't load the schedule.");
  });
});
