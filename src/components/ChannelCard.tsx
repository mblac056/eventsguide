import type { Slot, Venue } from '../types';
import { formatRange, formatUntil, formatWhen } from '../lib/time';
import { slotProgress, venueState } from '../lib/schedule';
import { Highlight } from './Highlight';

interface ChannelCardProps {
  venue: Venue;
  cursor: Date;
  query: string;
}

export function ChannelCard({ venue, cursor, query }: ChannelCardProps) {
  const { current, next, later } = venueState(venue, cursor);
  const live = current.length > 0;

  let status = 'OFF AIR';
  if (live) status = current.length > 1 ? `${current.length} ON NOW` : 'ON NOW';
  else if (next) status = 'UP NEXT';

  return (
    <article className={`channel ${live ? 'channel--live' : 'channel--idle'}`}>
      <header className="channel__head">
        <h2 className="channel__name">
          <Highlight text={venue.name} query={query} />
        </h2>
        <span className={`channel__status ${live ? 'is-live' : ''}`}>{status}</span>
      </header>

      {live ? (
        <div className={`nows ${current.length > 1 ? 'nows--stack' : ''}`}>
          {current.map((slot) => (
            <SlotBlock key={slot.id} slot={slot} cursor={cursor} query={query} kind="live" />
          ))}
        </div>
      ) : next ? (
        <SlotBlock slot={next} cursor={cursor} query={query} kind="upcoming" />
      ) : (
        <div className="now now--empty">No more items scheduled.</div>
      )}

      {live && next && (
        <div className="next">
          <div className="next__label">
            Next · {formatWhen(next.start, cursor)} · in {formatUntil(cursor, next.start)}
          </div>
          <div className="next__title">
            <Highlight text={next.item} query={query} />
          </div>
        </div>
      )}

      {later.length > 0 && (
        <ul className="later">
          {later.map((slot) => (
            <li key={slot.id} className="later__row">
              <span className="later__time">{formatWhen(slot.start, cursor)}</span>
              <span className="later__title">
                <Highlight text={slot.item} query={query} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function SlotBlock({
  slot,
  cursor,
  query,
  kind,
}: {
  slot: Slot;
  cursor: Date;
  query: string;
  kind: 'live' | 'upcoming';
}) {
  return (
    <div className={`now now--${kind}`}>
      <div className="now__title">
        <Highlight text={slot.item} query={query} />
      </div>
      {slot.details && (
        <div className="now__details">
          <Highlight text={slot.details} query={query} />
        </div>
      )}
      <div className="now__time">{formatRange(slot.start, slot.end, cursor)}</div>
      {kind === 'live' && (
        <>
          <div className="progress" aria-hidden>
            <div
              className="progress__bar"
              style={{ width: `${Math.round(slotProgress(slot, cursor) * 100)}%` }}
            />
          </div>
          <div className="now__ends">Ends in {formatUntil(cursor, slot.end)}</div>
        </>
      )}
      {kind === 'upcoming' && (
        <div className="now__ends">Starts in {formatUntil(cursor, slot.start)}</div>
      )}
    </div>
  );
}
