import { useMemo } from 'react';
import type { NowEvent } from '../types';
import { slotIsLive, venueState } from '../lib/schedule';
import { ChannelCard } from './ChannelCard';

interface NowViewProps {
  event: NowEvent;
  cursor: Date;
  query: string;
}

export function NowView({ event, cursor, query }: NowViewProps) {
  const venues = useMemo(() => {
    return [...event.venues]
      .filter((venue) => {
        const { current, next } = venueState(venue, cursor);
        return current.length > 0 || next != null;
      })
      .sort((a, b) => {
        const aLive = a.slots.some((s) => slotIsLive(s, cursor)) ? 1 : 0;
        const bLive = b.slots.some((s) => slotIsLive(s, cursor)) ? 1 : 0;
        return bLive - aLive;
      });
  }, [event.venues, cursor]);

  if (venues.length === 0) {
    return (
      <div className="empty" style={{ color: 'white' }}>
        {query
          ? `No items match “${query}”.`
          : 'Nothing on now or coming up for this event.'}
      </div>
    );
  }

  return (
    <div className="channels">
      {venues.map((venue) => (
        <ChannelCard key={venue.name} venue={venue} cursor={cursor} query={query} />
      ))}
    </div>
  );
}
