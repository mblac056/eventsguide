# First-tab schedule + customLink Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use only the first tab of each spreadsheet for the schedule, and drive the optional toolbar link from that tab’s J1 (label) and J2 (URL) as `customLink`.

**Architecture:** Truncate to `tabs[0]` in `handleBoardsRequest`. In `sheetDataFromPayload`, build events from the first tab only and extract `customLink` from cells J1/J2 (`values[0][9]` / `values[1][9]`). Pass `customLink` through `BoardPage` → `Toolbar` for conditional render. Collapse mock data to one event with a sample `customLink`.

**Tech Stack:** React + TypeScript, Vitest, existing boards API / parse pipeline.

## Global Constraints

- Name the field `customLink` (not `mapLink`): `{ label: string; href: string }`.
- Show the toolbar link only when **both** J1 and J2 are non-empty after trim; no hardcoded fallback.
- Ignore all tabs after the first in every Google Sheets file.
- Keep CSS class `mapbtn` as-is.
- Do not change column aliases or date parsing.

## File structure

| File | Responsibility |
| ---- | -------------- |
| `src/types.ts` | Add optional `customLink` on `SheetData` |
| `src/lib/parse.ts` | First-tab only + extract `customLink` from J1/J2 |
| `src/lib/parse.test.ts` | Unit tests for first-tab + `customLink` extraction |
| `src/lib/boardsApi.ts` | Return only `tabs[0]` in board detail |
| `src/lib/boardsApi.test.ts` | Assert extra tabs are dropped |
| `src/lib/mockData.ts` | Single mock event (drop Sunday tab) |
| `src/lib/sheets.ts` | Attach sample `customLink` in `mockSheetData` |
| `src/components/Toolbar.tsx` | Render link from `customLink` prop |
| `src/pages/BoardPage.tsx` | Pass `data.customLink` into Toolbar |
| `README.md` | Document first-tab + J1/J2 custom link |

---

### Task 1: Parse first tab + extract `customLink`

**Files:**
- Modify: `src/types.ts`
- Modify: `src/lib/parse.ts`
- Create: `src/lib/parse.test.ts`

**Interfaces:**
- Produces: `SheetData.customLink?: { label: string; href: string }`
- Produces: `sheetDataFromPayload` uses only `payload.tabs[0]` and may set `customLink`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/parse.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { sheetDataFromPayload } from './parse';
import type { BoardDetail } from './boardsApi';

function gridWithLink(
  label: string,
  href: string,
  extraTabs = false,
): BoardDetail {
  const header = ['venue', 'item', 'item details', 'date', 'start time', 'end time'];
  // Pad to column J (index 9)
  while (header.length < 10) header.push('');
  header[9] = label;

  const row = ['Main Stage', 'Ramblers', 'Bluegrass', '9/18/2026', '1:00 PM', '2:00 PM'];
  while (row.length < 10) row.push('');
  row[9] = href;

  const first = { title: 'Schedule', values: [header, row] };
  const second = {
    title: 'Ignored',
    values: [
      ['venue', 'item', 'item details', 'start time', 'end time'],
      ['Other Stage', 'Should Not Appear', '', '3:00 PM', '4:00 PM'],
    ],
  };
  return {
    title: 'County Fair',
    tabs: extraTabs ? [first, second] : [first],
  };
}

