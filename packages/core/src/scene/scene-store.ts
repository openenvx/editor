import {
  createDefaultEditorState,
  normalizeEditorState,
  normalizeScene,
  pruneEditorState,
  validateScene,
} from '@openenvx/core/schema';
import type {
  EditorState,
  Page,
  Scene,
  Selection,
  ValidationError,
} from '@openenvx/core/schema';

import type { PageRulesContribution } from '../contributions/page-rules-contribution';
import { Emitter } from '../runtime/emitter';
import type { Event } from '../runtime/emitter';
import { HistoryStack } from './history-stack';
import { applyFrozenLayerPolicy } from './layer-editability';
import { layerExistsOnPage } from './layer-tree';
import { SceneValidationError } from './scene-validation-error';
import {
  cloneEditorState,
  cloneScene,
  getActivePage,
  getPrimaryLayer as getPrimaryPageLayer,
} from './types';
import type { SceneSnapshot, SceneTransaction } from './types';

function formatValidationErrors(
  errors: { path: string; message: string }[]
): string[] {
  return errors.map((e) => (e.path ? `${e.path}: ${e.message}` : e.message));
}

export type PageRulesLookup = (
  layout: string
) => PageRulesContribution | undefined;

/**
 * Diff page identity against `previous` to find pages the transaction rewrote.
 * Relies on path-copying transactions (unchanged pages keep === identity).
 * Order-only rewrites (same page refs, new array order) return `'full'`.
 */
function touchedPageIds(previous: Scene, next: Scene): string[] | 'full' {
  if (
    previous.schemaVersion !== next.schemaVersion ||
    previous.assets !== next.assets ||
    previous.components !== next.components ||
    previous.templatePolicy !== next.templatePolicy ||
    previous.variables !== next.variables ||
    previous.pages.length !== next.pages.length
  ) {
    return 'full';
  }
  const prevById = new Map(previous.pages.map((page) => [page.id, page]));
  const nextIds = new Set<string>();
  const touched: string[] = [];
  for (let i = 0; i < next.pages.length; i += 1) {
    const page = next.pages[i]!;
    nextIds.add(page.id);
    const old = prevById.get(page.id);
    if (!old) {
      return 'full';
    }
    // Same refs reordered → must not return touched:[] (would drop the move).
    if (previous.pages[i]!.id !== page.id) {
      return 'full';
    }
    if (old !== page) {
      touched.push(page.id);
    }
  }
  for (const page of previous.pages) {
    if (!nextIds.has(page.id)) {
      return 'full';
    }
  }
  return touched;
}

export class SceneStore {
  private scene: Scene;
  private editorState: EditorState;
  private readonly history = new HistoryStack();
  private readonly onDidChangeSceneEmitter = new Emitter<SceneSnapshot>();
  private revision = 0;
  private contentRevision = 0;
  private pageRulesLookup: PageRulesLookup | null = null;

  readonly onDidChangeScene: Event<SceneSnapshot> =
    this.onDidChangeSceneEmitter.event;

  constructor(initial?: Scene, initialEditorState?: EditorState) {
    this.scene = normalizeScene(initial ?? {});
    const fallbackPageId = this.scene.pages[0]!.id;
    this.editorState = initialEditorState
      ? normalizeEditorState(initialEditorState, fallbackPageId, this.scene)
      : createDefaultEditorState(fallbackPageId);
    this.syncEditorStateToScene();
  }

  /** Wire provider page-rules lookup (call after plugins activate). */
  setPageRulesLookup(lookup: PageRulesLookup | null): void {
    this.pageRulesLookup = lookup;
  }

  /**
   * Re-apply structural + provider page rules to the current scene.
   * Call once after plugins register PageRules contributions.
   */
  renormalize(): void {
    this.scene = this.finalizeSceneFull(this.scene);
    this.syncEditorStateToScene();
    this.bumpRevision();
    this.notify();
  }

  getScene(): Readonly<Scene> {
    return this.scene;
  }

  getEditorState(): Readonly<EditorState> {
    return this.editorState;
  }

  getRevision(): number {
    return this.revision;
  }

  getContentRevision(): number {
    return this.contentRevision;
  }

  /**
   * Deep-cloned snapshot for persistence / external export.
   * Do not use for hot paths — prefer `onDidChangeScene` (shared immutable refs).
   */
  getSnapshot(): SceneSnapshot {
    return {
      contentRevision: this.contentRevision,
      editorState: cloneEditorState(this.editorState),
      scene: cloneScene(this.scene),
    };
  }

  /**
   * Zero-clone snapshot for history + notify. Same `SceneSnapshot` shape as
   * `getSnapshot()`, but scene/editorState are **shared** and must not be
   * mutated (would corrupt live store + undo).
   */
  private captureSnapshot(): SceneSnapshot {
    return {
      contentRevision: this.contentRevision,
      editorState: this.editorState,
      scene: this.scene,
    };
  }

