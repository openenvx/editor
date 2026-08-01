/**
 * Regenerate `src/fonts/google-fonts-catalog.json` from the Google Web Fonts API.
 *
 *   bun run fonts:fetch
 *
 * Reads `GOOGLE_FONTS_API_KEY` from the repo-root `.env` (see `.env.example`).
 * Do not commit API keys.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

interface WebfontItem {
  family: string;
  category?: string;
  files?: Record<string, string>;
}

interface WebfontResponse {
  items?: WebfontItem[];
}

const key = process.env.GOOGLE_FONTS_API_KEY?.trim();
if (!key) {
  console.error(
    'Missing GOOGLE_FONTS_API_KEY. Copy `.env.example` → `.env` at the repo root.'
  );
  process.exit(1);
}

const url = new URL('https://www.googleapis.com/webfonts/v1/webfonts');
url.searchParams.set('key', key);
url.searchParams.set('sort', 'popularity');

const response = await fetch(url);
if (!response.ok) {
  console.error(
    `Google Fonts API failed: ${response.status} ${response.statusText}`
  );
  process.exit(1);
}

const payload = (await response.json()) as WebfontResponse;
const items = payload.items ?? [];
const catalog = items.map((item) => ({
  c: item.category ?? 'sans-serif',
  i: item.family,
  v: Object.keys(item.files ?? {}).toSorted((a, b) => {
    const ai = a.endsWith('italic') ? 1 : 0;
    const bi = b.endsWith('italic') ? 1 : 0;
    return ai - bi || a.localeCompare(b);
  }),
}));

const outPath = path.join(
  import.meta.dirname,
  '../src/fonts/google-fonts-catalog.json'
);
mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(catalog)}\n`);
console.log(`Wrote ${catalog.length} families → ${outPath}`);
