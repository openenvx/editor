import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '../src');
const SKIP = /\.test\.(ts|tsx)$/;

const IMPORT =
  "import { getDocumentStore, requireDocumentStore } from '../document-store-access';\n";
const IMPORT_NESTED =
  "import { getDocumentStore, requireDocumentStore } from '../../document-store-access';\n";
const IMPORT_DEEP =
  "import { getDocumentStore, requireDocumentStore } from '../../../document-store-access';\n";

function depthPrefix(file) {
  const rel = path.relative(ROOT, file);
  const depth = rel.split(path.sep).length - 1;
  if (depth <= 1) {
    return IMPORT;
  }
  if (depth === 2) {
    return IMPORT_NESTED;
  }
  return IMPORT_DEEP;
}

async function walk(dir) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(p);
    } else if (/\.(ts|tsx)$/.test(ent.name) && !SKIP.test(ent.name)) {
      const text = await readFile(p, 'utf-8');
      if (!text.includes('ctx.scene')) {
        continue;
      }
      let next = text.replaceAll('ctx.scene', 'getDocumentStore(ctx)!');
      if (!next.includes('document-store-access')) {
        const firstImport = next.match(/^import .+;\n/m);
        if (firstImport) {
          next = next.replace(firstImport[0], firstImport[0] + depthPrefix(p));
        } else {
          next = depthPrefix(p) + next;
        }
      }
      // canExecute guards: getDocumentStore(ctx)! -> optional in canExecute bodies is manual
      if (next !== text) {
        await writeFile(p, next);
        console.log('updated', path.relative(ROOT, p));
      }
    }
  }
}

await walk(ROOT);
