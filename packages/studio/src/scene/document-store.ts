import {
  createDefaultEditorSession,
  normalizeDocument,
  normalizeEditorSession,
  pruneEditorSession,
  validateDocument,
} from '#studio/schema';
import type {
  Artboard,
  Document,
  EditorSession,
  ValidationError,
} from '#studio/schema';

import type { PageRulesContribution } from '../contributions/page-rules-contribution';
import { Emitter } from '../runtime/emitter';
import type { Event } from '../runtime/emitter';
import {
  artboardRulesLayout,
  DEFAULT_ARTBOARD_RULES_LAYOUT_KEY,
} from '../schema/artboard-helpers';
import { HistoryStack } from './history-stack';
import { applyFrozenNodePolicy } from './layer-editability';
import { nodeExistsOnArtboard } from './layer-tree';
import { DocumentValidationError } from './scene-validation-error';
import {
  cloneDocument,
  cloneEditorSession,
  getActiveArtboard,
  getPrimaryNode,
} from './types';
import type { DocumentTransaction, LiveProjectSnapshot } from './types';

export { DEFAULT_ARTBOARD_RULES_LAYOUT_KEY };

function formatValidationErrors(
  errors: { path: string; message: string }[]
): string[] {
  return errors.map((e) => (e.path ? `${e.path}: ${e.message}` : e.message));
}

export type PageRulesLookup = (
  layout: string
) => PageRulesContribution | undefined;

function touchedArtboardIds(
  previous: Document,
  next: Document
): string[] | 'full' {
  if (
    previous.assets !== next.assets ||
    previous.components !== next.components ||
    previous.templatePolicy !== next.templatePolicy ||
    previous.variables !== next.variables ||
    previous.artboards.length !== next.artboards.length
  ) {
    return 'full';
  }
  const prevById = new Map(
    previous.artboards.map((artboard) => [artboard.id, artboard])
  );
  const nextIds = new Set<string>();
  const touched: string[] = [];
  for (let i = 0; i < next.artboards.length; i += 1) {
    const artboard = next.artboards[i]!;
    nextIds.add(artboard.id);
    const old = prevById.get(artboard.id);
    if (!old) {
      return 'full';
    }
    if (previous.artboards[i]!.id !== artboard.id) {
      return 'full';
    }
    if (old !== artboard) {
      touched.push(artboard.id);
    }
  }
  for (const artboard of previous.artboards) {
    if (!nextIds.has(artboard.id)) {
      return 'full';
    }
  }
  return touched;
}

export class DocumentStore {
  private doc: Document;
  private session: EditorSession;
  private readonly history = new HistoryStack();
  private readonly onDidChangeDocumentEmitter =
    new Emitter<LiveProjectSnapshot>();
  private revision = 0;
  private contentRevision = 0;
  private pageRulesLookup: PageRulesLookup | null = null;

  readonly onDidChangeDocument: Event<LiveProjectSnapshot> =
    this.onDidChangeDocumentEmitter.event;

  /** @deprecated use onDidChangeDocument */
  readonly onDidChangeScene = this.onDidChangeDocument;

  constructor(initial?: Document, initialSession?: EditorSession) {
    this.doc = normalizeDocument(initial ?? {});
    const fallbackArtboardId = this.doc.artboards[0]!.id;
    this.session = initialSession
      ? normalizeEditorSession(initialSession, fallbackArtboardId, this.doc)
      : createDefaultEditorSession(fallbackArtboardId);
    this.syncSessionToDocument();
  }

  setPageRulesLookup(lookup: PageRulesLookup | null): void {
    this.pageRulesLookup = lookup;
  }

  renormalize(): void {
    this.doc = this.finalizeDocumentFull(this.doc);
    this.syncSessionToDocument();
    this.bumpRevision();
    this.notify();
  }

  getDocument(): Readonly<Document> {
    return this.doc;
  }

  /** @deprecated use getDocument */
  getScene(): Readonly<Document> {
    return this.doc;
  }

  getSession(): Readonly<EditorSession> {
    return this.session;
  }

  /** @deprecated use getSession */
  getEditorState(): Readonly<EditorSession> {
    return this.session;
  }

  getRevision(): number {
    return this.revision;
  }

  getContentRevision(): number {
    return this.contentRevision;
  }

  getSnapshot(): LiveProjectSnapshot {
    return {
      contentRevision: this.contentRevision,
      document: cloneDocument(this.doc),
      session: cloneEditorSession(this.session),
    };
  }

  private captureSnapshot(): LiveProjectSnapshot {
    return {
      contentRevision: this.contentRevision,
      document: this.doc,
      session: this.session,
    };
  }

  /** @deprecated use getSession */
  getSelection(): EditorSession {
    return { ...this.session };
  }

  getActiveArtboardId(): string {
    return this.session.activeArtboardId;
  }

  /** @deprecated use getActiveArtboardId */
  getActivePageId(): string {
    return this.session.activeArtboardId;
  }

