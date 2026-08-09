/**
 * Emit packages/core/scene.schema.json from the lenient Zod scene schema.
 * Run via `bun run generate:json-schema` from this package.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { z } from 'zod';

import { sceneSchemaLenient } from './scene-schema';

const here = import.meta.dirname;
const outPath = path.join(here, '..', '..', 'scene.schema.json');

const jsonSchema = z.toJSONSchema(sceneSchemaLenient, {
  target: 'draft-2020-12',
});

writeFileSync(outPath, `${JSON.stringify(jsonSchema, null, 2)}\n`, 'utf-8');
console.log(`Wrote ${outPath}`);