  getSelection(): Selection {
    return { ...this.editorState };
  }

  getActivePageId(): string {
    return this.editorState.activePageId;
  }

  getActivePage() {
    return getActivePage(this.scene, this.editorState.activePageId);
  }

  getPrimaryLayer() {
    return getPrimaryPageLayer(this.scene, this.editorState);
  }

  setScene(scene: Scene): void {
    // Full validation: load / trust-boundary replace (no history — clipboard /
    // hydrate paths that must not invent an undo step).
    this.scene = this.finalizeSceneFull(scene);
    this.syncEditorStateToScene();
    this.bumpContentRevision();
    this.notify();
  }

  /**
   * User-facing full replace (e.g. load a template). Pushes the current
   * snapshot onto undo so the previous document can be restored.
   */
  replaceScene(scene: Scene): void {
    const before = this.captureSnapshot();
    this.scene = this.finalizeSceneFull(scene);
    this.syncEditorStateToScene();
    this.history.push(before);
    this.bumpContentRevision();
    this.notify();
  }

  restoreScene(scene: Scene, contentRevision: number): void {
    this.scene = this.finalizeSceneFull(scene);
    this.syncEditorStateToScene();
    this.contentRevision = contentRevision;
    this.bumpRevision();
    this.notify();
  }

  restoreSnapshot(snapshot: SceneSnapshot): void {
    this.scene = this.finalizeSceneFull(snapshot.scene);
    this.editorState = normalizeEditorState(
      snapshot.editorState,
      this.scene.pages[0]!.id,
      this.scene
    );
    this.contentRevision = snapshot.contentRevision;
    this.bumpRevision();
    this.notify();
  }

  setEditorState(editorState: EditorState): void {
    this.editorState = normalizeEditorState(
      editorState,
      this.scene.pages[0]!.id,
      this.scene
    );
    this.bumpRevision();
    // Selection-only: keep scene identity so React selectors / canvas pane skip re-render.
    this.notify();
  }

  setSelection(selection: Selection): void {
    this.setEditorState(selection);
  }

  selectLayers(layerIds: string[], primaryLayerId?: string | null): void {
    const page = getActivePage(this.scene, this.editorState.activePageId);
    const valid = layerIds.filter((id) => layerExistsOnPage(page, id));
    const primary =
      primaryLayerId === undefined
        ? (valid[0] ?? null)
        : primaryLayerId && valid.includes(primaryLayerId)
          ? primaryLayerId
          : (valid[0] ?? null);
    this.setSelection({
      activePageId: page.id,
      primaryLayerId: primary,
      selectedLayerIds: valid,
    });
  }

  setActivePage(pageId: string): void {
    if (!this.scene.pages.some((p) => p.id === pageId)) {
      return;
    }
    this.setEditorState({
      activePageId: pageId,
      primaryLayerId: null,
      selectedLayerIds: [],
    });
  }

  apply(transaction: SceneTransaction): void {
    const before = this.captureSnapshot();
    // Transactions must be pure (path-copy; do not mutate `scene` in place).
    // Skipping structuredClone lets unchanged pages/layers keep identity →
    // incremental validation + cheap structural-sharing history.
    const live = this.scene;
    const drafted = transaction.apply(live);
    if (
      drafted === live ||
      (drafted.pages === live.pages &&
        drafted.assets === live.assets &&
        drafted.components === live.components &&
        drafted.templatePolicy === live.templatePolicy &&
        drafted.variables === live.variables &&
        drafted.schemaVersion === live.schemaVersion)
    ) {
      // True no-op (same root, or new root wrapping identical root refs).
      // In-place mutators that return the live root corrupt the store without
      // a history step — path-copy is required for real edits.
      return;
    }
    const nextScene = this.finalizeScene(drafted, live);
    this.history.push(before);
    this.scene = nextScene;
    if (transaction.activePageId) {
      this.editorState = normalizeEditorState(
        {
          activePageId: transaction.activePageId,
          primaryLayerId: null,
          selectedLayerIds: [],
        },
        this.scene.pages[0]!.id,
        this.scene
      );
    } else {
      this.syncEditorStateToScene();
    }
    this.bumpContentRevision();
    this.notify();
  }

  undo(): boolean {
    const current = this.captureSnapshot();
    const previous = this.history.undo(current);
    if (!previous) {
      return false;
    }
    this.scene = previous.scene;
    this.editorState = previous.editorState;
    this.contentRevision = previous.contentRevision;
    this.bumpRevision();
    this.notify();
    return true;
  }

