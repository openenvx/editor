export interface BrowserRenderRequest {
  svg: string;
  widthPx: number;
  heightPx: number;
  format: 'png' | 'jpg' | 'pdf';
  quality?: number;
  background?: string;
}

export interface BrowserRenderBackend {
  render(request: BrowserRenderRequest): Promise<Uint8Array>;
}

function wrapSvgHtml(request: BrowserRenderRequest): string {
  const background =
    request.background && request.background !== 'transparent'
      ? request.background
      : 'transparent';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: ${request.widthPx}px;
        height: ${request.heightPx}px;
        background: ${background};
      }
      #artboard {
        width: ${request.widthPx}px;
        height: ${request.heightPx}px;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="artboard">${request.svg}</div>
  </body>
</html>`;
}

export function createCloudflareBrowserRenderer(browser: {
  fetch: typeof fetch;
}): BrowserRenderBackend {
  return {
    async render(request) {
      const html = wrapSvgHtml(request);

      if (request.format === 'pdf') {
        const response = await browser.fetch('https://browser.render/pdf', {
          body: JSON.stringify({
            html,
            pdfOptions: {
              displayHeaderFooter: false,
              height: `${request.heightPx}px`,
              margin: { bottom: 0, left: 0, right: 0, top: 0 },
              printBackground: true,
              width: `${request.widthPx}px`,
            },
          }),
          headers: { 'content-type': 'application/json' },
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(`PDF render failed: ${response.status}`);
        }

        return new Uint8Array(await response.arrayBuffer());
      }

      const response = await browser.fetch(
        'https://browser.render/screenshot',
        {
          body: JSON.stringify({
            html,
            screenshotOptions: {
              fullPage: true,
              omitBackground: request.background === 'transparent',
              type: request.format === 'jpg' ? 'jpeg' : 'png',
            },
            viewport: {
              height: request.heightPx,
              width: request.widthPx,
            },
          }),
          headers: { 'content-type': 'application/json' },
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error(`Screenshot render failed: ${response.status}`);
      }

      return new Uint8Array(await response.arrayBuffer());
    },
  };
}
