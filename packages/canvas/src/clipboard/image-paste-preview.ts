/** Session-only blob: preview URLs — never written into durable scene/history JSON. */
const previewByLayerId = new Map<string, string>();

export function registerImagePastePreview(layerId: string, url: string): void {
  const previous = previewByLayerId.get(layerId);
  if (previous && previous !== url) {
    URL.revokeObjectURL(previous);
  }
  previewByLayerId.set(layerId, url);
}

export function getImagePastePreview(layerId: string): string | undefined {
  return previewByLayerId.get(layerId);
}

export function revokeImagePastePreview(layerId: string): void {
  const url = previewByLayerId.get(layerId);
  if (!url) {
    return;
  }
  URL.revokeObjectURL(url);
  previewByLayerId.delete(layerId);
}

/** Test helper. */
export function clearImagePastePreviewsForTests(): void {
  for (const url of previewByLayerId.values()) {
    URL.revokeObjectURL(url);
  }
  previewByLayerId.clear();
}