  redo(): boolean {
    const current = this.captureSnapshot();
    const next = this.history.redo(current);
    if (!next) {
      return false;
    }
    this.scene = next.scene;
    this.editorState = next.editorState;
    this.contentRevision = next.contentRevision;
    this.bumpRevision();
    this.notify();
    return true;
  }

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }

  subscribe(listener: (snapshot: SceneSnapshot) => void): () => void {
    return this.onDidChangeScene(listener).dispose;
  }

  /**
   * Incremental when `previous` shares page identity with untouched pages;
   * otherwise full normalize+validate (load / root-field / page add-remove).
   */
  private finalizeScene(input: Scene, previous: Scene): Scene {
    const touched = touchedPageIds(previous, input);
    if (touched === 'full' || touched.length === input.pages.length) {
      return this.finalizeSceneFull(input);
    }
    if (touched.length === 0) {
      return previous;
    }
    return this.finalizeSceneIncremental(input, new Set(touched));
  }

  private finalizeSceneFull(input: Scene): Scene {
    const structural = normalizeScene(input);
    const withRules = this.applyPageRules(structural);
    const withFrozen = applyFrozenLayerPolicy(withRules);
    const structuralValidation = validateScene(withFrozen);
    if (!structuralValidation.valid) {
      throw new SceneValidationError(
        formatValidationErrors(structuralValidation.errors)
      );
    }
    const ruleErrors = this.collectPageRulesErrors(withFrozen);
    if (ruleErrors.length > 0) {
      throw new SceneValidationError(formatValidationErrors(ruleErrors));
    }
    return withFrozen;
  }

  private finalizeSceneIncremental(input: Scene, touched: Set<string>): Scene {
    const pages = input.pages.map((page) => {
      if (!touched.has(page.id)) {
        return page;
      }
      const normalized = normalizeScene({
        schemaVersion: input.schemaVersion,
        pages: [page],
        ...(input.assets ? { assets: input.assets } : {}),
        ...(input.components ? { components: input.components } : {}),
        ...(input.templatePolicy
          ? { templatePolicy: input.templatePolicy }
          : {}),
      });
      return this.normalizeOnePage(normalized.pages[0]!);
    });
    const next: Scene = applyFrozenLayerPolicy({ ...input, pages });

    for (const page of next.pages) {
      if (!touched.has(page.id)) {
        continue;
      }
      const result = validateScene({
        schemaVersion: next.schemaVersion,
        pages: [page],
      });
      if (!result.valid) {
        throw new SceneValidationError(formatValidationErrors(result.errors));
      }
    }

    const ruleErrors = this.collectPageRulesErrors(next, touched);
    if (ruleErrors.length > 0) {
      throw new SceneValidationError(formatValidationErrors(ruleErrors));
    }
    return next;
  }

  private applyPageRules(scene: Scene): Scene {
    if (!this.pageRulesLookup) {
      return scene;
    }
    return {
      ...scene,
      pages: scene.pages.map((page) => this.normalizeOnePage(page)),
    };
  }

  private normalizeOnePage(page: Page): Page {
    const rules = this.pageRulesLookup?.(page.layout);
    return rules ? rules.normalizePage(page) : page;
  }

  private collectPageRulesErrors(
    scene: Scene,
    onlyPageIds?: Set<string>
  ): ValidationError[] {
    if (!this.pageRulesLookup) {
      return [];
    }
    const errors: ValidationError[] = [];
    for (const page of scene.pages) {
      if (onlyPageIds && !onlyPageIds.has(page.id)) {
        continue;
      }
      const rules = this.pageRulesLookup(page.layout);
      if (rules) {
        errors.push(...rules.validatePage(page));
        continue;
      }
      // Fail closed: absolute pages need either registered rules or explicit dims.
      if (
        page.layout === 'absolute' &&
        (typeof page.width !== 'number' || typeof page.height !== 'number')
      ) {
        errors.push({
          message: 'absolute layout requires width and height',
          path: `pages.${page.id}.layout`,
        });
      }
    }
    return errors;
  }

  private syncEditorStateToScene(): void {
    this.editorState = pruneEditorState(this.scene, this.editorState);
  }

  private bumpRevision(): void {
    this.revision += 1;
  }

  private bumpContentRevision(): void {
    this.bumpRevision();
    this.contentRevision += 1;
  }

  private notify(): void {
    this.onDidChangeSceneEmitter.fire(this.captureSnapshot());
  }
}

export function reorderLayers(
  layers: Scene['pages'][0]['layers'],
  layerId: string,
  direction: 'up' | 'down'
): Scene['pages'][0]['layers'] {
  const index = layers.findIndex((l) => l.id === layerId);
  if (index === -1) {
    return layers;
  }
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  return moveLayerToIndex(layers, layerId, targetIndex);
}

export function moveLayerToIndex(
  layers: Scene['pages'][0]['layers'],
  layerId: string,
  targetIndex: number
): Scene['pages'][0]['layers'] {
  const fromIndex = layers.findIndex((l) => l.id === layerId);
  if (fromIndex === -1) {
    return layers;
  }
  const clamped = Math.max(0, Math.min(targetIndex, layers.length - 1));
  if (fromIndex === clamped) {
    return layers;
  }
  const result = [...layers];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(clamped, 0, removed!);
  return result;
}
