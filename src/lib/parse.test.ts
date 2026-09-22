import { describe, expect, it } from 'vitest';
import { sheetDataFromPayload } from './parse';
import type { BoardDetail } from './boardsApi';

function gridWithLink(
  label: string,
  href: string,
  extraTabs = false,
): BoardDetail {
  const header = ['venue', 'item', 'item details', 'date', 'start time', 'end time'];
  // Pad to column J (index 9)
  while (header.length < 10) header.push('');
  header[9] = label;

  const row = ['Main Stage', 'Ramblers', 'Bluegrass', '9/18/2026', '1:00 PM', '2:00 PM'];
  while (row.length < 10) row.push('');
  row[9] = href;

  const first = { title: 'Schedule', values: [header, row] };
  const second = {
    title: 'Ignored',
    values: [
      ['venue', 'item', 'item details', 'start time', 'end time'],
      ['Other Stage', 'Should Not Appear', '', '3:00 PM', '4:00 PM'],
    ],
  };
  return {
    title: 'County Fair',
    tabs: extraTabs ? [first, second] : [first],
  };
}

describe('sheetDataFromPayload', () => {
  it('uses only the first tab for schedule events', () => {
    const data = sheetDataFromPayload(gridWithLink('Fair Map', 'https://example.com/map.png', true), false);
    expect(data.events).toHaveLength(1);
    expect(data.events[0].name).toBe('Schedule');
    expect(data.events[0].slots.map((s) => s.item)).toEqual(['Ramblers']);
  });

  it('sets customLink from J1 and J2 when both are non-empty', () => {
    const data = sheetDataFromPayload(
      gridWithLink('Fair Map', 'https://example.com/map.png'),
      false,
    );
    expect(data.customLink).toEqual({
      label: 'Fair Map',
      href: 'https://example.com/map.png',
    });
  });

  it('omits customLink when J1 or J2 is blank', () => {
    expect(sheetDataFromPayload(gridWithLink('', 'https://example.com/map.png'), false).customLink).toBeUndefined();
    expect(sheetDataFromPayload(gridWithLink('Fair Map', ''), false).customLink).toBeUndefined();
    expect(sheetDataFromPayload(gridWithLink('  ', 'https://example.com/map.png'), false).customLink).toBeUndefined();
  });
});
