import { describe, expect, it } from 'vitest';

import { dataTransferHasFiles, firstImageFile } from './image-file-drop';

describe('image-file-drop', () => {
  it('picks the first image/* file', () => {
    const image = new File(['x'], 'a.png', { type: 'image/png' });
    const text = new File(['y'], 'a.txt', { type: 'text/plain' });
    expect(firstImageFile([text, image])).toBe(image);
    expect(firstImageFile([text])).toBeNull();
  });

  it('detects Files in dataTransfer types', () => {
    expect(dataTransferHasFiles(['Files', 'text/plain'])).toBe(true);
    expect(dataTransferHasFiles(['text/plain'])).toBe(false);
  });
});
