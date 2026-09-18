import { useMemo, useState } from 'react';
import './App.css';
import logoUrl from './assets/EventsGuide.svg';
import { useSheetData } from './hooks/useSheetData';
import { useClock } from './hooks/useClock';
import { filterEvent } from './lib/schedule';
import { formatTime } from './lib/time';
import { EventTabs } from './components/EventTabs';
import { Toolbar, type ViewMode } from './components/Toolbar';
import { NowView } from './components/NowView';
import { GuideView } from './components/GuideView';

export default function App() {
  const { data, loading, error, reload } = useSheetData();
  const realNow = useClock();

  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewMode>('now');
  const [offsetMin, setOffsetMin] = useState(0);

  const isLive = offsetMin === 0;
  const cursor = useMemo(
    () => new Date(realNow.getTime() + offsetMin * 60_000),
    [realNow, offsetMin],
  );

  // Fall back to the first event until the user picks one (no effect needed).
  const activeEvent = data?.events.find((e) => e.name === selected) ?? data?.events[0] ?? null;
  const activeName = activeEvent?.name ?? '';
  const filtered = useMemo(
    () => (activeEvent ? filterEvent(activeEvent, query) : null),
    [activeEvent, query],
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__logo">
            <a href="/" rel="noopener noreferrer"><img src={logoUrl} alt="Events Guide" /></a>
          </span>
          <span className="brand__sub">
            {data ? data.spreadsheetTitle : 'Live schedule'}
          </span>
        </div>

        <div className="topbar__right">
          <div className="clock">
            <span className="clock__dot" aria-hidden />
            {formatTime(realNow)}
          </div>
          <button className="iconbtn" onClick={reload} title="Refresh schedule" aria-label="Refresh">
            ⟳
          </button>
        </div>
      </header>

      {data?.isMock && (
        <div className="banner">
          Showing <strong>sample data</strong>. Connect a Google Sheet by setting{' '}
          <code>VITE_SHEET_ID</code> and <code>VITE_GOOGLE_API_KEY</code> (see the README).
        </div>
      )}

      {data && (
        <EventTabs events={data.events} selected={activeName} onSelect={setSelected} />
      )}

      {data && (
        <Toolbar
          view={view}
          onViewChange={setView}
          query={query}
          onQueryChange={setQuery}
          cursor={cursor}
          isLive={isLive}
          onShift={(m) => setOffsetMin((o) => o + m)}
          onNow={() => setOffsetMin(0)}
        />
      )}

      <main className="content">
        {loading && <div className="state state--loading">Loading schedule…</div>}

        {error && (
          <div className="state state--error">
            <p>{error}</p>
            <button className="btn" onClick={reload}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered && (
          view === 'now' ? (
            <NowView event={filtered} cursor={cursor} query={query} />
          ) : (
            <GuideView event={filtered} cursor={cursor} query={query} />
          )
        )}
      </main>
    </div>
  );
}
