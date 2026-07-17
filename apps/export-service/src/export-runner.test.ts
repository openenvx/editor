import { RENDER_IR_VERSION } from '@openenvx/preview';
import { describe, expect, it } from 'vitest';

import { createExportApp } from './app';
import type { ExportRequest } from './schemas/export-request';
import { runExport } from './services/export-runner';
import { sanitizeRawSvg } from './services/svg-sanitizer';

function createRectDocument(): ExportRequest {
  return {
    document: {
      irVersion: RENDER_IR_VERSION,
      nodes: [
        {
          descriptor: {
            fill: '#3b82f6',
            kind: 'rect',
            stroke: '#1d4ed8',
            strokeWidth: 2,
          },
          id: 'rect-1',
          transform: {
            height: 80,
            opacity: 1,
            rotation: 0,
            width: 120,
            x: 20,
            y: 30,
          },
        },
      ],
      page: {
        background: '#ffffff',
        height: 200,
        width: 300,
      },
    },
    format: 'svg',
  };
}

describe('sanitizeRawSvg', () => {
  it('strips scripts, handlers, and external refs', () => {
    const input =
      '<g onclick="alert(1)"><script>alert(1)</script><image href="https://evil.test/x.png" /></g>';
    const sanitized = sanitizeRawSvg(input);

    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('https://evil.test');
  });
});

describe('runExport', () => {
  it('returns svg bytes for render IR documents', async () => {
    const result = await runExport(createRectDocument());

    const svg = new TextDecoder().decode(result.body);
    expect(result.contentType).toBe('image/svg+xml');
    expect(result.widthPx).toBe(300);
    expect(result.heightPx).toBe(200);
    expect(svg).toContain('<rect');
    expect(svg).toContain('#3b82f6');
    expect(result.diagnostics).toHaveLength(0);
  });

  it('wraps svg with crop marks when bleedMm > 0', async () => {
    const request = createRectDocument();
    request.document.page.bleedMm = 3;
    request.document.page.dpi = 96;
    request.document.page.unit = 'mm';

    const result = await runExport(request);
    const svg = new TextDecoder().decode(result.body);

    expect(result.bleedMm).toBe(3);
    expect(result.widthPx).toBeGreaterThan(300);
    expect(result.heightPx).toBeGreaterThan(200);
    expect(svg).toContain('<line ');
    expect(svg.match(/<line /g)?.length).toBe(8);
  });

  it('fails in strict mode for unknown preview kinds', async () => {
    const request = createRectDocument();
    request.document.nodes.push({
      descriptor: {
        kind: 'customWidget',
        label: 'Widget',
      },
      id: 'custom-1',
      transform: {
        height: 40,
        opacity: 1,
        rotation: 0,
        width: 80,
        x: 160,
        y: 40,
      },
    });

    await expect(runExport(request)).rejects.toThrow(/Unknown preview kind/);
  });

  it('renders placeholders in lenient mode for unknown preview kinds', async () => {
    const request = {
      ...createRectDocument(),
      mode: 'lenient' as const,
    };
    request.document.nodes.push({
      descriptor: {
        kind: 'customWidget',
        label: 'Widget',
      },
      id: 'custom-1',
      transform: {
        height: 40,
        opacity: 1,
        rotation: 0,
        width: 80,
        x: 160,
        y: 40,
      },
    });

    const result = await runExport(request);
    const svg = new TextDecoder().decode(result.body);

    expect(svg).toContain('<rect');
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.nodeId).toBe('custom-1');
  });

  it('passes through sanitized raw svg fragments', async () => {
    const request = createRectDocument();
    request.document.nodes.push({
      descriptor: {
        kind: 'raw',
        svg: '<rect width="40" height="40" fill="#111827" /><script>alert(1)</script>',
      },
      id: 'raw-1',
      transform: {
        height: 40,
        opacity: 1,
        rotation: 0,
        width: 40,
        x: 5,
        y: 5,
      },
    });

    const result = await runExport(request);
    const svg = new TextDecoder().decode(result.body);

    expect(svg).toContain('fill="#111827"');
    expect(svg).not.toContain('<script');
  });

  it('isolates broken nodes in lenient mode', async () => {
    const request = {
      ...createRectDocument(),
      mode: 'lenient' as const,
    };
    request.document.nodes.push({
      descriptor: {
        children: [{ kind: 'rect', fill: '#000000' }],
        direction: 'horizontal',
        kind: 'stack',
      },
      id: 'broken-stack',
      transform: {
        height: 0,
        opacity: 1,
        rotation: 0,
        width: 0,
        x: 0,
        y: 0,
      },
    });

    const result = await runExport(request);
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(0);
    expect(new TextDecoder().decode(result.body)).toContain('<svg');
  });

  it('rejects oversized raw svg payloads', async () => {
    const request = createRectDocument();
    request.document.nodes.push({
      descriptor: {
        kind: 'raw',
        svg: 'x'.repeat(2 * 1024 * 1024),
      },
      id: 'huge-raw',
      transform: {
        height: 40,
        opacity: 1,
        rotation: 0,
        width: 40,
        x: 0,
        y: 0,
      },
    });

    await expect(runExport(request)).rejects.toThrow(/raw SVG exceeds/);
  });
});

describe('export app', () => {
  it('handles health and svg export routes', async () => {
    const app = createExportApp();

    const health = await app.request('/health');
    expect(health.status).toBe(200);

    const response = await app.request('/api/export', {
      body: JSON.stringify(createRectDocument()),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/svg+xml');
    expect(response.headers.get('x-export-width')).toBe('300');
    expect(response.headers.get('x-export-warnings')).toBe('0');
    const svg = await response.text();
    expect(svg).toContain('<svg');
  });

  it('rejects unsupported ir versions', async () => {
    const app = createExportApp();
    const request = createRectDocument();
    request.document.irVersion = 99 as never;

    const response = await app.request('/api/export', {
      body: JSON.stringify(request),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    expect(response.status).toBe(400);
  });
});
