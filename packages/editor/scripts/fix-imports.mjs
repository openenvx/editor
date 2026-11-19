import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '../src');

const REPLACEMENTS = [
  [/from '#studio\/schema'/g, "from '@openenvx/editor/schema'"],
  [/from "#studio\/schema"/g, 'from "@openenvx/editor/schema"'],
  [/from '#studio\/preview'/g, "from '@openenvx/editor/preview'"],
  [/from '#studio\/react'/g, "from '@openenvx/studio/react'"],
  [/from '#studio'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/backbone'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/runtime\/contribution'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/runtime\/contribution-point'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/runtime\/emitter'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/runtime\/plugin'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/contributions\/command'/g, "from '@openenvx/studio'"],
  [
    /from '\.\.\/contributions\/shortcut-contribution'/g,
    "from '@openenvx/studio'",
  ],
  [/from '\.\.\/contributions\/view-contribution'/g, "from '@openenvx/studio'"],
  [
    /from '\.\.\/contributions\/status-bar-contribution'/g,
    "from '@openenvx/studio'",
  ],
  [/from '\.\.\/workbench\/workbench-plugin'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/workbench\/workbench-state'/g, "from '@openenvx/studio'"],
  [
    /from '\.\.\/properties\/layer-properties-pane-factory'/g,
    "from '@openenvx/studio'",
  ],
  [/from '\.\.\/properties\/property-path'/g, "from '@openenvx/editor'"],
  [/from '\.\.\/i18n\/localization-service'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/i18n\/workbench-i18n'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/runtime\/instantiation-service'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/workbench\/inspector-container'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/state\/view-descriptor-builder'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/state\/workbench-slice-context'/g, "from '@openenvx/studio'"],
  [
    /from '\.\.\/workbench\/workbench-state-cache'/g,
    "from '@openenvx/studio/internal'",
  ],
  [/from '\.\.\/builders\/property-builder'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/builders\/widget-manifest-fields'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/runtime\/types'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/runtime\/workbench-events'/g, "from '@openenvx/studio'"],
  [/from '\.\.\/registries\/registries'/g, "from '@openenvx/studio'"],
  [
    /from '\.\.\/services\/text-block-insert-service'/g,
    "from '@openenvx/studio'",
  ],
  [/from '\.\.\/utils\/nested-value'/g, "from '@openenvx/studio/internal'"],
  [
    /from '\.\.\/i18n\/localize-workbench'/g,
    "from '@openenvx/studio/internal'",
  ],
  [/from '\.\.\/lib\/cn'/g, "from '@openenvx/studio/internal'"],
  [
    /from '@openenvx\/studio\/src\/lib\/cn'/g,
    "from '@openenvx/studio/internal'",
  ],
  [
    /from '@openenvx\/studio\/src\/ui\//g,
    "from '@openenvx/studio/internal/ui/",
  ],
  [/from '\.\.\/lib\/cn'/g, "from '@openenvx/studio/internal'"],
  [/from '\.\.\/ui\//g, "from '@openenvx/studio/internal'"],
  [/from '\.\.\/\.\.\/lib\/cn'/g, "from '@openenvx/studio/internal'"],
  [/from '\.\.\/\.\.\/ui\//g, "from '@openenvx/studio/internal'"],
];

async function walk(dir) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(p);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const text = await readFile(p, 'utf-8');
      let next = text;
      for (const [re, rep] of REPLACEMENTS) {
        next = next.replace(re, rep);
      }
      if (next !== text) {
        await writeFile(p, next);
      }
    }
  }
}

await walk(ROOT);
console.log('editor import fix done');
