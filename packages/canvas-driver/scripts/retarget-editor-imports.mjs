import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '../src');

const EDITOR = new Set([
  'AssetService',
  'AssetServiceId',
  'CANVAS_INSTANCE_LAYER_TYPE',
  'CONTAINER_LAYER_TYPE',
  'ContainerLayoutModel',
  'Document',
  'DocumentHostServiceId',
  'DocumentNode',
  'DocumentOperationsServiceId',
  'DocumentStore',
  'DocumentStoreServiceId',
  'DocumentTransaction',
  'DocumentValidationError',
  'EditorSession',
  'HistoryStack',
  'InMemoryAssetService',
  'InMemoryPersistenceService',
  'LayerDefinition',
  'LayerPreviewContext',
  'MIN_LAYER_SIZE',
  'OpenEnvxWidgetLayer',
  'OpenEnvxWidgetModel',
  'PageRulesContribution',
  'PersistenceServiceId',
  'Transform',
  'WIDGET_LAYER_TYPE',
  'canDeleteLayer',
  'canDuplicateLayer',
  'canEditLayerData',
  'canInsertLayers',
  'canResizePage',
  'canSelectLayer',
  'canTransformLayer',
  'clampTransformSize',
  'cloneNodeTree',
  'createNodeId',
  'findNodeArtboard',
  'findNodeById',
  'findNodeLocation',
  'getActiveArtboard',
  'getChildNodes',
  'getDocumentStore',
  'getLayerWriteMode',
  'getNodeChildrenForDocument',
  'insertNodeIntoContainer',
  'isContainerNode',
  'isLayerShownInLayers',
  'mapNodes',
  'moveNodeInTree',
  'openenvxWidgetSchema',
  'requireDocumentStore',
  'updateNodeByIdInDocument',
  'updateNodeInTree',
  'walkNodes',
  'getInstanceComponentId',
  'isCanvasInstanceNode',
]);

function splitImportBlock(src, fromModule) {
  const re = new RegExp(
    `import\\s+(type\\s+)?\\{([^}]*)\\}\\s+from\\s+['"]${fromModule.replace('/', '\\/')}['"];?`,
    'g'
  );
  return src.replace(re, (full, typeKw, body) => {
    const isTypeOnly = Boolean(typeKw);
    const parts = body
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const studio = [];
    const editor = [];
    for (const part of parts) {
      const name = part
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)[0]
        .trim();
      if (EDITOR.has(name)) {
        editor.push(part);
      } else {
        studio.push(part);
      }
    }
    if (editor.length === 0) {
      return full;
    }
    const prefix = isTypeOnly ? 'import type' : 'import';
    const out = [];
    if (studio.length) {
      out.push(`${prefix} { ${studio.join(', ')} } from '${fromModule}';`);
    }
    out.push(`${prefix} { ${editor.join(', ')} } from '@openenvx/editor';`);
    return out.join('\n');
  });
}

async function walk(dir) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(p);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      let text = await readFile(p, 'utf-8');
      const before = text;
      text = splitImportBlock(text, '@openenvx/studio');
      text = text.replaceAll(
        'requireDocumentStore(ctx).getDocument().getPrimaryNode',
        'requireDocumentStore(ctx).getPrimaryNode'
      );
      text = text.replaceAll(
        'requireDocumentStore(ctx).getDocument().getSession',
        'requireDocumentStore(ctx).getSession'
      );
      if (
        text.includes('requireDocumentStore(ctx)') &&
        !/requireDocumentStore/.test(text.split('\n').slice(0, 40).join('\n'))
      ) {
        // noop
      }
      if (text.includes('requireDocumentStore(ctx)')) {
        const hasImport = /import\s+\{[^}]*\brequireDocumentStore\b/.test(text);
        if (!hasImport) {
          text = `import { requireDocumentStore } from '@openenvx/editor';\n${text}`;
        }
      }
      if (text !== before) {
        await writeFile(p, text);
        console.log('updated', path.relative(ROOT, p));
      }
    }
  }
}

await walk(ROOT);
console.log('canvas-driver import retarget done');