  getActiveArtboard() {
    return getActiveArtboard(this.doc, this.session.activeArtboardId);
  }

  /** @deprecated use getActiveArtboard */
  getActivePage() {
    return this.getActiveArtboard();
  }

  getPrimaryNode() {
    return getPrimaryNode(this.doc, this.session);
  }

  /** @deprecated use getPrimaryNode */
  getPrimaryLayer() {
    return this.getPrimaryNode();
  }

  setDocument(document: Document): void {
    this.doc = this.finalizeDocumentFull(document);
    this.syncSessionToDocument();
    this.bumpContentRevision();
    this.notify();
  }

  /** @deprecated use setDocument */
  setScene(document: Document): void {
    this.setDocument(document);
  }

  replaceDocument(document: Document): void {
    const before = this.captureSnapshot();
    this.doc = this.finalizeDocumentFull(document);
    this.syncSessionToDocument();
    this.history.push(before);
    this.bumpContentRevision();
    this.notify();
  }

  /** @deprecated use replaceDocument */
  replaceScene(document: Document): void {
    this.replaceDocument(document);
  }

  restoreDocument(document: Document, contentRevision: number): void {
    this.doc = this.finalizeDocumentFull(document);
    this.syncSessionToDocument();
    this.contentRevision = contentRevision;
    this.bumpRevision();
    this.notify();
  }

  /** @deprecated use restoreDocument */
  restoreScene(document: Document, contentRevision: number): void {
    this.restoreDocument(document, contentRevision);
  }

  restoreSnapshot(snapshot: LiveProjectSnapshot): void {
    this.doc = this.finalizeDocumentFull(snapshot.document);
    this.session = normalizeEditorSession(
      snapshot.session,
      this.doc.artboards[0]!.id,
      this.doc
    );
    this.contentRevision = snapshot.contentRevision;
    this.bumpRevision();
    this.notify();
  }

  setSession(session: EditorSession): void {
    this.session = normalizeEditorSession(
      session,
      this.doc.artboards[0]!.id,
      this.doc
    );
    this.bumpRevision();
    this.notify();
  }

  /** @deprecated use setSession */
  setEditorState(session: EditorSession): void {
    this.setSession(session);
  }

  /** @deprecated use setSession */
  setSelection(selection: EditorSession): void {
    this.setSession(selection);
  }

  selectNodes(nodeIds: string[], primaryNodeId?: string | null): void {
    const artboard = getActiveArtboard(this.doc, this.session.activeArtboardId);
    const valid = nodeIds.filter((id) => nodeExistsOnArtboard(artboard, id));
    const primary =
      primaryNodeId === undefined
        ? (valid[0] ?? null)
        : primaryNodeId && valid.includes(primaryNodeId)
          ? primaryNodeId
          : (valid[0] ?? null);
    this.setSession({
      activeArtboardId: artboard.id,
      primaryNodeId: primary,
      selectedNodeIds: valid,
    });
  }

  /** @deprecated use selectNodes */
  selectLayers(layerIds: string[], primaryNodeId?: string | null): void {
    this.selectNodes(layerIds, primaryNodeId);
  }

  setActiveArtboard(artboardId: string): void {
    if (!this.doc.artboards.some((a) => a.id === artboardId)) {
      return;
    }
    this.setSession({
      activeArtboardId: artboardId,
      primaryNodeId: null,
      selectedNodeIds: [],
    });
  }

  /** @deprecated use setActiveArtboard */
  setActivePage(artboardId: string): void {
    this.setActiveArtboard(artboardId);
  }

