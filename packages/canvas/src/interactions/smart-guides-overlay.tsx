import { Group, Label, Line, Rect, Tag, Text } from 'react-konva';

import type { GuideLine, SpacingGuide } from './smart-guides';

const GUIDE_STROKE_WIDTH = 2;
const CENTER_GUIDE_STROKE_WIDTH = 2;
const SPACING_STROKE_WIDTH = 2;

export interface PageMarginOverlayProps {
  bounds: {
    height: number;
    width: number;
    x: number;
    y: number;
  } | null;
  stroke: string;
}

export function PageMarginOverlay({ bounds, stroke }: PageMarginOverlayProps) {
  if (!bounds) {
    return null;
  }
  return (
    <Rect
      dash={[6, 4]}
      height={bounds.height}
      listening={false}
      stroke={stroke}
      strokeWidth={1.5}
      width={bounds.width}
      x={bounds.x}
      y={bounds.y}
    />
  );
}

export interface SmartGuidesOverlayProps {
  foreground: string;
  guides: GuideLine[];
  spacing: SpacingGuide[];
  stroke: string;
}

function renderGuideLine(guide: GuideLine, index: number, stroke: string) {
  const isCenterGuide = guide.fullSpan === true;
  const points =
    guide.orientation === 'v'
      ? [guide.position, guide.extent[0], guide.position, guide.extent[1]]
      : [guide.extent[0], guide.position, guide.extent[1], guide.position];

  return (
    <Line
      dash={isCenterGuide ? undefined : [6, 4]}
      key={`guide-${guide.orientation}-${index}`}
      listening={false}
      points={points}
      stroke={stroke}
      strokeWidth={
        isCenterGuide ? CENTER_GUIDE_STROKE_WIDTH : GUIDE_STROKE_WIDTH
      }
    />
  );
}

export function SmartGuidesOverlay({
  foreground,
  guides,
  spacing,
  stroke,
}: SmartGuidesOverlayProps) {
  if (guides.length === 0 && spacing.length === 0) {
    return null;
  }

  return (
    <Group listening={false}>
      {guides.map((guide, index) => renderGuideLine(guide, index, stroke))}
      {spacing.map((entry, index) => (
        <Group key={`spacing-${index}`}>
          <Line
            dash={[6, 4]}
            points={[
              entry.lineStart.x,
              entry.lineStart.y,
              entry.lineEnd.x,
              entry.lineEnd.y,
            ]}
            stroke={stroke}
            strokeWidth={SPACING_STROKE_WIDTH}
          />
          <Label
            listening={false}
            x={entry.labelPosition.x}
            y={entry.labelPosition.y}
          >
            <Tag
              cornerRadius={3}
              fill={stroke}
              lineJoin="round"
              pointerDirection="down"
              pointerHeight={3}
              pointerWidth={6}
            />
            <Text
              fill={foreground}
              fontFamily="Geist Mono, ui-monospace, monospace"
              fontSize={10}
              padding={4}
              text={`${entry.gap}`}
            />
          </Label>
        </Group>
      ))}
    </Group>
  );
}
