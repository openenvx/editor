#!/usr/bin/env bun
/**
 * Emit `openenvx.extension.json` from a module that default-exports an
 * ExtensionManifest (from defineExtension).
 *
 * Usage: bunx openenvx-manifest src/extension.ts -o dist/openenvx.extension.json
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { validateExtensionManifest } from '@openenvx/protocol';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const input = args[0];
  const outFlag = args.indexOf('-o');
  const output =
    outFlag !== -1 ? args[outFlag + 1] : 'dist/openenvx.extension.json';
  if (!input) {
    console.error(
      'Usage: openenvx-manifest <entry.ts> [-o dist/openenvx.extension.json]'
    );
    process.exit(1);
  }
  const resolved = path.resolve(input);
  const mod = await import(resolved);
  const candidate = mod.default ?? mod.manifest;
  const result = validateExtensionManifest(candidate);
  if (!result.ok) {
    console.error(result.reason);
    process.exit(1);
  }
  const outPath = path.resolve(output);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(result.manifest, null, 2)}\n`);
  console.log(`Wrote ${outPath}`);
}

void main();
