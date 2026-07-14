import { Circle, Rect } from 'react-konva';

import type { HandleDescriptor } from './registry/canvas-registry-types';

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
        const onPointerDown = (event: { cancelBubble: boolean }) => {
          event.cancelBubble = true;
          onHandlePointerDown(handle.anchor);
        };

        if (handle.shape === 'circle') {
          const radius = Math.min(handle.width, handle.height) / 2;
          return (
            <Circle
              fill={stroke}
              key={handle.anchor}
              listening={true}
              onMouseDown={onPointerDown}
              onTouchStart={onPointerDown}
              radius={radius}
              rotation={handle.rotation}
              stroke={stroke}
              strokeWidth={1}
              x={handle.x + radius}
              y={handle.y + radius}
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
