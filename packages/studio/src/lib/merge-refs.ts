import type { Ref } from 'react';

export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): Ref<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }
  };
}
