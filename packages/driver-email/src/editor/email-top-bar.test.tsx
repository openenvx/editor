import { WorkbenchController } from '@openenvx/core';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';

import { EMAIL_TOP_BAR_ID } from '../contributions/email-top-bar-contribution';
import { createEmailDemoScene } from '../create-email-demo-scene';
import { DEFAULT_EMAIL_LAYOUT } from '../default-email-layout';
import { EmailBlocksPlugin } from '../plugin/email-blocks-plugin';
import { createEmailWorkbench } from '../test/email-editor-harness';

afterEach(cleanup);

describe('EmailTopBar contribution', () => {
  it('enables the top bar in the email layout', () => {
    expect(DEFAULT_EMAIL_LAYOUT.topBar).toBe(true);
  });

  it('does not register the top bar by default', async () => {
    const { api, dispose } = await createEmailWorkbench();
    try {
      expect(api.getSnapshot().topBars).toEqual([]);
    } finally {
      dispose();
    }
  });

  it('registers the email top bar when the plugin opts in', async () => {
    const controller = new WorkbenchController({
      initialScene: createEmailDemoScene(),
      layout: DEFAULT_EMAIL_LAYOUT,
      plugins: [new EmailBlocksPlugin({ topBar: true })],
    });
    await controller.start();
    try {
      expect(controller.api.getSnapshot().topBars.map((bar) => bar.id)).toEqual(
        [EMAIL_TOP_BAR_ID]
      );
    } finally {
      controller.dispose();
    }
  });
});
