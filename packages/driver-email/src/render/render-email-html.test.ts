import { createEmptyScene } from '@openenvx/core/schema';
import { describe, expect, it } from 'vitest';

import { createEmailDemoScene } from '../create-email-demo-scene';
import { renderEmailHtml } from './render-email-html';

describe('renderEmailHtml', () => {
  it('renders starter scene to HTML containing welcome copy', async () => {
    const html = await renderEmailHtml(createEmailDemoScene());
    expect(html).toContain('Welcome');
    expect(html).toContain('Thanks for joining');
  });

  it('rejects scenes without an email layout page', async () => {
    await expect(renderEmailHtml(createEmptyScene())).rejects.toThrow(
      'Scene has no email layout page'
    );
  });
});
