import { Emitter, type Event } from '@openenvx/core';

export interface ShellUiService {
  readonly commandPaletteOpen: boolean;
  toggleCommandPalette(): void;
  setCommandPaletteOpen(open: boolean): void;
  readonly onDidChangeCommandPaletteOpen: Event<boolean>;
}

export class ShellUiServiceImpl implements ShellUiService {
  private readonly emitter = new Emitter<boolean>();
  private _commandPaletteOpen = false;

  readonly onDidChangeCommandPaletteOpen = this.emitter.event;

  get commandPaletteOpen(): boolean {
    return this._commandPaletteOpen;
  }

  toggleCommandPalette(): void {
    this.setCommandPaletteOpen(!this._commandPaletteOpen);
  }

  setCommandPaletteOpen(open: boolean): void {
    if (this._commandPaletteOpen === open) {
      return;
    }
    this._commandPaletteOpen = open;
    this.emitter.fire(open);
  }
}
