import { formatTime } from '../lib/time';

export type ViewMode = 'now' | 'guide';

interface ToolbarProps {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  query: string;
  onQueryChange: (q: string) => void;
  cursor: Date;
  isLive: boolean;
  onShift: (minutes: number) => void;
  onNow: () => void;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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
}: ToolbarProps) {
  const dayLabel = sameDay(cursor, new Date())
    ? 'Today'
    : cursor.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="toolbar">
      <div className="toolbar__group toolbar__search">
        <span className="toolbar__search-icon" aria-hidden>
          ⌕
        </span>
        <input
          type="search"
          className="toolbar__input"
          placeholder="Search acts, venues, details…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search the schedule"
        />
        {query && (
          <button className="toolbar__clear" onClick={() => onQueryChange('')} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>

      <div className="toolbar__group toolbar__scrub">
        <button className="scrub__btn" onClick={() => onShift(-60)} title="Back 1 hour">
          «
        </button>
        <button className="scrub__btn" onClick={() => onShift(-15)} title="Back 15 minutes">
          ‹
        </button>
        <button
          className={`scrub__time ${isLive ? 'is-live' : ''}`}
          onClick={onNow}
          title={isLive ? 'Showing live now' : 'Jump back to now'}
        >
          <span className="scrub__dot" aria-hidden />
          <span className="scrub__clock">{formatTime(cursor)}</span>
          <span className="scrub__day">{isLive ? 'LIVE' : dayLabel}</span>
        </button>
        <button className="scrub__btn" onClick={() => onShift(15)} title="Forward 15 minutes">
          ›
        </button>
        <button className="scrub__btn" onClick={() => onShift(60)} title="Forward 1 hour">
          »
        </button>
      </div>

      <div className="toolbar__group toolbar__view" role="tablist" aria-label="View mode">
        <button
          role="tab"
          aria-selected={view === 'now'}
          className={`view__btn ${view === 'now' ? 'is-active' : ''}`}
          onClick={() => onViewChange('now')}
        >
          On Now
        </button>
        <button
          role="tab"
          aria-selected={view === 'guide'}
          className={`view__btn ${view === 'guide' ? 'is-active' : ''}`}
          onClick={() => onViewChange('guide')}
        >
          Guide
        </button>
        <a
          className="view__btn mapbtn"
          href="https://dnu9jk22jnw2j.cloudfront.net/9ecf514191179f6273bd2f8f584dd51d.png"
          target="_blank"
          rel="noopener noreferrer"
        >
          Fair Map
        </a>
      </div>
    </div>
  );
}
