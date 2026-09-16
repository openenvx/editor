import { Emitter } from '../runtime/emitter';
import type { Event } from '../runtime/emitter';

export interface ThemeService {
  readonly theme: string;
  setTheme(theme: string): void;
  readonly onDidChangeTheme: Event<string>;
}

export class ThemeServiceImpl implements ThemeService {
  private readonly emitter = new Emitter<string>();
  private _theme = 'light';

  readonly onDidChangeTheme = this.emitter.event;

  get theme(): string {
    return this._theme;
  }

  setTheme(theme: string): void {
    if (this._theme === theme) {
      return;
    }
    this._theme = theme;
    this.emitter.fire(theme);
  }
}
