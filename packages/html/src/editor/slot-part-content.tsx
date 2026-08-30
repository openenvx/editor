import { canEditLayerData, isLayerVisible } from '@openenvx/core';
import type { Layer } from '@openenvx/core/schema';
import {
  Fragment,
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from 'react';

import type { BlockRegistry } from '../block-registry';
import { useBlockEditor } from './block-editor-context';
import { withDisplayRichTextHtml } from './display-rich-text-html';
import { dataTransferHasFiles, firstImageFile } from './image-file-drop';
import { HtmlRichTextEditorLazy } from './lazy-rich-text-editor';
import {
  primaryImageFieldKey,
  resolveImageFieldsInData,
  slotImageDataPath,
} from './primary-image-field';
import type { RichTextAlign } from './rich-text-align';
import { parseRichTextAlign } from './rich-text-align';
import { resolveSlotRichTextToolbar } from './rich-text-toolbar';

import styles from './html-editor-pane.module.css';

function isRichTextBlock(registry: BlockRegistry, type: string): boolean {
  return registry.get(type)?.fields.html?.kind === 'richText';
}

function layerDataRecord(layer: Layer): Record<string, unknown> {
  return typeof layer.data === 'object' && layer.data !== null
    ? (layer.data as Record<string, unknown>)
    : {};
}

function SlotPartContent({
  hostId,
  slotKey,
  slotIndex,
  part,
  registry,
}: {
  hostId: string;
  slotKey: string;
  slotIndex: number;
  part: Layer;
  registry: BlockRegistry;
}) {
  const {
    selectedId,
    editingTarget,
    onSelect,
    onStartEdit,
    onCommitEdit,
    imageOverride,
    setImageOverride,
    canReplaceImage,
    onReplaceImage,
    resolveAssetUrl,
    scene,
    bindRichTextInsert,
    variableMissingTip = '',
  } = useBlockEditor();
  const config = registry.get(part.type);
  const textBlock = isRichTextBlock(registry, part.type);
  const imageFieldKey = primaryImageFieldKey(config?.fields);
  const editable = canEditLayerData(part);
  const data = resolveImageFieldsInData(
    layerDataRecord(part),
    resolveAssetUrl,
    config?.fields
  );
  const dataPath = `slots.${slotKey}.${slotIndex}.data.html`;
  const imagePath = slotImageDataPath(slotKey, slotIndex);
  const editing =
    editingTarget?.hostId === hostId && editingTarget.dataPath === dataPath;
  const imageSelected =
    selectedId === hostId &&
    imageOverride?.layerId === hostId &&
    imageOverride.fieldPath === imagePath;
  const replaceEnabled = Boolean(imageSelected && canReplaceImage);
  const toolbar = resolveSlotRichTextToolbar(hostId, part, scene, registry);
  const staticDisplayData = useMemo(() => {
    if (editing || !textBlock) {
      return data;
    }
    return withDisplayRichTextHtml(
      data,
      scene.variables ?? [],
      variableMissingTip
    );
  }, [data, editing, scene.variables, textBlock, variableMissingTip]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageDropActive, setImageDropActive] = useState(false);

  // Isolate from parent BlockChrome dnd-kit listeners - otherwise pointerdown
  // on logo/text starts dragging the whole composite instead of selecting.
  const stopParentDrag = useCallback((event: { stopPropagation(): void }) => {
    event.stopPropagation();
  }, []);

  const selectHost = useCallback(() => {
    onSelect(hostId);
  }, [hostId, onSelect]);

  const handleReplaceFile = useCallback(
    (file: File) => {
      void onReplaceImage(hostId, imagePath, file);
    },
    [hostId, imagePath, onReplaceImage]
  );

  const handleImageActivate = useCallback(() => {
    selectHost();
    if (imageSelected && canReplaceImage) {
      // Already targeted - click opens replace (design: select first, then click).
      fileInputRef.current?.click();
      return;
    }
    setImageOverride({ layerId: hostId, fieldPath: imagePath });
  }, [
    canReplaceImage,
    hostId,
    imagePath,
    imageSelected,
    selectHost,
    setImageOverride,
  ]);

  const handleTextActivate = useCallback(() => {
    selectHost();
    // Text faces are not image targets - clear so the pill falls back to the
    // host primary image field (hero background) when the host is selected.
    setImageOverride(null);
    if (editable) {
      onStartEdit(hostId, dataPath);
    }
  }, [dataPath, editable, hostId, onStartEdit, selectHost, setImageOverride]);

  const handleOtherActivate = useCallback(() => {
    selectHost();
    setImageOverride(null);
  }, [selectHost, setImageOverride]);

  const handleCommit = useCallback(
    (html: string, nextAlign?: RichTextAlign) => {
      onCommitEdit(hostId, dataPath, html, nextAlign);
    },
    [dataPath, hostId, onCommitEdit]
  );

  const handleDragOver = useCallback(
    (event: DragEvent) => {
      if (!(replaceEnabled && dataTransferHasFiles(event.dataTransfer.types))) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'copy';
      setImageDropActive(true);
    },
    [replaceEnabled]
  );

  const handleDragLeave = useCallback((event: DragEvent) => {
    const related = event.relatedTarget;
    if (related instanceof Node && event.currentTarget.contains(related)) {
      return;
    }
    setImageDropActive(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      if (!replaceEnabled) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setImageDropActive(false);
      const file = firstImageFile(event.dataTransfer);
      if (file) {
        handleReplaceFile(file);
      }
    },
    [handleReplaceFile, replaceEnabled]
  );

  if (!(config && isLayerVisible(part))) {
    return null;
  }

  if (textBlock && editable) {
    return (
      <div
        className={styles.blockEditableHit}
        role="button"
        tabIndex={selectedId === hostId ? 0 : -1}
        onClick={
          editing
            ? undefined
            : (event) => {
                event.stopPropagation();
                handleTextActivate();
              }
        }
        onKeyDown={
          editing
            ? undefined
            : (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                  return;
                }
                event.preventDefault();
                event.stopPropagation();
                handleTextActivate();
              }
        }
        onPointerDown={stopParentDrag}
      >
        {editing ? (
          <Suspense fallback={config.render({ data })}>
            {config.render({
              data,
              children: (
                <HtmlRichTextEditorLazy
                  align={
                    toolbar.align ? parseRichTextAlign(data.align) : undefined
                  }
                  bindTextInsert={bindRichTextInsert}
                  html={String(data.html ?? '')}
                  onCommit={handleCommit}
                  toolbar={toolbar}
                />
              ),
            })}
          </Suspense>
        ) : (
          config.render({ data: staticDisplayData })
        )}
      </div>
    );
  }

  if (imageFieldKey) {
    return (
      <div
        aria-label={`Replace ${slotKey} image`}
        className={[
          styles.slotImageHit,
          imageSelected ? styles.slotImageHitSelected : '',
          imageDropActive ? styles.slotImageHitDrop : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="button"
        tabIndex={selectedId === hostId ? 0 : -1}
        onClick={(event) => {
          event.stopPropagation();
          handleImageActivate();
        }}
        onDragLeave={replaceEnabled ? handleDragLeave : undefined}
        onDragOver={replaceEnabled ? handleDragOver : undefined}
        onDragStart={(event) => event.preventDefault()}
        onDrop={replaceEnabled ? handleDrop : undefined}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          handleImageActivate();
        }}
        onPointerDown={stopParentDrag}
      >
        {config.render({ data })}
        {canReplaceImage ? (
          <input
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) {
                handleReplaceFile(file);
              }
            }}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={styles.slotPartHit}
      role="button"
      tabIndex={selectedId === hostId ? 0 : -1}
      onClick={(event) => {
        event.stopPropagation();
        handleOtherActivate();
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        handleOtherActivate();
      }}
      onPointerDown={stopParentDrag}
    >
      {config.render({ data })}
    </div>
  );
}

export function buildSlotNodes(
  host: Layer,
  registry: BlockRegistry
): Record<string, ReactNode> | undefined {
  const config = registry.get(host.type);
  if (!config?.slots) {
    return undefined;
  }
  const data = layerDataRecord(host);
  const slotsRaw =
    data.slots && typeof data.slots === 'object' && data.slots !== null
      ? (data.slots as Record<string, unknown>)
      : {};
  const result: Record<string, ReactNode> = {};
  for (const slotKey of Object.keys(config.slots)) {
    const parts = Array.isArray(slotsRaw[slotKey])
      ? (slotsRaw[slotKey] as Layer[])
      : [];
    result[slotKey] = parts.map((part, index) => (
      <Fragment key={part.id}>
        <SlotPartContent
          hostId={host.id}
          part={part}
          registry={registry}
          slotIndex={index}
          slotKey={slotKey}
        />
      </Fragment>
    ));
  }
  return result;
}
