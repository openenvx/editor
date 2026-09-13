import { describe, expect, it } from 'vitest';

import { assertExportImageUrlAllowed } from './validate-export-image-url';

describe('assertExportImageUrlAllowed', () => {
  it('allows https and data URLs', () => {
    expect(() =>
      assertExportImageUrlAllowed('https://cdn.example.com/image.png')
    ).not.toThrow();
    expect(() =>
      assertExportImageUrlAllowed('data:image/png;base64,abc')
    ).not.toThrow();
  });

  it('blocks private hosts and disallowed schemes', () => {
    expect(() => assertExportImageUrlAllowed('http://127.0.0.1/x')).toThrow(
      /not allowed/
    );
    expect(() => assertExportImageUrlAllowed('file:///etc/passwd')).toThrow(
      /scheme/
    );
  });
});
