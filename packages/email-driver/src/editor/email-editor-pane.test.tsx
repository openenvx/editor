import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  createEmailWorkbench,
  renderWithEmailWorkbench,
} from '../test/email-editor-harness';
import { EmailEditorPane } from './email-editor-pane';

afterEach(cleanup);

describe('EmailEditorPane', () => {
  it('mounts the HTML source editor in HTML mode', async () => {
    const { api, dispose } = await createEmailWorkbench();
    try {
      renderWithEmailWorkbench(api, <EmailEditorPane />);
      await api.executeCommand('email.enterHtmlMode');

      await waitFor(() => {
        expect(screen.getByTestId('email-html-source')).toBeTruthy();
      });
    } finally {
      dispose();
    }
  });
});
