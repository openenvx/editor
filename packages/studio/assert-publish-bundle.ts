import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROLLDOWN_REQUIRE_STUB = `doesn't expose the \`require\` function`;

export interface AssertPublishBundleOptions {
  /** When true, dist must ESM-import host react-reconciler (canvas-driver). */
  requireHostReactReconciler?: boolean;
}

function fail(message: string): never {
  throw new Error(`publish bundle assert: ${message}`);
}

function findInlinedReactLicenseViolations(content: string): string[] {
  const violations: string[] = [];
  const licenseRe = /@license React\n\* ([^\n]+)/g;
  for (const match of content.matchAll(licenseRe)) {
    const marker = match[1];
    if (marker) {
      violations.push(marker);
    }
  }
  return violations;
}

function hasEsmImport(content: string, spec: string): boolean {
  return content.includes(`from"${spec}"`) || content.includes(`from'${spec}'`);
}

/** Validates a single publish entry bundle (for tests and build hooks). */
export function validatePublishBundleJs(
  content: string,
  relPath: string,
  options: AssertPublishBundleOptions = {}
): void {
  if (content.includes(ROLLDOWN_REQUIRE_STUB)) {
    fail(`${relPath}: rolldown require stub (breaks Next/Turbopack)`);
  }
  if (!hasEsmImport(content, 'react')) {
    fail(`${relPath}: missing ESM import from react`);
  }
  if (!hasEsmImport(content, 'react/jsx-runtime')) {
    fail(`${relPath}: missing ESM import from react/jsx-runtime`);
  }
  if (options.requireHostReactReconciler) {
    if (
      !hasEsmImport(content, 'react-reconciler') &&
      !hasEsmImport(content, 'react-reconciler/constants.js')
    ) {
      fail(`${relPath}: missing ESM import from react-reconciler`);
    }
  }
  const licenseViolations = findInlinedReactLicenseViolations(content);
  if (licenseViolations.length > 0) {
    fail(
      `${relPath}: inlined React runtime (${licenseViolations.join(', ')}) — use host react/scheduler/react-reconciler via esmExternalRequire`
    );
  }
}

async function readShellPublishBundle(distDir: string, entry: string) {
  const entryPath = path.join(distDir, entry);
  let content = await readFile(entryPath, 'utf-8');
  const chunkImportRe = /from["']\.\/([^"']+\.js)["']/g;
  for (const match of content.matchAll(chunkImportRe)) {
    const chunkPath = path.join(distDir, match[1]);
    if (existsSync(chunkPath)) {
      content += `\n${await readFile(chunkPath, 'utf-8')}`;
    }
  }
  return content;
}

export async function assertPublishBundle(
  distDir: string,
  options: AssertPublishBundleOptions & { entry?: string } = {}
): Promise<void> {
  const entry = options.entry ?? 'index.js';
  const content =
    entry === 'shell.js'
      ? await readShellPublishBundle(distDir, entry)
      : await readFile(path.join(distDir, entry), 'utf-8');
  validatePublishBundleJs(content, entry, options);
}
