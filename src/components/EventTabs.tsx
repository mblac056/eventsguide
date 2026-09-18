import type { NowEvent } from '../types';

interface EventTabsProps {
  events: NowEvent[];
  selected: string;
  onSelect: (name: string) => void;
}

export function EventTabs({ events, selected, onSelect }: EventTabsProps) {
  if (events.length <= 1) return null;
  return (
    <nav className="events" aria-label="Events">
      {events.map((e) => (
        <button
          key={e.name}
          className={`events__tab ${e.name === selected ? 'is-active' : ''}`}
          onClick={() => onSelect(e.name)}
        >
          {e.name}
        </button>
      ))}
    </nav>
  );
}
