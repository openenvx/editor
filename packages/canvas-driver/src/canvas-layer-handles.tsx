import type Konva from 'konva';
import { Circle, Rect } from 'react-konva';

import type { HandleDescriptor } from './registry/canvas-registry-types';
import {
  resolveResizeHandleCursor,
  setStageContentCursor,
} from './resize-handle-cursor';

export interface CanvasLayerHandlesProps {
  handles: HandleDescriptor[];
  onHandlePointerDown: (anchor: string) => void;
  stroke: string;
}

export function CanvasLayerHandles({
  handles,
  onHandlePointerDown,
  stroke,
}: CanvasLayerHandlesProps) {
  if (handles.length === 0) {
    return null;
  }

  return (
    <>
      {handles.map((handle) => {
        const cursor = resolveResizeHandleCursor(
          handle.anchor,
          handle.rotation
        );

        const onPointerDown = (event: Konva.KonvaEventObject<Event>) => {
          event.cancelBubble = true;
          // Set before handles unmount for the drag session so the cursor sticks.
          setStageContentCursor(event.target, cursor);
          onHandlePointerDown(handle.anchor);
        };

        const onMouseEnter = (event: Konva.KonvaEventObject<MouseEvent>) => {
          setStageContentCursor(event.target, cursor);
        };

        const onMouseLeave = (event: Konva.KonvaEventObject<MouseEvent>) => {
          setStageContentCursor(event.target, '');
        };

        if (handle.shape === 'circle') {
          const radius = Math.min(handle.width, handle.height) / 2;
          return (
            <Circle
              fill={stroke}
              key={handle.anchor}
              listening={true}
              onMouseDown={onPointerDown}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              onTouchStart={onPointerDown}
              radius={radius}
              rotation={handle.rotation}
              stroke={stroke}
              strokeWidth={1}
              x={handle.x + handle.width / 2}
              y={handle.y + handle.height / 2}
            />
          );
        }

        return (
          <Rect
            fill={stroke}
            height={handle.height}
            key={handle.anchor}
            listening={true}
            onMouseDown={onPointerDown}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onTouchStart={onPointerDown}
            rotation={handle.rotation}
            stroke={stroke}
            strokeWidth={1}
            width={handle.width}
            x={handle.x}
            y={handle.y}
          />
        );
      })}
    </>
  );
}
