import { memo, useCallback, useEffect, useRef } from 'react';

import styles from './email-editor-pane.module.css';

export interface EmailHtmlPreviewProps {
  html: string;
}

function syncIframeHeight(iframe: HTMLIFrameElement) {
  const doc = iframe.contentDocument;
  if (!doc?.documentElement) {
    return;
  }
  const height = Math.max(
    doc.documentElement.scrollHeight,
    doc.body?.scrollHeight ?? 0
  );
  if (height > 0) {
    iframe.style.height = `${height}px`;
  }
}

export const EmailHtmlPreview = memo(({ html }: EmailHtmlPreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const measure = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      syncIframeHeight(iframe);
    }
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }
    measure();
    const doc = iframe.contentDocument;
    if (!doc) {
      return;
    }
    const images = [...doc.images];
    for (const image of images) {
      if (!image.complete) {
        image.addEventListener('load', measure);
        image.addEventListener('error', measure);
      }
    }
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            measure();
          });
    if (observer && doc.body) {
      observer.observe(doc.body);
    }
    return () => {
      for (const image of images) {
        image.removeEventListener('load', measure);
        image.removeEventListener('error', measure);
      }
      observer?.disconnect();
    };
  }, [html, measure]);

  return (
    <iframe
      className={styles.previewFrame}
      ref={iframeRef}
      sandbox="allow-same-origin"
      srcDoc={html}
      title="Email preview"
      onLoad={measure}
    />
  );
});
