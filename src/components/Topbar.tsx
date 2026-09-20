import { Link } from 'react-router-dom';
import logoUrl from '../assets/EventsGuide.svg';
import { useClock } from '../hooks/useClock';
import { formatTime } from '../lib/time';

interface TopbarProps {
  subtitle: string;
  onRefresh?: () => void;
}

export function Topbar({ subtitle, onRefresh }: TopbarProps) {
  const now = useClock();
  return (
    <header className="topbar">
      <div className="brand">
        <Link to="/" className="brand__logo" aria-label="Events Guide home">
          <img src={logoUrl} alt="Events Guide" />
        </Link>
        {subtitle ? <span className="brand__sub">{subtitle}</span> : null}
      </div>

      <div className="topbar__right">
        <div className="clock">
          <span className="clock__dot" aria-hidden />
          {formatTime(now)}
        </div>
        {onRefresh ? (
          <button className="iconbtn" onClick={onRefresh} title="Refresh" aria-label="Refresh">
            ⟳
          </button>
        ) : null}
      </div>
    </header>
  );
}
