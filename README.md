# Events Guide

A live "what's on now" board for events, driven by a read-only Google Sheet.
Think of it like a TV guide where each **channel is a venue** (an entertainment
stage, the truck pull arena, the kids zone…) so you can see at a glance what's
happening right now across an event — and scrub forwards/backwards in time or
search the whole schedule.

Built with **React + TypeScript + Vite**.

## How the sheet is structured

- **Each tab in the spreadsheet is an event** (e.g. `County Fair · Saturday`).
- Each tab has one row per scheduled item with these columns:

  | date | venue | item | item details | start time | end time |
  | ---- | ----- | ---- | ------------ | ---------- | -------- |
  | 9/13/2026 | Main Stage | The Hometown Ramblers | Live bluegrass | 1:00 PM | 2:00 PM |
  | 9/13/2026 | Truck Pull Arena | Modified Diesel Pull | Heavy class | 13:30 | 15:00 |

Notes:

- Header names are flexible (e.g. `stage`/`location` work for `venue`,
  `act`/`show` for `item`, `day` for `date`). If headers aren't recognised, the
  first columns are used positionally as venue / item / details / start / end.
- **`date` is optional.** When present, it anchors that row's start/end times to
  a specific calendar day — ideal for multi-day events. Accepts `9/13/2026`,
  `2026-09-13`, or `Sep 13, 2026`.
- **Times** can be a time of day (`1:00 PM`, `13:00`, `9pm`, `noon`) or a full
  date + time (`2026-06-22 13:00`). Without a date column or full datetime,
  time-of-day values are treated as happening today.
- A missing end time defaults to a one-hour block. An end earlier than the start
  is assumed to cross midnight.

## Quick start

```bash
npm install
npm run dev
```

This runs immediately on **bundled sample data** (a fictional county fair) so you
can see the UI without any setup.

## Connecting your Google Sheet

1. Share the sheet as **"Anyone with the link can view"**.
2. In the [Google Cloud Console](https://console.cloud.google.com/), enable the
   **Google Sheets API** and create an **API key**.
3. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   VITE_SHEET_ID=your_spreadsheet_id      # from the sheet URL
   VITE_GOOGLE_API_KEY=your_api_key
   ```

4. Restart `npm run dev`.

> The API key is only used for read-only requests to a public sheet. For a
> production deployment you should restrict the key (e.g. to the Sheets API and
> your site's HTTP referrer).

## Using Events Guide

- **On Now** view: one card per venue showing what's playing right now, a
  progress bar, what's up next, and later items.
- **Guide** view: a classic TV-guide timeline (venues down the side, time across
  the top) with a red "now" line.
- **Time scrubber**: jump back/forward by 15 minutes or an hour to preview the
  schedule at another moment. Hit the time pill to snap back to **LIVE**.
- **Search**: filter across acts, venues, and details; matches are highlighted.
- **Event tabs**: switch between events (sheet tabs).
- **↻**: refresh the schedule from the sheet.

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – type-check and build for production
- `npm run preview` – preview the production build
- `npm run lint` – run ESLint
