# Events Guide

A live "what's on now" board for events. Think of it like a TV guide where each
**channel is a venue** (an entertainment stage, the truck pull arena, the kids
zone…) so you can see at a glance what's happening right now across an event —
and scrub forwards/backwards in time or search the whole schedule.

Schedules are ordinary spreadsheets. Drop a spreadsheet in a Drive folder and
it shows up on the homepage; visitors never see Drive.

Built with **React + TypeScript + Vite**, hosted on **Netlify**.

## How a spreadsheet is structured

- **Each spreadsheet is one event** (listed on the homepage by its title).
- **Each tab in the spreadsheet** is a day or sub-event (e.g. `Saturday`).
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
can see the UI without any setup. The homepage lists the sample event; open it
to get the Now / Guide views.

## Connecting a folder

1. In [Google Cloud Console](https://console.cloud.google.com/), create a
   project (or pick one), enable the **Google Drive API** and **Google Sheets
   API**, and create a **service account**. Download a JSON key.
2. Share your Drive folder with the service account email as **Viewer**.
   Spreadsheets in that folder inherit access.
3. Copy `.env.example` to `.env` and fill in:

   ```bash
   GOOGLE_CLIENT_EMAIL=...@....iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_DRIVE_FOLDER_ID=the_id_from_the_folder_url
   ```

   The folder id is the `THIS_PART` in
   `https://drive.google.com/drive/folders/THIS_PART`.

4. Stop `npm run dev` if it is running, then start the site **with functions**:

   ```bash
   npm run dev:live
   ```

   Open **http://localhost:8888** (not 5173). Vite alone cannot read the folder.

5. On Netlify, set the same three environment variables (Site settings →
   Environment variables). Do not prefix them with `VITE_`.

Each new spreadsheet in the folder appears on the homepage as its title, at a
    'County Fair · Saturday' → `/county-fair-saturday`. Duplicate titles get a short stable suffix.

## Using Events Guide

- **Homepage**: every event (spreadsheet title) as a link.
- **On Now** view: one card per venue showing what's playing right now, a
  progress bar, what's up next, and later items.
- **Guide** view: a classic TV-guide timeline (venues down the side, time across
  the top) with a red "now" line.
- **Time scrubber**: jump back/forward by 15 minutes or an hour to preview the
  schedule at another moment. Hit the time pill to snap back to **LIVE**.
- **Search**: filter across acts, venues, and details; matches are highlighted.
- **Event tabs**: switch between days or sub-events (spreadsheet tabs).
- **↻**: refresh the list or the open schedule.

## Scripts

- `npm run dev` – Vite only, sample data (`http://localhost:5173`)
- `npm run dev:live` – Vite + functions, live folder (`http://localhost:8888`)
- `npm run build` – type-check and build for production
- `npm run preview` – preview the production build
- `npm run lint` – run ESLint
- `npm test` – run unit tests