describe('sheetDataFromPayload', () => {
  it('uses only the first tab for schedule events', () => {
    const data = sheetDataFromPayload(gridWithLink('Fair Map', 'https://example.com/map.png', true), false);
    expect(data.events).toHaveLength(1);
    expect(data.events[0].name).toBe('Schedule');
    expect(data.events[0].slots.map((s) => s.item)).toEqual(['Ramblers']);
  });

  it('sets customLink from J1 and J2 when both are non-empty', () => {
    const data = sheetDataFromPayload(
      gridWithLink('Fair Map', 'https://example.com/map.png'),
      false,
    );
    expect(data.customLink).toEqual({
      label: 'Fair Map',
      href: 'https://example.com/map.png',
    });
  });

  it('omits customLink when J1 or J2 is blank', () => {
    expect(sheetDataFromPayload(gridWithLink('', 'https://example.com/map.png'), false).customLink).toBeUndefined();
    expect(sheetDataFromPayload(gridWithLink('Fair Map', ''), false).customLink).toBeUndefined();
    expect(sheetDataFromPayload(gridWithLink('  ', 'https://example.com/map.png'), false).customLink).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/parse.test.ts`

Expected: FAIL (missing assertions / `customLink` not set / multiple events from second tab)

- [ ] **Step 3: Add type and implement parse changes**

In `src/types.ts`, update `SheetData`:

```ts
export interface SheetData {
  spreadsheetTitle: string;
  events: NowEvent[];
  /** True when the data is the bundled sample rather than a live sheet. */
  isMock: boolean;
  /** Optional toolbar link from first-tab J1 (label) and J2 (href). */
  customLink?: { label: string; href: string };
}
```

In `src/lib/parse.ts`, add helper and update `sheetDataFromPayload`:

```ts
function customLinkFromValues(values: string[][]): SheetData['customLink'] {
  const label = (values[0]?.[9] ?? '').toString().trim();
  const href = (values[1]?.[9] ?? '').toString().trim();
  if (!label || !href) return undefined;
  return { label, href };
}

export function sheetDataFromPayload(payload: BoardDetail, isMock: boolean): SheetData {
  const first = payload.tabs[0];
  if (!first) {
    throw new Error(
      'Connected to the schedule but found no usable rows. Check that tabs have ' +
        'venue / item / start time / end time columns.',
    );
  }

  const anchor = new Date();
  const event = buildEvent(first.title, rowsFromValues(first.values), anchor);
  if (event.slots.length === 0) {
    throw new Error(
      'Connected to the schedule but found no usable rows. Check that tabs have ' +
        'venue / item / start time / end time columns.',
    );
  }

  return {
    spreadsheetTitle: payload.title,
    events: [event],
    isMock,
    customLink: customLinkFromValues(first.values),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/parse.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/lib/parse.ts src/lib/parse.test.ts
git commit -m "Parse only the first sheet tab and extract customLink from J1/J2."
```

---

### Task 2: Boards API returns only the first tab

**Files:**
- Modify: `src/lib/boardsApi.ts`
- Modify: `src/lib/boardsApi.test.ts`

**Interfaces:**
- Consumes: `sheet.tabs` from Google client
- Produces: `BoardDetail.tabs` length at most 1

- [ ] **Step 1: Write the failing test**

Add to `src/lib/boardsApi.test.ts` inside `describe('handleBoardsRequest', …)`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/boardsApi.test.ts`

Expected: FAIL — response still includes Sunday tab

- [ ] **Step 3: Truncate tabs in the handler**

In `src/lib/boardsApi.ts`, change the detail body construction:

```ts
    const sheet = await env.google.fetchSpreadsheet(match.id);
    const body: BoardDetail = {
      title: sheet.title,
      tabs: sheet.tabs.slice(0, 1),
    };
    return json(body, 200);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/boardsApi.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/boardsApi.ts src/lib/boardsApi.test.ts
git commit -m "Return only the first spreadsheet tab from the boards API."
```

---

### Task 3: Single-tab mock sample with `customLink`

**Files:**
- Modify: `src/lib/mockData.ts`
- Modify: `src/lib/sheets.ts`
- Modify: `src/lib/sheets.test.ts` (only if assertions need tightening)

**Interfaces:**
- Consumes: `SheetData.customLink`
- Produces: `mockSheetData()` with one event and a sample `customLink`

- [ ] **Step 1: Write the failing assertion**

In `src/lib/sheets.test.ts`, update the sample-board test:

```ts
  it('loads the sample board when the API is not available', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } })),
    );
    const data = await loadBoard(MOCK_BOARD_SLUG);
    expect(data.isMock).toBe(true);
    expect(data.events).toHaveLength(1);
    expect(data.customLink).toEqual({
      label: 'Fair Map',
      href: 'https://dnu9jk22jnw2j.cloudfront.net/9ecf514191179f6273bd2f8f584dd51d.png',
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/sheets.test.ts`

Expected: FAIL — `events` length > 1 and/or `customLink` undefined

- [ ] **Step 3: Collapse mock data and set `customLink`**

In `src/lib/mockData.ts`:
- Remove `sundaySchedule` and its usage.
- Export a single mock event:

```ts
export const MOCK_EVENTS: MockEvent[] = [
  { name: 'County Fair', rows: liveDay() },
];
```

In `src/lib/sheets.ts`, update `mockSheetData`:

```ts
export function mockSheetData(): SheetData {
  const anchor = new Date();
  const events = MOCK_EVENTS.map((e) => buildEvent(e.name, e.rows, anchor));
  return {
    spreadsheetTitle: MOCK_BOARD_TITLE,
    events,
    isMock: true,
    customLink: {
      label: 'Fair Map',
      href: 'https://dnu9jk22jnw2j.cloudfront.net/9ecf514191179f6273bd2f8f584dd51d.png',
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/sheets.test.ts src/lib/parse.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/mockData.ts src/lib/sheets.ts src/lib/sheets.test.ts
git commit -m "Use a single mock schedule tab with a sample customLink."
```

---

### Task 4: Wire `customLink` into Toolbar

**Files:**
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/pages/BoardPage.tsx`

**Interfaces:**
- Consumes: `SheetData['customLink']`
- Produces: Toolbar optional prop `customLink?: { label: string; href: string }`

- [ ] **Step 1: Update Toolbar props and render**

Replace the hardcoded Fair Map anchor. Full relevant sections of `src/components/Toolbar.tsx`:

```ts
interface ToolbarProps {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  query: string;
  onQueryChange: (q: string) => void;
  cursor: Date;
  isLive: boolean;
  onShift: (minutes: number) => void;
  onNow: () => void;
  customLink?: { label: string; href: string };
}

export function Toolbar({
  view,
  onViewChange,
  query,
  onQueryChange,
  cursor,
  isLive,
  onShift,
  onNow,
  customLink,
}: ToolbarProps) {
  // ... existing body unchanged until the view group ...
```

In the view group, replace the hardcoded `<a>…Fair Map</a>` with:

```tsx
        {customLink && (
          <a
            className="view__btn mapbtn"
            href={customLink.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {customLink.label}
          </a>
        )}
```

- [ ] **Step 2: Pass `customLink` from BoardPage**

In `src/pages/BoardPage.tsx`, on the `<Toolbar>` call, add:

```tsx
        <Toolbar
          view={view}
          onViewChange={setView}
          query={query}
          onQueryChange={setQuery}
          cursor={cursor}
          isLive={isLive}
          onShift={(m) => setOffsetMin((o) => o + m)}
          onNow={() => setOffsetMin(0)}
          customLink={data.customLink}
        />
```

- [ ] **Step 3: Type-check**

Run: `npm run build`

Expected: succeeds (tsc + vite build)

- [ ] **Step 4: Commit**

```bash
git add src/components/Toolbar.tsx src/pages/BoardPage.tsx
git commit -m "Render toolbar customLink from sheet J1/J2 when present."
```

---

### Task 5: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update spreadsheet structure docs**

In `README.md` under “How a spreadsheet is structured”:
- Change “Each tab in the spreadsheet is a day or sub-event” to: only the **first tab** is used; later tabs are ignored. Multi-day schedules use the per-row `date` column on that first tab.
- Add a note: optional toolbar link — cell **J1** = link label, **J2** = URL; both required to show the button.

Remove or reword the “Event tabs: switch between days or sub-events” bullet under “Using Events Guide” (tabs UI only appears if multiple events exist, which live data no longer produces).

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Document first-tab-only schedules and J1/J2 customLink."
```

---

## Spec coverage checklist

| Spec requirement | Task |
| ---------------- | ---- |
| First tab only for schedule | 1, 2 |
| `customLink` from J1/J2 | 1 |
| Both cells required | 1 |
| Named `customLink` | 1, 3, 4 |
| Boards API truncates tabs | 2 |
| Parse safety net | 1 |
| Toolbar conditional render | 4 |
| Mock single tab + sample link | 3 |
| EventTabs unchanged | (already hides for ≤1) |
| Keep `mapbtn` class | 4 |
| README accuracy | 5 |
