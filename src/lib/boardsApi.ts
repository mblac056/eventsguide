import { uniqueSlugs } from './slug';

export interface SpreadsheetFile {
  id: string;
  name: string;
}

export interface SpreadsheetContents {
  title: string;
  tabs: { title: string; values: string[][] }[];
}

export interface GoogleClient {
  listSpreadsheets(folderId: string): Promise<SpreadsheetFile[]>;
  fetchSpreadsheet(id: string): Promise<SpreadsheetContents>;
}

export interface BoardsEnv {
  folderId: string;
  google: GoogleClient;
}

export interface BoardSummary {
  title: string;
  slug: string;
}

export interface BoardDetail {
  title: string;
  tabs: { title: string; values: string[][] }[];
}

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
};

function json(body: unknown, status: number): Response {
  const cache = status === 200 ? 'public, max-age=60' : 'no-store';
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, 'Cache-Control': cache },
  });
}

function fail(): Response {
  return json({ error: "Couldn't load the schedule." }, 503);
}

function parseRoute(
  pathname: string,
): { kind: 'list' } | { kind: 'detail'; slug: string } | null {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path.endsWith('/api/boards') || path.endsWith('/.netlify/functions/boards')) {
    return { kind: 'list' };
  }
  const match = path.match(/(?:\/api\/boards|\/\.netlify\/functions\/boards)\/([^/]+)$/);
  if (match?.[1]) {
    return { kind: 'detail', slug: decodeURIComponent(match[1]) };
  }
  return null;
}

async function catalog(env: BoardsEnv) {
  const files = await env.google.listSpreadsheets(env.folderId);
  return uniqueSlugs(files).map((file) => ({
    id: file.id,
    title: file.name,
    slug: file.slug,
  }));
}

export async function handleBoardsRequest(req: Request, env: BoardsEnv): Promise<Response> {
  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed.' }, 405);
  }
  if (!env.folderId.trim()) {
    return fail();
  }

  const route = parseRoute(new URL(req.url).pathname);
  if (!route) {
    return json({ error: 'Not found.' }, 404);
  }

  try {
    const boards = await catalog(env);
    if (route.kind === 'list') {
      return json(
        { boards: boards.map(({ title, slug }) => ({ title, slug })) },
        200,
      );
    }

    const match = boards.find((board) => board.slug === route.slug);
    if (!match) {
      return json({ error: 'Not found.' }, 404);
    }

    const sheet = await env.google.fetchSpreadsheet(match.id);
    const body: BoardDetail = {
      title: sheet.title,
      tabs: sheet.tabs.slice(0, 1),
    };
    return json(body, 200);
  } catch {
    return fail();
  }
}
