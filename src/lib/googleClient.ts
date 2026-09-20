import type { GoogleClient, SpreadsheetContents, SpreadsheetFile } from './boardsApi';

const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const SHEET_MIME = 'application/vnd.google-apps.spreadsheet';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

async function googleJson<T>(
  fetchImpl: FetchLike,
  token: string,
  url: string,
): Promise<T> {
  const res = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Couldn't load the schedule.");
  }
  return (await res.json()) as T;
}

function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function createGoogleClient(
  getToken: () => Promise<string>,
  fetchImpl: FetchLike = fetch,
): GoogleClient {
  return {
    async listSpreadsheets(folderId: string): Promise<SpreadsheetFile[]> {
      const files: SpreadsheetFile[] = [];
      let pageToken = '';
      do {
        const token = await getToken();
        const q = `'${escapeDriveQueryValue(folderId)}' in parents and mimeType='${SHEET_MIME}' and trashed=false`;
        const params = new URLSearchParams({
          q,
          fields: 'nextPageToken,files(id,name)',
          pageSize: '100',
          supportsAllDrives: 'true',
          includeItemsFromAllDrives: 'true',
        });
        if (pageToken) params.set('pageToken', pageToken);
        const data = await googleJson<{
          nextPageToken?: string;
          files?: { id?: string; name?: string }[];
        }>(fetchImpl, token, `${DRIVE_API}?${params.toString()}`);
        for (const file of data.files ?? []) {
          if (file.id && file.name) {
            files.push({ id: file.id, name: file.name });
          }
        }
        pageToken = data.nextPageToken ?? '';
      } while (pageToken);
      return files;
    },

    async fetchSpreadsheet(id: string): Promise<SpreadsheetContents> {
      const token = await getToken();
      const meta = await googleJson<{
        properties?: { title?: string };
        sheets?: { properties?: { title?: string; index?: number; sheetType?: string } }[];
      }>(
        fetchImpl,
        token,
        `${SHEETS_API}/${encodeURIComponent(id)}?fields=properties.title,sheets.properties(title,index,sheetType)`,
      );

      const tabs = (meta.sheets ?? [])
        .map((s) => s.properties)
        .filter((p): p is { title: string; index: number; sheetType?: string } =>
          Boolean(p?.title) && p?.sheetType !== 'OBJECT',
        )
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

      if (tabs.length === 0) {
        return { title: meta.properties?.title ?? 'Events Guide', tabs: [] };
      }

      const ranges = tabs.map(
        (t) => `ranges=${encodeURIComponent(`'${t.title.replace(/'/g, "''")}'`)}`,
      );
      const values = await googleJson<{
        valueRanges?: { range?: string; values?: string[][] }[];
      }>(
        fetchImpl,
        token,
        `${SHEETS_API}/${encodeURIComponent(id)}/values:batchGet?majorDimension=ROWS&${ranges.join('&')}`,
      );

      return {
        title: meta.properties?.title ?? 'Events Guide',
        tabs: tabs.map((tab, i) => ({
          title: tab.title,
          values: values.valueRanges?.[i]?.values ?? [],
        })),
      };
    },
  };
}
