import type {
  Command,
  IconRegistry,
  Registry,
  Scene,
  SceneStore,
  SceneTransaction,
} from '../backbone';
import type { WorkbenchContributionDisposable } from '../registries/workbench-registries';
import type { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import type { SandboxHostSurface } from './sandbox-host-surface';

export interface ExternalHostMountDeps {
  getSceneStore: () => SceneStore;
  getEvents: () => {
    onDidChangeSelection: (listener: () => void) => { dispose: () => void };
  };
  runCommand: (
    commandId: string,
    args?: unknown
  ) => Promise<{ executed: boolean }>;
  registerCommand: (command: Command) => void;
  unregisterCommand: (commandId: string) => void;
  onCommandsChanged: () => void;
  registerWorkbenchContributions: (
    ...contributions: WorkbenchContribution[]
  ) => WorkbenchContributionDisposable;
  viewPanelRegistry: Registry<string, unknown>;
  iconRegistry: IconRegistry;
  onContributionsChanged: () => void;
}

/**
 * Deep module for external host mount lifecycle + narrow surface construction.
 * Isolates / iframes never see this - only first-party Host adapters hold surfaces.
 */
export class ExternalHostMount {
  private readonly disposables = new Set<() => void>();

  constructor(private readonly deps: ExternalHostMountDeps) {}

  mountSandbox(
    activate: (surface: SandboxHostSurface) => void | (() => void)
  ): () => void {
    return this.mountHost(
      (track) => this.createSandboxHostSurface(track),
      activate
    );
  }

  dispose(): void {
    const disposers = [...this.disposables];
    this.disposables.clear();
    for (const dispose of disposers) {
      dispose();
    }
  }

  private mountHost<TSurface>(
    createSurface: (
      trackDisposable: (disposable: WorkbenchContributionDisposable) => void
    ) => TSurface,
    activate: (surface: TSurface) => void | (() => void)
  ): () => void {
    const tracked: WorkbenchContributionDisposable[] = [];
    const surface = createSurface((disposable) => {
      tracked.push(disposable);
    });
    return this.trackMount(activate(surface), tracked);
  }

  private trackMount(
    hostDispose: void | (() => void),
    tracked: WorkbenchContributionDisposable[]
  ): () => void {
    const dispose = () => {
      hostDispose?.();
      for (const disposable of tracked) {
        disposable.dispose();
      }
      tracked.length = 0;
      this.disposables.delete(dispose);
    };
    this.disposables.add(dispose);
    return dispose;
  }

  private createSandboxHostSurface(
    trackDisposable: (disposable: WorkbenchContributionDisposable) => void
  ): SandboxHostSurface {
    const { deps } = this;
    return {
      getSelection: () => deps.getSceneStore().getSelection(),
      getScene: (): Scene => deps.getSceneStore().getScene(),
      apply: (transaction: SceneTransaction) =>
        deps.getSceneStore().apply(transaction),
      selectLayers: (layerIds, primaryLayerId) =>
        deps.getSceneStore().selectLayers(layerIds, primaryLayerId ?? null),
      onDidChangeScene: (listener) =>
        deps.getSceneStore().onDidChangeScene(() => listener()).dispose,
      onDidChangeSelection: (listener) =>
        deps.getEvents().onDidChangeSelection(() => listener()).dispose,
      executeCommand: async (commandId, args) => {
        const result = await deps.runCommand(commandId, args);
        return { executed: result.executed };
      },
      registerCommand: (command: Command) => {
        deps.registerCommand(command);
        deps.onCommandsChanged();
        const disposable: WorkbenchContributionDisposable = {
          dispose: () => {
            deps.unregisterCommand(command.id);
            deps.onCommandsChanged();
          },
        };
        trackDisposable(disposable);
        return disposable;
      },
      registerWorkbenchContributions: (...contributions) => {
        const disposable = deps.registerWorkbenchContributions(
          ...contributions
        );
        trackDisposable(disposable);
        return disposable;
      },
    };
  }
}
