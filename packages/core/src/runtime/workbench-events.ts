import type { SceneSnapshot, Selection } from '../scene/types';
import type { EditorInput } from '../workbench/editor-service';
import { Emitter } from './emitter';
import type { Event } from './emitter';

export const WorkbenchEvents = {
  DidChangeActiveEditor: 'onDidChangeActiveEditor',
  DidChangeContext: 'onDidChangeContext',
  DidChangeDirty: 'onDidChangeDirty',
  DidChangeLocale: 'onDidChangeLocale',
  DidChangeScene: 'onDidChangeScene',
  DidChangeSelection: 'onDidChangeSelection',
  DidExecuteCommand: 'onDidExecuteCommand',
} as const;

export type WorkbenchEventName =
  (typeof WorkbenchEvents)[keyof typeof WorkbenchEvents];

export interface WorkbenchEventPayloads {
  [WorkbenchEvents.DidChangeActiveEditor]: EditorInput | null;
  [WorkbenchEvents.DidChangeContext]: void;
  [WorkbenchEvents.DidChangeDirty]: boolean;
  [WorkbenchEvents.DidChangeLocale]: string;
  [WorkbenchEvents.DidChangeScene]: SceneSnapshot;
  [WorkbenchEvents.DidChangeSelection]: Selection;
  [WorkbenchEvents.DidExecuteCommand]: {
    commandId: string;
    result?: unknown;
  };
}

export interface EventBus {
  on<K extends WorkbenchEventName>(
    event: K,
    handler: (payload: WorkbenchEventPayloads[K]) => void
  ): () => void;
  emit(event: typeof WorkbenchEvents.DidChangeContext): void;
  emit<K extends WorkbenchEventName>(
    event: K,
    payload: WorkbenchEventPayloads[K]
  ): void;
  readonly onDidChangeActiveEditor: Event<EditorInput | null>;
  readonly onDidChangeContext: Event<void>;
  readonly onDidChangeDirty: Event<boolean>;
  readonly onDidChangeLocale: Event<string>;
  readonly onDidChangeScene: Event<SceneSnapshot>;
  readonly onDidChangeSelection: Event<Selection>;
  readonly onDidExecuteCommand: Event<{
    commandId: string;
    result?: unknown;
  }>;
}

export class WorkbenchEventService implements EventBus {
  private readonly activeEditorEmitter = new Emitter<EditorInput | null>();
  private readonly contextEmitter = new Emitter<void>();
  private readonly dirtyEmitter = new Emitter<boolean>();
  private readonly localeEmitter = new Emitter<string>();
  private readonly sceneEmitter = new Emitter<SceneSnapshot>();
  private readonly selectionEmitter = new Emitter<Selection>();
  private readonly commandEmitter = new Emitter<{
    commandId: string;
    result?: unknown;
  }>();

  readonly onDidChangeActiveEditor = this.activeEditorEmitter.event;
  readonly onDidChangeContext = this.contextEmitter.event;
  readonly onDidChangeDirty = this.dirtyEmitter.event;
  readonly onDidChangeLocale = this.localeEmitter.event;
  readonly onDidChangeScene = this.sceneEmitter.event;
  readonly onDidChangeSelection = this.selectionEmitter.event;
  readonly onDidExecuteCommand = this.commandEmitter.event;

  on<K extends WorkbenchEventName>(
    event: K,
    handler: (payload: WorkbenchEventPayloads[K]) => void
  ): () => void {
    switch (event) {
      case WorkbenchEvents.DidChangeActiveEditor: {
        return this.onDidChangeActiveEditor(
          handler as (value: EditorInput | null) => void
        ).dispose;
      }
      case WorkbenchEvents.DidChangeContext: {
        return this.onDidChangeContext(handler as (value: void) => void)
          .dispose;
      }
      case WorkbenchEvents.DidChangeDirty: {
        return this.onDidChangeDirty(handler as (value: boolean) => void)
          .dispose;
      }
      case WorkbenchEvents.DidChangeLocale: {
        return this.onDidChangeLocale(handler as (value: string) => void)
          .dispose;
      }
      case WorkbenchEvents.DidChangeScene: {
        return this.onDidChangeScene(handler as (value: SceneSnapshot) => void)
          .dispose;
      }
      case WorkbenchEvents.DidChangeSelection: {
        return this.onDidChangeSelection(handler as (value: Selection) => void)
          .dispose;
      }
      case WorkbenchEvents.DidExecuteCommand: {
        return this.onDidExecuteCommand(
          handler as (value: { commandId: string; result?: unknown }) => void
        ).dispose;
      }
      default: {
        const exhaustive: never = event;
        throw new Error(`Unknown workbench event: ${exhaustive}`);
      }
    }
  }

  emit(event: typeof WorkbenchEvents.DidChangeContext): void;
  emit<K extends WorkbenchEventName>(
    event: K,
    payload: WorkbenchEventPayloads[K]
  ): void;
  emit<K extends WorkbenchEventName>(
    event: K,
    payload?: WorkbenchEventPayloads[K]
  ): void {
    switch (event) {
      case WorkbenchEvents.DidChangeActiveEditor: {
        this.activeEditorEmitter.fire(
          payload as WorkbenchEventPayloads[typeof WorkbenchEvents.DidChangeActiveEditor]
        );
        return;
      }
      case WorkbenchEvents.DidChangeContext: {
        this.contextEmitter.fire(undefined as void);
        return;
      }
      case WorkbenchEvents.DidChangeDirty: {
        this.dirtyEmitter.fire(
          payload as WorkbenchEventPayloads[typeof WorkbenchEvents.DidChangeDirty]
        );
        return;
      }
      case WorkbenchEvents.DidChangeLocale: {
        this.localeEmitter.fire(
          payload as WorkbenchEventPayloads[typeof WorkbenchEvents.DidChangeLocale]
        );
        return;
      }
      case WorkbenchEvents.DidChangeScene: {
        this.sceneEmitter.fire(
          payload as WorkbenchEventPayloads[typeof WorkbenchEvents.DidChangeScene]
        );
        return;
      }
      case WorkbenchEvents.DidChangeSelection: {
        this.selectionEmitter.fire(
          payload as WorkbenchEventPayloads[typeof WorkbenchEvents.DidChangeSelection]
        );
        return;
      }
      case WorkbenchEvents.DidExecuteCommand: {
        this.commandEmitter.fire(
          payload as WorkbenchEventPayloads[typeof WorkbenchEvents.DidExecuteCommand]
        );
        return;
      }
      default: {
        const exhaustive: never = event;
        throw new Error(`Unknown workbench event: ${exhaustive}`);
      }
    }
  }

  dispose(): void {
    this.activeEditorEmitter.dispose();
    this.contextEmitter.dispose();
    this.dirtyEmitter.dispose();
    this.localeEmitter.dispose();
    this.sceneEmitter.dispose();
    this.selectionEmitter.dispose();
    this.commandEmitter.dispose();
  }
}
