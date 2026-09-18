import type { RawRow } from '../types';

export interface MockEvent {
  name: string;
  rows: RawRow[];
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function timeStr(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Build a slate of items around "now" so the sample always has something live
 * to show on first run, no matter what time it is opened.
 */
function liveDay(): RawRow[] {
  const now = new Date();
  const base = new Date(now);
  base.setSeconds(0, 0);

  // minutes offset from now -> [start, end]
  const make = (
    venue: string,
    item: string,
    details: string,
    startOffset: number,
    durationMin: number,
  ): RawRow => {
    const start = new Date(base.getTime() + startOffset * 60000);
    const end = new Date(start.getTime() + durationMin * 60000);
    return {
      venue,
      item,
      details,
      startTime: timeStr(start),
      endTime: timeStr(end),
    };
  };

  return [
    make('Main Stage', 'The Hometown Ramblers', 'Live bluegrass and country covers.', -25, 60),
    make('Main Stage', 'Junior Talent Show', 'Local kids compete for the blue ribbon.', 45, 75),
    make('Main Stage', 'Headliner: Cassie Rae Band', 'Saturday night main event.', 150, 90),

    make('Truck Pull Arena', 'Modified Diesel Pull', 'Heavy-class trucks, qualifying round.', -40, 90),
    make('Truck Pull Arena', 'Antique Tractor Pull', 'Classic iron, crowd favorite.', 60, 80),
    make('Truck Pull Arena', 'Open Class Finals', 'The big horsepower finale.', 170, 70),

    make('Grandstand', 'Demolition Derby Heat 1', 'Last car running wins the heat.', -10, 45),
    make('Grandstand', 'Demolition Derby Heat 2', 'Second qualifying heat.', 50, 45),
    make('Grandstand', 'Derby Championship', 'Winners from each heat face off.', 130, 60),

    make('Kids Zone', 'Petting Zoo Open', 'Goats, sheep, bunnies and a llama.', -120, 360),
    make('Kids Zone', 'Face Painting', 'Tigers, butterflies, and more.', -40, 180),
    make('Kids Zone', 'Magic Show with Mr. Marvel', 'Close-up magic and balloon animals.', 20, 30),
    make('Kids Zone', 'Story Time', 'Fairy tales under the big tent.', 90, 30),

    make('Food Court Pavilion', 'Pie Eating Contest', 'Blueberry. Bring napkins.', 15, 30),
    make('Food Court Pavilion', 'BBQ Cook-off Judging', 'Pitmasters present to the judges.', 75, 60),

    make('Exhibition Hall', 'Quilt Show Judging', 'Ribbons awarded for best in show.', -60, 120),
    make('Exhibition Hall', 'Honey & Preserves Awards', 'Local beekeepers and canners.', 80, 45),
  ];
}

/** A fixed full-day schedule using plain time-of-day strings. */
function sundaySchedule(): RawRow[] {
  return [
    { venue: 'Main Stage', item: 'Sunday Gospel Hour', details: 'Community choir performance.', startTime: '10:00 AM', endTime: '11:00 AM' },
    { venue: 'Main Stage', item: 'Polka Party', details: 'Dust off your dancing shoes.', startTime: '12:00 PM', endTime: '1:30 PM' },
    { venue: 'Main Stage', item: 'Battle of the Bands', details: 'Five local bands, one trophy.', startTime: '3:00 PM', endTime: '6:00 PM' },

    { venue: 'Truck Pull Arena', item: 'Garden Tractor Pull', details: 'Small but mighty.', startTime: '11:00 AM', endTime: '12:30 PM' },
    { venue: 'Truck Pull Arena', item: 'Street Diesel Pull', details: 'Daily drivers give it their all.', startTime: '2:00 PM', endTime: '4:00 PM' },

    { venue: 'Grandstand', item: 'Figure 8 Race', details: 'Crossing paths at speed.', startTime: '1:00 PM', endTime: '2:30 PM' },
    { venue: 'Grandstand', item: 'Mud Bog', details: 'Get dirty.', startTime: '4:00 PM', endTime: '5:30 PM' },

    { venue: 'Kids Zone', item: 'Pony Rides', details: 'Gentle ponies, all ages.', startTime: '10:00 AM', endTime: '4:00 PM' },
    { venue: 'Kids Zone', item: 'Face Painting', details: 'Tigers, butterflies, and more.', startTime: '11:00 AM', endTime: '3:00 PM' },

    { venue: 'Exhibition Hall', item: 'Livestock Auction', details: '4-H members sell their animals.', startTime: '1:00 PM', endTime: '3:30 PM' },
  ];
}

export const MOCK_EVENTS: MockEvent[] = [
  { name: 'County Fair · Saturday', rows: liveDay() },
  { name: 'County Fair · Sunday', rows: sundaySchedule() },
];
