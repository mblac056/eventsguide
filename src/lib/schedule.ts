import type { NowEvent, Slot, Venue } from '../types';

export interface VenueState {
  venue: string;
  /** Every slot live at `at` (a venue can run more than one thing at once). */
  current: Slot[];
  next: Slot | null;
  /** Upcoming slots after `next`, for the "later today" list. */
  later: Slot[];
}

export function slotIsLive(slot: Slot, at: Date): boolean {
  const t = at.getTime();
  return slot.start.getTime() <= t && t < slot.end.getTime();
}

/** Fraction (0–1) of how far `at` is through the slot. */
export function slotProgress(slot: Slot, at: Date): number {
  const total = slot.end.getTime() - slot.start.getTime();
  if (total <= 0) return 0;
  const elapsed = at.getTime() - slot.start.getTime();
  return Math.min(1, Math.max(0, elapsed / total));
}

export function venueState(venue: Venue, at: Date): VenueState {
  const t = at.getTime();
  const current = venue.slots
    .filter((s) => slotIsLive(s, at))
    .sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime());
  const upcoming = venue.slots.filter((s) => s.start.getTime() > t);
  return {
    venue: venue.name,
    current,
    next: upcoming[0] ?? null,
    later: upcoming.slice(1, 4),
  };
}

/** Assign overlapping slots to lanes so a timeline row can show them all. */
export function packSlots(slots: Slot[]): { lanes: number; laneOf: Map<string, number> } {
  const sorted = [...slots].sort(
    (a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime(),
  );
  const laneEnds: number[] = [];
  const laneOf = new Map<string, number>();

  for (const slot of sorted) {
    const start = slot.start.getTime();
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(slot.end.getTime());
    } else {
      laneEnds[lane] = slot.end.getTime();
    }
    laneOf.set(slot.id, lane);
  }

  return { lanes: Math.max(1, laneEnds.length), laneOf };
}

function matchesSlot(slot: Slot, q: string): boolean {
  return (
    slot.item.toLowerCase().includes(q) ||
    slot.details.toLowerCase().includes(q) ||
    slot.venue.toLowerCase().includes(q)
  );
}

/** Filter an event's venues/slots by a search query (empty query = unchanged). */
export function filterEvent(event: NowEvent, query: string): NowEvent {
  const q = query.trim().toLowerCase();
  if (!q) return event;

  const venues: Venue[] = event.venues
    .map((v) => ({
      name: v.name,
      slots: v.slots.filter((s) => matchesSlot(s, q)),
    }))
    .filter((v) => v.slots.length > 0);

  const slots = venues.flatMap((v) => v.slots);
  return { name: event.name, venues, slots };
}

/** Earliest start and latest end across an event, for the timeline bounds. */
export function eventBounds(event: NowEvent): { start: Date; end: Date } | null {
  if (!event.slots.length) return null;
  let start = event.slots[0].start.getTime();
  let end = event.slots[0].end.getTime();
  for (const s of event.slots) {
    start = Math.min(start, s.start.getTime());
    end = Math.max(end, s.end.getTime());
  }
  return { start: new Date(start), end: new Date(end) };
}
