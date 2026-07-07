/** Screen-space top-left of the centered artboard (zoom + pan applied). */
export interface ArtboardOffset {
  x: number;
  y: number;
}

export function computeArtboardOffset(
  containerWidth: number,
  containerHeight: number,
  artboardWidth: number,
  artboardHeight: number,
  zoom: number,
  panX: number,
  panY: number
): ArtboardOffset {
  const scaledW = artboardWidth * zoom;
  const scaledH = artboardHeight * zoom;
  return {
    x: (containerWidth - scaledW) / 2 + panX,
    y: (containerHeight - scaledH) / 2 + panY,
  };
}
