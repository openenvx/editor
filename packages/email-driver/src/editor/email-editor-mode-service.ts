import { Command, createServiceId, Emitter } from '@openenvx/core';
import type { CommandContext, ContextKeyService, Event } from '@openenvx/core';

export type EmailEditorMode = 'edit' | 'html' | 'preview';

export interface EmailEditorModeService {
  readonly onDidChange: Event<void>;
  getMode(): EmailEditorMode;
  setMode(mode: EmailEditorMode): void;
  setActive(active: boolean): void;
  isActive(): boolean;
  bindContextKeys(keys: ContextKeyService | null): void;
}

export const EmailEditorModeServiceId =
  createServiceId<EmailEditorModeService>('emailEditorMode');

export class EmailEditorModeServiceImpl implements EmailEditorModeService {
  private readonly changeEmitter = new Emitter<void>();
  readonly onDidChange: Event<void> = this.changeEmitter.event;

  private mode: EmailEditorMode = 'edit';
  private active = false;
  private contextKeys: ContextKeyService | null = null;

  getMode(): EmailEditorMode {
    return this.mode;
  }

  setMode(mode: EmailEditorMode): void {
    if (this.mode === mode) {
      return;
    }
    this.mode = mode;
    this.syncContextKeys();
    this.changeEmitter.fire();
  }

  setActive(active: boolean): void {
    if (this.active === active) {
      return;
    }
    this.active = active;
    this.syncContextKeys();
    this.changeEmitter.fire();
  }

  isActive(): boolean {
    return this.active;
  }

  bindContextKeys(keys: ContextKeyService | null): void {
    if (this.contextKeys === keys) {
      return;
    }
    this.contextKeys = keys;
    this.syncContextKeys();
  }

  private syncContextKeys(): void {
    const keys = this.contextKeys;
    if (!keys) {
      return;
    }
    keys.setContext('email.editorActive', this.active);
    keys.setContext('email.mode', this.mode);
    keys.setContext('email.modeEdit', this.mode === 'edit');
    keys.setContext('email.modeHtml', this.mode === 'html');
    keys.setContext('email.modePreview', this.mode === 'preview');
  }
}

function getModeService(ctx: CommandContext): EmailEditorModeService | null {
  if (!ctx.services.has(EmailEditorModeServiceId)) {
    return null;
  }
  const service = ctx.services.get(EmailEditorModeServiceId);
  return service.isActive() ? service : null;
}

export class EmailEnterEditModeCommand extends Command {
  readonly id = 'email.enterEditMode';

  canExecute(ctx: CommandContext): boolean {
    return getModeService(ctx) !== null;
  }

  execute(ctx: CommandContext): void {
    getModeService(ctx)?.setMode('edit');
  }
}

export class EmailEnterHtmlModeCommand extends Command {
  readonly id = 'email.enterHtmlMode';

  canExecute(ctx: CommandContext): boolean {
    return getModeService(ctx) !== null;
  }

  execute(ctx: CommandContext): void {
    getModeService(ctx)?.setMode('html');
  }
}

export class EmailEnterPreviewModeCommand extends Command {
  readonly id = 'email.enterPreviewMode';

  canExecute(ctx: CommandContext): boolean {
    return getModeService(ctx) !== null;
  }

  execute(ctx: CommandContext): void {
    getModeService(ctx)?.setMode('preview');
  }
}

export function createEmailModeCommands(): Command[] {
  return [
    new EmailEnterEditModeCommand(),
    new EmailEnterHtmlModeCommand(),
    new EmailEnterPreviewModeCommand(),
  ];
}
