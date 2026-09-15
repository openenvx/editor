import { Rect } from 'react-konva';

export function imageUploadingOpacity(uploading: boolean): number {
  return uploading ? 0.7 : 1;
}

export function ImageUploadingOverlay({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return <Rect fill="rgba(15, 23, 42, 0.2)" height={height} width={width} />;
}
