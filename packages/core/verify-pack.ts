import {
  assertDistExport,
  createVerifyPack,
  fail,
  readDist,
} from '@openenvx/typescript-config/verify-pack';

const packageRoot = import.meta.dirname;

const REQUIRED_INDEX_EXPORTS = [
  'Plugin',
  'EditorRuntime',
  'WorkbenchController',
  'WorkbenchPlugin',
  'Command',
];

await createVerifyPack({
  packageRoot,
  packageLabel: 'core',
  forbidSourcemaps: true,
  requiredTarballPaths: [
    'package/dist/index.js',
    'package/dist/index.d.ts',
    'package/dist/schema/index.js',
    'package/dist/schema/index.d.ts',
    'package/dist/preview/index.js',
    'package/dist/react/workbench-context.js',
    'package/scene.schema.json',
  ],
  async beforePack() {
    const indexDts = await readDist(`${packageRoot}/dist`, 'index.d.ts');
    const schemaDts = await readDist(
      `${packageRoot}/dist`,
      'schema/index.d.ts'
    );
    for (const name of REQUIRED_INDEX_EXPORTS) {
      if (!indexDts.includes(name)) {
        fail(`dist/index.d.ts missing required export: ${name}`);
      }
    }
    if (!schemaDts.includes('Scene')) {
      fail('dist/schema/index.d.ts missing Scene');
    }
  },
  afterPack({ pkg }) {
    if (pkg.private) {
      fail('published package must not be private');
    }
    assertDistExport(pkg as Parameters<typeof assertDistExport>[0]);
    if (!(pkg.files as string[] | undefined)?.includes('dist')) {
      fail('files must include dist');
    }
  },
}).run();
