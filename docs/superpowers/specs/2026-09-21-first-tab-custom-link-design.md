# First-tab schedule + custom toolbar link

## Goal

Treat each Google Sheets file as a single schedule (first tab only), with multi-day rows via the existing date column. Drive the optional toolbar link (currently hardcoded “Fair Map”) from cells **J1** (label) and **J2** (URL) on that first tab.

## Decisions

- **Tabs:** Ignore all tabs after the first in every spreadsheet. Multi-day events live on one tab using the per-row date field.
- **Custom link:** Named `customLink` (not `mapLink`). Label = J1, URL = J2. Show the toolbar control only when **both** are non-empty after trim. No hardcoded fallback label or URL.
- **Where to enforce first-tab:** Enforce in both places — boards API returns only `tabs[0]`, and `sheetDataFromPayload` still uses only the first tab as a safety net.

## Data flow

1. Existing fetch returns spreadsheet tabs with full value grids.
2. When building `SheetData`:
   - Build schedule events from **only** `payload.tabs[0]`.
   - Read `customLink` from that tab’s values: `values[0][9]` (J1) and `values[1][9]` (J2).
   - If either cell is missing/blank → omit `customLink`.
3. `BoardPage` passes `customLink` into `Toolbar`.
4. `Toolbar` renders the link button only when `customLink` is present.

## Types

```ts
customLink?: { label: string; href: string };
```

Add to `SheetData`. Optional so mock/live boards without J1/J2 simply hide the button.

## UI

- **Toolbar:** Replace hardcoded Fair Map `<a>` with conditional render from `customLink.label` / `customLink.href` (same styling: `view__btn mapbtn`, `target="_blank"`, `rel="noopener noreferrer"`).
- **EventTabs:** No change needed — already returns `null` when `events.length <= 1`.

## Mock / sample data

- Sample board uses a single tab.
- Include sample J1/J2 so the custom link appears in mock mode.

## Out of scope

- Changing column aliases or date parsing (already support multi-day on one tab).
- Per-day custom links or reading J1/J2 from later tabs.
- Renaming CSS class `mapbtn` (cosmetic; keep as-is unless touched for other reasons).

## Success criteria

- Spreadsheets with multiple tabs only show schedule data from the first tab.
- Toolbar custom link appears iff first-tab J1 and J2 are both non-empty.
- Link text and href match the sheet cells.
- Empty/missing J1 or J2 → no custom link button.
