import { describe, expect, it } from 'vitest';
import { slugify, uniqueSlugs } from './slug';

describe('slugify', () => {
  it('turns a spreadsheet title into a URL slug', () => {
    expect(slugify('County Fair · Saturday')).toBe('county-fair-saturday');
  });

  it('strips punctuation and collapses hyphens', () => {
    expect(slugify('  Hello---World!! ')).toBe('hello-world');
  });

  it('falls back to board when the title has no usable characters', () => {
    expect(slugify('***')).toBe('board');
  });
});

describe('uniqueSlugs', () => {
  it('keeps the original title order', () => {
    const result = uniqueSlugs([
      { id: '2', name: 'Zebra' },
      { id: '1', name: 'Apple' },
    ]);
    expect(result.map((f) => f.slug)).toEqual(['zebra', 'apple']);
  });

  it('gives colliding titles a stable suffix from the later file id', () => {
    const result = uniqueSlugs([
      { id: 'bbbXXX', name: 'County Fair' },
      { id: 'aaaYYY', name: 'County Fair' },
    ]);
    const byId = Object.fromEntries(result.map((f) => [f.id, f.slug]));
    expect(byId.aaaYYY).toBe('county-fair');
    expect(byId.bbbXXX).toBe('county-fair-bbbxxx');
  });
});
