import { describe, expect, it } from 'vitest';

import {
  filterFontOptions,
  visibleFontOptions,
  type FontOption,
} from './font-combobox';

const options: FontOption[] = [
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Roboto Mono', value: '"Roboto Mono", monospace' },
];

const featured: FontOption[] = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
];

describe('filterFontOptions', () => {
  it('returns all options when query is empty', () => {
    expect(filterFontOptions(options, '')).toEqual(options);
    expect(filterFontOptions(options, '   ')).toEqual(options);
  });

  it('filters by case-insensitive label substring', () => {
    expect(filterFontOptions(options, 'robo').map((o) => o.label)).toEqual([
      'Roboto',
      'Roboto Mono',
    ]);
    expect(filterFontOptions(options, 'OPEN').map((o) => o.label)).toEqual([
      'Open Sans',
    ]);
  });

  it('returns empty when nothing matches', () => {
    expect(filterFontOptions(options, 'zzz')).toEqual([]);
  });
});

describe('visibleFontOptions', () => {
  it('shows featured list when search is empty', () => {
    expect(visibleFontOptions(options, featured, '')).toEqual(featured);
  });

  it('searches the full catalog when query is set', () => {
    expect(
      visibleFontOptions(options, featured, 'open').map((o) => o.label)
    ).toEqual(['Open Sans']);
  });
});
