import { WorkbenchController } from '@openenvx/studio/core';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';

import { createEmailDemoScene } from '../create-email-demo-scene';
import { DEFAULT_EMAIL_LAYOUT } from '../default-email-layout';
import { EmailBlocksPlugin } from '../plugin/email-blocks-plugin';

afterEach(cleanup);

describe('EmailTopBar contribution', () => {
  it('enables the top bar in the email layout', () => {
    expect(DEFAULT_EMAIL_LAYOUT.topBar).toBe(true);
  });

  it('does not contribute top bar actions without EmailBlocksPlugin', async () => {
    const controller = new WorkbenchController({
      initialScene: createEmailDemoScene(),
      layout: DEFAULT_EMAIL_LAYOUT,
      plugins: [],
    });
    await controller.start();
    try {
      expect(controller.api.getSnapshot().topBarItems).toEqual([]);
    } finally {
      controller.dispose();
    }
  });

  it('contributes email top bar actions when EmailBlocksPlugin is active', async () => {
    const controller = new WorkbenchController({
      initialScene: createEmailDemoScene(),
      layout: DEFAULT_EMAIL_LAYOUT,
      plugins: [new EmailBlocksPlugin()],
    });
    await controller.start();
    try {
      const ids = controller.api
        .getSnapshot()
        .topBarItems.map((item) => item.id);
      expect(ids).toContain('email-topbar-title');
      expect(ids).toContain('email-topbar-modes');
      expect(ids).toContain('email-topbar-save');
    } finally {
      controller.dispose();
    }
  });
});
