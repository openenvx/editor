import {
  createContextKeyService,
  InstantiationService,
  type CommandContext,
} from '@openenvx/core';
import { describe, expect, it } from 'vitest';

import {
  createEmailModeCommands,
  EmailEditorModeServiceImpl,
  EmailEditorModeServiceId,
} from './email-editor-mode-service';

describe('EmailEditorModeService', () => {
  it('toggles edit/html/preview and syncs context keys while active', () => {
    const service = new EmailEditorModeServiceImpl();
    const keys = createContextKeyService();
    service.bindContextKeys(keys);
    service.setActive(true);

    expect(service.getMode()).toBe('edit');
    expect(keys.get('email.modeEdit')).toBe(true);
    expect(keys.get('email.modeHtml')).toBe(false);
    expect(keys.get('email.modePreview')).toBe(false);

    service.setMode('html');
    expect(service.getMode()).toBe('html');
    expect(keys.get('email.modeHtml')).toBe(true);

    service.setMode('preview');
    expect(service.getMode()).toBe('preview');
    expect(keys.get('email.mode')).toBe('preview');
    expect(keys.get('email.modePreview')).toBe(true);
  });

  it('gates mode commands on active service', async () => {
    const service = new EmailEditorModeServiceImpl();
    const services = new InstantiationService();
    services.registerInstance(EmailEditorModeServiceId, service);
    const ctx = { services } as CommandContext;
    const [enterEdit, enterHtml, enterPreview] = createEmailModeCommands();

    expect(enterPreview.canExecute?.(ctx)).toBe(false);
    service.setActive(true);
    expect(enterPreview.canExecute?.(ctx)).toBe(true);

    await enterPreview.execute(ctx);
    expect(service.getMode()).toBe('preview');

    await enterHtml.execute(ctx);
    expect(service.getMode()).toBe('html');

    await enterEdit.execute(ctx);
    expect(service.getMode()).toBe('edit');
  });
});
