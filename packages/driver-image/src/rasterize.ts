/**
 * Rasterize SVG to PNG/JPEG bytes. Requires DOM (browser or jsdom).
 */
export async function rasterizeSvgToBytes(
  svg: string,
  width: number,
  height: number,
  mimeType: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.92
): Promise<Uint8Array> {
  if (typeof document === 'undefined') {
    throw new TypeError('PNG rasterization requires a DOM environment');
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to encode raster image'));
            return;
          }
          blob
            .arrayBuffer()
            .then((buffer) => resolve(new Uint8Array(buffer)))
            .catch(reject);
        },
        mimeType,
        quality
      );
    };
    image.onerror = () =>
      reject(new Error('Failed to load SVG for rasterization'));
    image.src = url;
  });
}

/**
 * Rasterize SVG to PNG/JPEG data URL. Requires DOM (browser or jsdom).
 */
export async function rasterizeSvgToPng(
  svg: string,
  width: number,
  height: number,
  mimeType: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.92
): Promise<string> {
  if (typeof document === 'undefined') {
    throw new TypeError('PNG rasterization requires a DOM environment');
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL(mimeType, quality));
    };
    image.onerror = () =>
      reject(new Error('Failed to load SVG for rasterization'));
    image.src = url;
  });
}
