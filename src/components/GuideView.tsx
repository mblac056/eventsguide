import { useEffect, useMemo, useRef } from 'react';
import type { NowEvent } from '../types';
import { eventBounds, packSlots, slotIsLive } from '../lib/schedule';
import { formatTime } from '../lib/time';
import { Highlight } from './Highlight';

const PX_PER_MIN = 4;
const LABEL_WIDTH = 168;
const HEADER_HEIGHT = 48;
const ROW_HEIGHT = 88;
const PAD_MIN = 30;

interface GuideViewProps {
  event: NowEvent;
  cursor: Date;
  query: string;
}

function floorToHalfHour(d: Date): Date {
  const out = new Date(d);
  out.setSeconds(0, 0);
  out.setMinutes(out.getMinutes() < 30 ? 0 : 30);
  return out;
}

export function GuideView({ event, cursor, query }: GuideViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const bounds = useMemo(() => eventBounds(event), [event]);

  const range = useMemo(() => {
    if (!bounds) return null;
    // Pad the window and make sure the cursor is always inside it.
    const startMs = Math.min(bounds.start.getTime(), cursor.getTime()) - PAD_MIN * 60000;
    const endMs = Math.max(bounds.end.getTime(), cursor.getTime()) + PAD_MIN * 60000;
    const start = floorToHalfHour(new Date(startMs));
    const totalMin = Math.ceil((endMs - start.getTime()) / 60000);
    return { start, totalMin };
  }, [bounds, cursor]);

  const minutesFrom = (d: Date) =>
    range ? (d.getTime() - range.start.getTime()) / 60000 : 0;

  // Center the timeline on the cursor on first paint / when it moves offscreen.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !range) return;
    const cursorX = minutesFrom(cursor) * PX_PER_MIN;
    const target = cursorX - el.clientWidth / 2 + LABEL_WIDTH;
    el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range?.start.getTime(), range?.totalMin]);

  if (!range || event.venues.length === 0) {
    return (
      <div className="empty">
        {query ? `No items match “${query}”.` : 'No schedule to show for this event.'}
      </div>
    );
  }

  const ticks: Date[] = [];
  for (let m = 0; m <= range.totalMin; m += 30) {
    ticks.push(new Date(range.start.getTime() + m * 60000));
  }

  const trackWidth = range.totalMin * PX_PER_MIN;
  const innerWidth = LABEL_WIDTH + trackWidth;
  const nowLeft = LABEL_WIDTH + minutesFrom(cursor) * PX_PER_MIN;
  const rows = event.venues.map((venue) => {
    const packed = packSlots(venue.slots);
    const height = Math.max(ROW_HEIGHT, packed.lanes * 72 + 12);
    return { venue, packed, height };
  });
  const bodyHeight = rows.reduce((sum, row) => sum + row.height, 0);

  return (
    <div className="guide" ref={scrollRef}>
      <div
        className="guide__inner"
        style={{ width: innerWidth, ['--row-h' as string]: `${ROW_HEIGHT}px` }}
      >
        <div className="guide__header" style={{ height: HEADER_HEIGHT }}>
          <div className="guide__corner" style={{ width: LABEL_WIDTH }}>
            Venue
          </div>
          <div className="guide__ticks" style={{ width: trackWidth }}>
            {ticks.map((t) => (
              <div
                key={t.getTime()}
                className={`guide__tick ${t.getMinutes() === 0 ? 'is-hour' : ''}`}
                style={{ left: minutesFrom(t) * PX_PER_MIN }}
              >
                {formatTime(t)}
              </div>
            ))}
          </div>
        </div>

        <div className="guide__body" style={{ height: bodyHeight }}>
          <div
            className="guide__now"
            style={{ left: nowLeft, top: 0, height: bodyHeight }}
            aria-hidden
          />
          {rows.map(({ venue, packed, height }) => {
            const laneH = (height - 10) / packed.lanes - 4;
            return (
              <div className="guide__row" key={venue.name} style={{ height }}>
                <div className="guide__label" style={{ width: LABEL_WIDTH }}>
                  <Highlight text={venue.name} query={query} />
                </div>
                <div className="guide__track" style={{ width: trackWidth }}>
                  {venue.slots.map((slot) => {
                    const left = minutesFrom(slot.start) * PX_PER_MIN;
                    const width = Math.max(
                      24,
                      ((slot.end.getTime() - slot.start.getTime()) / 60000) * PX_PER_MIN,
                    );
                    const live = slotIsLive(slot, cursor);
                    const lane = packed.laneOf.get(slot.id) ?? 0;
                    return (
                      <div
                        key={slot.id}
                        className={`block ${live ? 'block--live' : ''}`}
                        style={{
                          left,
                          width,
                          top: 5 + lane * (laneH + 4),
                          height: laneH,
                          bottom: 'auto',
                        }}
                        title={`${slot.item} · ${formatTime(slot.start)}–${formatTime(slot.end)}`}
                      >
                        <div className="block__title">
                          <Highlight text={slot.item} query={query} />
                        </div>
                        <div className="block__time">
                          {formatTime(slot.start)}–{formatTime(slot.end)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
