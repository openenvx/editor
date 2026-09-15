import { useEffect, useState } from 'react';

export function useLoadedImage(src: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    const element = new window.Image();
    element.crossOrigin = 'anonymous';
    element.src = src;
    element.onload = () => setImage(element);
    element.onerror = () => setImage(null);
    return () => {
      element.onload = null;
      element.onerror = null;
    };
  }, [src]);

  return image;
}
