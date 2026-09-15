import { describe, expect, it } from 'vitest';

import { stylePx, styleToBlockData } from './style-to-data';

describe('stylePx', () => {
  it('returns finite numbers as-is', () => {
    expect(stylePx(12)).toBe(12);
    expect(stylePx(0)).toBe(0);
    expect(stylePx(-4)).toBe(-4);
    expect(stylePx(12.5)).toBe(12.5);
  });

  it('parses bare numeric strings and px strings', () => {
    expect(stylePx('12')).toBe(12);
    expect(stylePx(' 16 ')).toBe(16);
    expect(stylePx('18px')).toBe(18);
    expect(stylePx('18PX')).toBe(18);
    expect(stylePx('12.5px')).toBe(12.5);
    expect(stylePx('-2px')).toBe(-2);
  });

  it('returns undefined for non-px lengths and junk', () => {
    expect(stylePx(Number.NaN)).toBeUndefined();
    expect(stylePx(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(stylePx('50%')).toBeUndefined();
    expect(stylePx('12em')).toBeUndefined();
    expect(stylePx('auto')).toBeUndefined();
    expect(stylePx(null)).toBeUndefined();
    expect(stylePx()).toBeUndefined();
    expect(stylePx({})).toBeUndefined();
  });
});

describe('styleToBlockData', () => {
  it('returns empty object for missing style', () => {
    expect(styleToBlockData()).toEqual({});
  });

  it('maps colors, type, margins, radius, and maxWidth', () => {
    expect(
      styleToBlockData({
        backgroundColor: '#F3F4F6',
        color: '#14171E',
        fontSize: '16px',
        lineHeight: 1.5,
        marginTop: '8px',
        marginBottom: 32,
        borderRadius: '8px',
        maxWidth: 380,
        textAlign: 'center',
        verticalAlign: 'middle',
      })
    ).toEqual({
      background: '#F3F4F6',
      color: '#14171E',
      fontSize: 16,
      lineHeight: '1.5',
      marginTop: 8,
      marginBottom: 32,
      borderRadius: 8,
      maxWidth: 380,
      align: 'center',
      verticalAlign: 'middle',
    });
  });

  it('prefers backgroundColor over background', () => {
    expect(
      styleToBlockData({
        background: '#111111',
        backgroundColor: '#F3F4F6',
      })
    ).toEqual({ background: '#F3F4F6' });
  });

  it('falls back to background when backgroundColor is absent', () => {
    expect(styleToBlockData({ background: '#111111' })).toEqual({
      background: '#111111',
    });
  });

  it('maps padding number and 1–4 value shorthands to paddingX/Y', () => {
    expect(styleToBlockData({ padding: 16 })).toEqual({
      paddingX: 16,
      paddingY: 16,
    });
    expect(styleToBlockData({ padding: '16px' })).toEqual({
      paddingX: 16,
      paddingY: 16,
    });
    expect(styleToBlockData({ padding: '16px 24px' })).toEqual({
      paddingY: 16,
      paddingX: 24,
    });
    expect(styleToBlockData({ padding: '8px 16px 24px' })).toEqual({
      paddingY: 8,
      paddingX: 16,
    });
    expect(styleToBlockData({ padding: '8px 12px 16px 20px' })).toEqual({
      paddingY: 8,
      paddingX: 12,
    });
  });

  it('lets longhand padding override shorthand and keeps left/top when unequal', () => {
    expect(
      styleToBlockData({
        padding: '10px 20px',
        paddingLeft: 4,
        paddingRight: 8,
        paddingTop: 1,
        paddingBottom: 9,
      })
    ).toEqual({
      paddingX: 4,
      paddingY: 1,
    });
  });

  it('stringifies numeric width and keeps string width', () => {
    expect(styleToBlockData({ width: 100 })).toEqual({ width: '100px' });
    expect(styleToBlockData({ width: '50%' })).toEqual({ width: '50%' });
    expect(styleToBlockData({ width: '48px' })).toEqual({ width: '48px' });
  });

  it('maps margin auto centering to align center', () => {
    expect(
      styleToBlockData({
        marginLeft: 'auto',
        marginRight: 'auto',
      })
    ).toEqual({ align: 'center' });
    expect(styleToBlockData({ marginInline: 'auto' })).toEqual({
      align: 'center',
    });
  });

  it('lets margin auto override textAlign for centering', () => {
    expect(
      styleToBlockData({
        textAlign: 'left',
        marginLeft: 'auto',
        marginRight: 'auto',
      })
    ).toEqual({ align: 'center' });
  });

  it('stringifies string lineHeight', () => {
    expect(styleToBlockData({ lineHeight: '0' })).toEqual({
      lineHeight: '0',
    });
  });
});
