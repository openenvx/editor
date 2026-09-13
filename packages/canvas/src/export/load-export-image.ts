export type ExportImageSource = CanvasImageSource;

export async function loadBrowserExportImage(
  src: string
): Promise<ExportImageSource | null> {
  if (!src) {
    return null;
  }
  return await new Promise((resolve) => {
    const element = new Image();
    element.crossOrigin = 'anonymous';
    element.onload = () => resolve(element);
    element.onerror = () => resolve(null);
    element.src = src;
  });
}
