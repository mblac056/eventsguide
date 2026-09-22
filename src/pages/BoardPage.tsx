import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { EventTabs } from '../components/EventTabs';
import { Toolbar, type ViewMode } from '../components/Toolbar';
import { NowView } from '../components/NowView';
import { GuideView } from '../components/GuideView';
import { useBoard } from '../hooks/useBoard';
import { useClock } from '../hooks/useClock';
import { filterEvent } from '../lib/schedule';

export function BoardPage() {
  const { slug = '' } = useParams();
  return <BoardScreen key={slug} slug={slug} />;
}

function BoardScreen({ slug }: { slug: string }) {
  const { data, loading, error, notFound, reload } = useBoard(slug);
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

  const activeEvent = data?.events.find((e) => e.name === selected) ?? data?.events[0] ?? null;
  const activeName = activeEvent?.name ?? '';
  const filtered = useMemo(
    () => (activeEvent ? filterEvent(activeEvent, query) : null),
    [activeEvent, query],
  );

  return (
    <div className="app">
      <Topbar subtitle={data ? data.spreadsheetTitle : 'Live schedule'} onRefresh={reload} />

      {data?.isMock && (
        <div className="banner">
          Showing <strong>sample data</strong>. Run <code>npm run dev:live</code> to load your folder.
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
          customLink={data.customLink}
        />
      )}

      <main className="content">
        {loading && <div className="state state--loading">Loading schedule…</div>}

        {!loading && notFound && (
          <div className="state">
            <p>That event was not found.</p>
            <Link className="btn" to="/">
              All events
            </Link>
          </div>
        )}

        {!loading && error && !notFound && (
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