  apply(transaction: DocumentTransaction): void {
    const before = this.captureSnapshot();
    const live = this.doc;
    const drafted = transaction.apply(live);
    if (
      drafted === live ||
      (drafted.artboards === live.artboards &&
        drafted.assets === live.assets &&
        drafted.components === live.components &&
        drafted.templatePolicy === live.templatePolicy &&
        drafted.variables === live.variables)
    ) {
      return;
    }
    const nextDocument = this.finalizeDocument(drafted, live);
    this.history.push(before);
    this.doc = nextDocument;
    if (transaction.activeArtboardId) {
      this.session = normalizeEditorSession(
        {
          activeArtboardId: transaction.activeArtboardId,
          primaryNodeId: null,
          selectedNodeIds: [],
        },
        this.doc.artboards[0]!.id,
        this.doc
      );
    } else {
      this.syncSessionToDocument();
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
    this.doc = previous.document;
    this.session = previous.session;
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
    this.doc = next.document;
    this.session = next.session;
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

  subscribe(listener: (snapshot: LiveProjectSnapshot) => void): () => void {
    return this.onDidChangeDocument(listener).dispose;
  }

  private finalizeDocument(input: Document, previous: Document): Document {
    const touched = touchedArtboardIds(previous, input);
    if (touched === 'full' || touched.length === input.artboards.length) {
      return this.finalizeDocumentFull(input);
    }
    if (touched.length === 0) {
      return previous;
    }
    return this.finalizeDocumentIncremental(input, new Set(touched));
  }

  private finalizeDocumentFull(input: Document): Document {
    const structural = normalizeDocument(input);
    const withRules = this.applyArtboardRules(structural);
    const withFrozen = applyFrozenNodePolicy(withRules);
    const structuralValidation = validateDocument(withFrozen);
    if (!structuralValidation.valid) {
      throw new DocumentValidationError(
        formatValidationErrors(structuralValidation.errors)
      );
    }
    const ruleErrors = this.collectArtboardRulesErrors(withFrozen);
    if (ruleErrors.length > 0) {
      throw new DocumentValidationError(formatValidationErrors(ruleErrors));
    }
    return withFrozen;
  }

  private finalizeDocumentIncremental(
    input: Document,
    touched: Set<string>
  ): Document {
    const artboards = input.artboards.map((artboard) => {
      if (!touched.has(artboard.id)) {
        return artboard;
      }
      const normalized = normalizeDocument({
        artboards: [artboard],
        ...(input.assets ? { assets: input.assets } : {}),
        ...(input.components ? { components: input.components } : {}),
        ...(input.templatePolicy
          ? { templatePolicy: input.templatePolicy }
          : {}),
      });
      return this.normalizeOneArtboard(normalized.artboards[0]!);
    });
    const next: Document = applyFrozenNodePolicy({ ...input, artboards });

    for (const artboard of next.artboards) {
      if (!touched.has(artboard.id)) {
        continue;
      }
      const result = validateDocument({
        artboards: [artboard],
      });
      if (!result.valid) {
        throw new DocumentValidationError(
          formatValidationErrors(result.errors)
        );
      }
    }

    const ruleErrors = this.collectArtboardRulesErrors(next, touched);
    if (ruleErrors.length > 0) {
      throw new DocumentValidationError(formatValidationErrors(ruleErrors));
    }
    return next;
  }

  private applyArtboardRules(document: Document): Document {
    if (!this.pageRulesLookup) {
      return document;
    }
    return {
      ...document,
      artboards: document.artboards.map((artboard) =>
        this.normalizeOneArtboard(artboard)
      ),
    };
  }

  private normalizeOneArtboard(artboard: Artboard): Artboard {
    const rules = this.pageRulesLookup?.(artboardRulesLayout(artboard));
    return rules
      ? (rules.normalizeArtboard?.(artboard) ??
          rules.normalizePage?.(artboard) ??
          artboard)
      : artboard;
  }

  private collectArtboardRulesErrors(
    document: Document,
    onlyArtboardIds?: Set<string>
  ): ValidationError[] {
    if (!this.pageRulesLookup) {
      return [];
    }
    const errors: ValidationError[] = [];
    for (const artboard of document.artboards) {
      if (onlyArtboardIds && !onlyArtboardIds.has(artboard.id)) {
        continue;
      }
      const layout = artboardRulesLayout(artboard);
      const rules = this.pageRulesLookup(layout);
      if (rules) {
        const ruleErrors =
          rules.validateArtboard?.(artboard) ?? rules.validatePage?.(artboard);
        if (ruleErrors) {
          errors.push(...ruleErrors);
          continue;
        }
      }
      if (
        layout === 'absolute' &&
        (typeof artboard.space?.width !== 'number' ||
          typeof artboard.space?.height !== 'number')
      ) {
        errors.push({
          message: 'absolute layout requires space width and height',
          path: `artboards.${artboard.id}.space`,
        });
      }
    }
    return errors;
  }

  private syncSessionToDocument(): void {
    this.session = pruneEditorSession(this.doc, this.session);
  }

  private bumpRevision(): void {
    this.revision += 1;
  }

  private bumpContentRevision(): void {
    this.bumpRevision();
    this.contentRevision += 1;
  }

  private notify(): void {
    this.onDidChangeDocumentEmitter.fire(this.captureSnapshot());
  }
}

export function reorderNodes(
  nodes: Document['artboards'][0]['nodes'],
  nodeId: string,
  direction: 'up' | 'down'
): Document['artboards'][0]['nodes'] {
  const index = nodes.findIndex((n) => n.id === nodeId);
  if (index === -1) {
    return nodes;
  }
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  return moveNodeToIndex(nodes, nodeId, targetIndex);
}

export function moveNodeToIndex(
  nodes: Document['artboards'][0]['nodes'],
  nodeId: string,
  targetIndex: number
): Document['artboards'][0]['nodes'] {
  const fromIndex = nodes.findIndex((n) => n.id === nodeId);
  if (fromIndex === -1) {
    return nodes;
  }
  const clamped = Math.max(0, Math.min(targetIndex, nodes.length - 1));
  if (fromIndex === clamped) {
    return nodes;
  }
  const result = [...nodes];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(clamped, 0, removed!);
  return result;
}

/** @deprecated use reorderNodes */
export const reorderLayers = reorderNodes;

/** @deprecated use moveNodeToIndex */
export const moveLayerToIndex = moveNodeToIndex;
