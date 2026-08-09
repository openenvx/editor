import { Emitter, type Event } from '../backbone';

export interface WorkbenchLayoutHost {
  setActivityBarVisible(visible: boolean): void;
  toggleActivityBar(): void;
  setPrimarySidebarVisible(visible: boolean): void;
  togglePrimarySidebar(): void;
  setSecondarySidebarVisible(visible: boolean): void;
  toggleSecondarySidebar(): void;
}

export interface ShellUiService {
  readonly commandPaletteOpen: boolean;
  toggleCommandPalette(): void;
  setCommandPaletteOpen(open: boolean): void;
  readonly onDidChangeCommandPaletteOpen: Event<boolean>;

  bindLayoutHost(host: WorkbenchLayoutHost): void;
  setActivityBarVisible(visible: boolean): void;
  toggleActivityBar(): void;
  setPrimarySidebarVisible(visible: boolean): void;
  togglePrimarySidebar(): void;
  setSecondarySidebarVisible(visible: boolean): void;
  toggleSecondarySidebar(): void;
}

export class ShellUiServiceImpl implements ShellUiService {
  private readonly emitter = new Emitter<boolean>();
  private _commandPaletteOpen = false;
  private layoutHost: WorkbenchLayoutHost | null = null;

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

  bindLayoutHost(host: WorkbenchLayoutHost): void {
    this.layoutHost = host;
  }

  setActivityBarVisible(visible: boolean): void {
    this.layoutHost?.setActivityBarVisible(visible);
  }

  toggleActivityBar(): void {
    this.layoutHost?.toggleActivityBar();
  }

  setPrimarySidebarVisible(visible: boolean): void {
    this.layoutHost?.setPrimarySidebarVisible(visible);
  }

  togglePrimarySidebar(): void {
    this.layoutHost?.togglePrimarySidebar();
  }

  setSecondarySidebarVisible(visible: boolean): void {
    this.layoutHost?.setSecondarySidebarVisible(visible);
  }

  toggleSecondarySidebar(): void {
    this.layoutHost?.toggleSecondarySidebar();
  }
}
