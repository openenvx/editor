import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

import { computeArtboardOffset } from '../artboard-offset';
import type {
  UserGuide,
  UserGuideOrientation,
} from './canvas-ruler-guides-settings';
import {
  artboardToScreenPoint,
  buildRulerTicks,
  isGuideWithinArtboard,
  RULER_SIZE_PX,
  screenToArtboardPoint,
} from './ruler-math';

import styles from './canvas-rulers.module.css';

type GuideDragMode = 'create' | 'move';

interface GuideDragState {
  guideId: string | null;
  mode: GuideDragMode;
  orientation: UserGuideOrientation;
}

export interface CanvasRulersProps {
  artboardHeight: number;
  artboardWidth: number;
  children: ReactNode;
  containerHeight: number;
  containerWidth: number;
  guides: readonly UserGuide[];
  onAddGuide: (guide: {
    orientation: UserGuideOrientation;
    position: number;
  }) => void;
  onMoveGuide: (guideId: string, position: number) => void;
  onRemoveGuide: (guideId: string) => void;
  panX: number;
  panY: number;
  showRulers: boolean;
  zoom: number;
}

export function CanvasRulers({
  artboardHeight,
  artboardWidth,
  children,
  containerHeight,
  containerWidth,
  guides,
  onAddGuide,
  onMoveGuide,
  onRemoveGuide,
  panX,
  panY,
  showRulers,
  zoom,
}: CanvasRulersProps) {
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const [cursorArtboard, setCursorArtboard] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [drag, setDrag] = useState<GuideDragState | null>(null);
  const [previewPosition, setPreviewPosition] = useState<number | null>(null);
  const dragRef = useRef<GuideDragState | null>(null);
  dragRef.current = drag;

  const artboardOffset = useMemo(
    () =>
      computeArtboardOffset(
        containerWidth,
        containerHeight,
        artboardWidth,
        artboardHeight,
        zoom,
        panX,
        panY
      ),
    [
      artboardHeight,
      artboardWidth,
      containerHeight,
      containerWidth,
      panX,
      panY,
      zoom,
    ]
  );

  const horizontalTicks = useMemo(
    () =>
      buildRulerTicks({
        artboardSize: artboardWidth,
        offset: artboardOffset.x,
        viewEnd: containerWidth,
        viewStart: 0,
        zoom,
      }),
    [artboardOffset.x, artboardWidth, containerWidth, zoom]
  );

  const verticalTicks = useMemo(
    () =>
      buildRulerTicks({
        artboardSize: artboardHeight,
        offset: artboardOffset.y,
        viewEnd: containerHeight,
        viewStart: 0,
        zoom,
      }),
    [artboardOffset.y, artboardHeight, containerHeight, zoom]
  );

  const pointerToArtboard = useCallback(
    (clientX: number, clientY: number) => {
      const area = stageAreaRef.current;
      if (!area) {
        return null;
      }
      const rect = area.getBoundingClientRect();
      return screenToArtboardPoint(
        clientX - rect.left,
        clientY - rect.top,
        artboardOffset,
        zoom
      );
    },
    [artboardOffset, zoom]
  );

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      const current = dragRef.current;
      if (!current) {
        return;
      }
      const point = pointerToArtboard(clientX, clientY);
      const position =
        point === null
          ? null
          : current.orientation === 'vertical'
            ? point.x
            : point.y;
      const within =
        position !== null &&
        isGuideWithinArtboard(
          current.orientation,
          position,
          artboardWidth,
          artboardHeight
        );

      if (current.mode === 'create') {
        if (within && position !== null) {
          onAddGuide({
            orientation: current.orientation,
            position,
          });
        }
      } else if (current.guideId) {
        if (within && position !== null) {
          onMoveGuide(current.guideId, position);
        } else {
          onRemoveGuide(current.guideId);
        }
      }

      setDrag(null);
      setPreviewPosition(null);
    },
    [
      artboardHeight,
      artboardWidth,
      onAddGuide,
      onMoveGuide,
      onRemoveGuide,
      pointerToArtboard,
    ]
  );

  const cancelDrag = useCallback(() => {
    if (!dragRef.current) {
      return;
    }
    setDrag(null);
    setPreviewPosition(null);
  }, []);

  useEffect(() => {
    if (!drag) {
      return;
    }

    const onMove = (event: PointerEvent) => {
      const point = pointerToArtboard(event.clientX, event.clientY);
      if (!point) {
        return;
      }
      setCursorArtboard((prev) =>
        prev && prev.x === point.x && prev.y === point.y ? prev : point
      );
      const nextPosition = drag.orientation === 'vertical' ? point.x : point.y;
      setPreviewPosition(nextPosition);
    };

    const onUp = (event: PointerEvent) => {
      finishDrag(event.clientX, event.clientY);
    };

    const onCancel = () => {
      cancelDrag();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [cancelDrag, drag, finishDrag, pointerToArtboard]);

  const handleStagePointerMove = useCallback(
    (event: ReactPointerEvent) => {
      const point = pointerToArtboard(event.clientX, event.clientY);
      setCursorArtboard((prev) => {
        if (point === null) {
          return prev === null ? prev : null;
        }
        if (prev && prev.x === point.x && prev.y === point.y) {
          return prev;
        }
        return point;
      });
    },
    [pointerToArtboard]
  );

  const handleStagePointerLeave = useCallback(() => {
    if (!drag) {
      setCursorArtboard(null);
    }
  }, [drag]);

  const startCreate = useCallback((orientation: UserGuideOrientation) => {
    setDrag({ guideId: null, mode: 'create', orientation });
    setPreviewPosition(null);
  }, []);

  const startMove = useCallback((guide: UserGuide) => {
    setDrag({
      guideId: guide.id,
      mode: 'move',
      orientation: guide.orientation,
    });
    setPreviewPosition(guide.position);
  }, []);

  const cursorScreen = cursorArtboard
    ? artboardToScreenPoint(
        cursorArtboard.x,
        cursorArtboard.y,
        artboardOffset,
        zoom
      )
    : null;

  const previewGuide =
    drag && previewPosition !== null
      ? { orientation: drag.orientation, position: previewPosition }
      : null;

  const visibleGuides =
    drag?.mode === 'move' && drag.guideId
      ? guides.filter((guide) => guide.id !== drag.guideId)
      : guides;

  const rulerInset = showRulers ? RULER_SIZE_PX : 0;

  // Keep a stable DOM tree when toggling rulers so stageHost (and its
  // ResizeObserver) never remounts - swapping wrappers was collapsing size to 0.
  return (
    <div
      className={
        showRulers
          ? styles.rulerFrame
          : `${styles.rulerFrame} ${styles.rulerFrameCollapsed}`
      }
    >
      <div aria-hidden className={styles.rulerCorner} />
      <div
        aria-hidden={!showRulers}
        aria-label="Horizontal ruler"
        className={styles.rulerTop}
        onPointerDown={(event) => {
          if (!showRulers) {
            return;
          }
          event.preventDefault();
          startCreate('vertical');
          const point = pointerToArtboard(event.clientX, event.clientY);
          if (point) {
            setPreviewPosition(point.x);
            setCursorArtboard(point);
          }
        }}
      >
        {showRulers
          ? horizontalTicks.map((tick) => (
              <span
                className={tick.major ? styles.tickMajorH : styles.tickMinorH}
                key={`h-${tick.screen}`}
                style={{ left: tick.screen }}
              >
                {tick.label ? (
                  <span className={styles.tickLabelH}>{tick.label}</span>
                ) : null}
              </span>
            ))
          : null}
        {showRulers && cursorScreen ? (
          <span
            className={styles.cursorMarkerH}
            style={{ left: cursorScreen.x }}
          />
        ) : null}
      </div>
      <div
        aria-hidden={!showRulers}
        aria-label="Vertical ruler"
        className={styles.rulerLeft}
        onPointerDown={(event) => {
          if (!showRulers) {
            return;
          }
          event.preventDefault();
          startCreate('horizontal');
          const point = pointerToArtboard(event.clientX, event.clientY);
          if (point) {
            setPreviewPosition(point.y);
            setCursorArtboard(point);
          }
        }}
      >
        {showRulers
          ? verticalTicks.map((tick) => (
              <span
                className={tick.major ? styles.tickMajorV : styles.tickMinorV}
                key={`v-${tick.screen}`}
                style={{ top: tick.screen }}
              >
                {tick.label ? (
                  <span className={styles.tickLabelV}>{tick.label}</span>
                ) : null}
              </span>
            ))
          : null}
        {showRulers && cursorScreen ? (
          <span
            className={styles.cursorMarkerV}
            style={{ top: cursorScreen.y }}
          />
        ) : null}
      </div>
      <div
        className={styles.stageSlot}
        onPointerLeave={handleStagePointerLeave}
        onPointerMove={handleStagePointerMove}
        ref={stageAreaRef}
      >
        {children}
      </div>
      <GuideLayer
        artboardOffset={artboardOffset}
        guides={visibleGuides}
        onStartMove={startMove}
        preview={previewGuide}
        rulerInset={rulerInset}
        zoom={zoom}
      />
    </div>
  );
}

function GuideLayer({
  artboardOffset,
  guides,
  onStartMove,
  preview,
  rulerInset,
  zoom,
}: {
  artboardOffset: { x: number; y: number };
  guides: readonly UserGuide[];
  onStartMove: (guide: UserGuide) => void;
  preview: { orientation: UserGuideOrientation; position: number } | null;
  rulerInset: number;
  zoom: number;
}) {
  return (
    <div className={styles.guideLayer}>
      {guides.map((guide) => {
        if (guide.orientation === 'vertical') {
          const left = rulerInset + artboardOffset.x + guide.position * zoom;
          return (
            <button
              aria-label="Vertical guide"
              className={styles.guideV}
              key={guide.id}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onStartMove(guide);
              }}
              style={{ left: left - 3 }}
              type="button"
            />
          );
        }
        const top = rulerInset + artboardOffset.y + guide.position * zoom;
        return (
          <button
            aria-label="Horizontal guide"
            className={styles.guideH}
            key={guide.id}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onStartMove(guide);
            }}
            style={{ top: top - 3 }}
            type="button"
          />
        );
      })}
      {preview ? (
        preview.orientation === 'vertical' ? (
          <div
            className={styles.guidePreviewV}
            style={{
              left: rulerInset + artboardOffset.x + preview.position * zoom,
            }}
          />
        ) : (
          <div
            className={styles.guidePreviewH}
            style={{
              top: rulerInset + artboardOffset.y + preview.position * zoom,
            }}
          />
        )
      ) : null}
    </div>
  );
}

export { RULER_SIZE_PX };
