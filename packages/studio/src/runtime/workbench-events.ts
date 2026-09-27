import type { EditorSession, LiveProjectSnapshot } from '../scene/types';
import type { EditorInput } from '../workbench/editor-service';
import { Emitter } from './emitter';
import type { Event } from './emitter';
import type { InteractionState } from './interaction-state';

export const WorkbenchEvents = {
  DidChangeActiveEditor: 'onDidChangeActiveEditor',
  DidChangeContext: 'onDidChangeContext',
  DidChangeDirty: 'onDidChangeDirty',
  DidChangeInteraction: 'onDidChangeInteraction',
  DidChangeLocale: 'onDidChangeLocale',
  DidChangeDocument: 'onDidChangeDocument',
  DidChangeSelection: 'onDidChangeSelection',
  DidExecuteCommand: 'onDidExecuteCommand',
} as const;

export type WorkbenchEventName =
  (typeof WorkbenchEvents)[keyof typeof WorkbenchEvents];

export interface WorkbenchEventPayloads {
  [WorkbenchEvents.DidChangeActiveEditor]: EditorInput | null;
  [WorkbenchEvents.DidChangeContext]: void;
  [WorkbenchEvents.DidChangeDirty]: boolean;
  [WorkbenchEvents.DidChangeInteraction]: InteractionState;
  [WorkbenchEvents.DidChangeLocale]: string;
  [WorkbenchEvents.DidChangeDocument]: LiveProjectSnapshot;
  [WorkbenchEvents.DidChangeSelection]: EditorSession;
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
  readonly onDidChangeInteraction: Event<InteractionState>;
  readonly onDidChangeLocale: Event<string>;
  readonly onDidChangeDocument: Event<LiveProjectSnapshot>;
  readonly onDidChangeSelection: Event<EditorSession>;
  readonly onDidExecuteCommand: Event<{
    commandId: string;
    result?: unknown;
  }>;
}

export class WorkbenchEventService implements EventBus {
  private readonly activeEditorEmitter = new Emitter<EditorInput | null>();
  private readonly contextEmitter = new Emitter<void>();
  private readonly dirtyEmitter = new Emitter<boolean>();
  private readonly interactionEmitter = new Emitter<InteractionState>();
  private readonly localeEmitter = new Emitter<string>();
  private readonly documentEmitter = new Emitter<LiveProjectSnapshot>();
  private readonly selectionEmitter = new Emitter<EditorSession>();
  private readonly commandEmitter = new Emitter<{
    commandId: string;
    result?: unknown;
  }>();

  readonly onDidChangeActiveEditor = this.activeEditorEmitter.event;
  readonly onDidChangeContext = this.contextEmitter.event;
  readonly onDidChangeDirty = this.dirtyEmitter.event;
  readonly onDidChangeInteraction = this.interactionEmitter.event;
  readonly onDidChangeLocale = this.localeEmitter.event;
  readonly onDidChangeDocument = this.documentEmitter.event;
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
      case WorkbenchEvents.DidChangeInteraction: {
        return this.onDidChangeInteraction(
          handler as (value: InteractionState) => void
        ).dispose;
      }
      case WorkbenchEvents.DidChangeLocale: {
        return this.onDidChangeLocale(handler as (value: string) => void)
          .dispose;
      }
      case WorkbenchEvents.DidChangeDocument: {
        return this.onDidChangeDocument(
          handler as (value: LiveProjectSnapshot) => void
        ).dispose;
      }
      case WorkbenchEvents.DidChangeSelection: {
        return this.onDidChangeSelection(
          handler as (value: EditorSession) => void
        ).dispose;
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
      case WorkbenchEvents.DidChangeInteraction: {
        this.interactionEmitter.fire(
          payload as WorkbenchEventPayloads[typeof WorkbenchEvents.DidChangeInteraction]
        );
        return;
      }
      case WorkbenchEvents.DidChangeLocale: {
        this.localeEmitter.fire(
          payload as WorkbenchEventPayloads[typeof WorkbenchEvents.DidChangeLocale]
        );
        return;
      }
      case WorkbenchEvents.DidChangeDocument: {
        this.documentEmitter.fire(
          payload as WorkbenchEventPayloads[typeof WorkbenchEvents.DidChangeDocument]
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
    this.interactionEmitter.dispose();
    this.localeEmitter.dispose();
    this.documentEmitter.dispose();
    this.selectionEmitter.dispose();
    this.commandEmitter.dispose();
  }
}
