import type { ExportImageLoader } from './draw-preview-to-konva';

export function createTrackedExportImageLoader(
  loader: ExportImageLoader,
  missingImageSrcs: string[]
): ExportImageLoader {
  return async (src) => {
    const image = await loader(src);
    if (!image && src) {
      missingImageSrcs.push(src);
    }
    return image;
  };
}
