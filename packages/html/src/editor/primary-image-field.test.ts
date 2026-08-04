import { describe, expect, it } from 'vitest';

import type { FieldDef } from '../block-config';
import {
  primaryImageFieldKey,
  resolveImageFieldsInData,
  slotImageDataPath,
} from './primary-image-field';

describe('primaryImageFieldKey', () => {
  it('returns null when there are no image fields', () => {
    expect(
      primaryImageFieldKey({
        html: { kind: 'richText', label: 'Text' },
        color: { kind: 'color', label: 'Color' },
      })
    ).toBeNull();
  });

  it('prefers src over backgroundImage and other image fields', () => {
    const fields: Record<string, FieldDef> = {
      backgroundImage: { kind: 'image', label: 'Background' },
      photo: { kind: 'image', label: 'Photo' },
      src: { kind: 'image', label: 'Source' },
    };
    expect(primaryImageFieldKey(fields)).toBe('src');
  });

  it('prefers backgroundImage when src is absent', () => {
    expect(
      primaryImageFieldKey({
        photo: { kind: 'image', label: 'Photo' },
        backgroundImage: { kind: 'image', label: 'Background' },
      })
    ).toBe('backgroundImage');
  });

  it('falls back to the first image field', () => {
    expect(
      primaryImageFieldKey({
        title: { kind: 'text', label: 'Title' },
        photo: { kind: 'image', label: 'Photo' },
        cover: { kind: 'image', label: 'Cover' },
      })
    ).toBe('photo');
  });
});

describe('slotImageDataPath', () => {
  it('builds nested slot src path', () => {
    expect(slotImageDataPath('logo', 0)).toBe('slots.logo.0.data.src');
    expect(slotImageDataPath('hero', 2)).toBe('slots.hero.2.data.src');
  });
});

describe('resolveImageFieldsInData', () => {
  it('resolves preferred image keys through the resolver', () => {
    const data = {
      src: 'asset://abc',
      backgroundImage: 'asset://bg',
      alt: 'Logo',
    };
    expect(
      resolveImageFieldsInData(data, (ref) =>
        ref === 'asset://abc' ? 'data:image/png;base64,x' : ref
      )
    ).toEqual({
      src: 'data:image/png;base64,x',
      backgroundImage: 'asset://bg',
      alt: 'Logo',
    });
  });

  it('resolves custom image-kind fields when fields are provided', () => {
    const data = { photo: 'asset://photo', title: 'Hi' };
    expect(
      resolveImageFieldsInData(
        data,
        (ref) => (ref === 'asset://photo' ? 'https://cdn/photo.jpg' : ref),
        {
          photo: { kind: 'image', label: 'Photo' },
          title: { kind: 'text', label: 'Title' },
        }
      )
    ).toEqual({ photo: 'https://cdn/photo.jpg', title: 'Hi' });
  });
});
