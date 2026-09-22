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

/** Build a slate of items around "now" so the sample always has something live. */
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

export const MOCK_EVENTS: MockEvent[] = [
  { name: 'County Fair', rows: liveDay() },
];
