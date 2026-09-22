import { PropertyPath } from '#studio';
import { describe, expect, it } from 'vitest';

import { createDraftPropertyHostContext } from './draft-property-host-context';

describe('createDraftPropertyHostContext', () => {
  it('reads and writes selection.layer.data paths', () => {
    let values = { key: 'a', sample: '' };
    const host = createDraftPropertyHostContext(values, (next) => {
      values = next;
    });

    expect(host.readPath(PropertyPath.layerData('key'))).toBe('a');
    host.writePath(PropertyPath.layerData('key'), 'b');
    expect(values.key).toBe('b');
  });

  it('reads and writes nested layer data keys', () => {
    let values: Record<string, unknown> = { meta: { count: 1 } };
    const host = createDraftPropertyHostContext(values, (next) => {
      values = next;
    });

    expect(host.readPath(PropertyPath.layerData('meta.count'))).toBe(1);
    host.writePath(PropertyPath.layerData('meta.count'), 2);
    expect((values.meta as { count: number }).count).toBe(2);
  });
});
