import { describe, expect, it } from 'vitest';

import { validatePublishBundleJs } from './assert-publish-bundle';

const minimalValidHeader = `import x from"react";import{jsx as j}from"react/jsx-runtime";`;

describe('validatePublishBundleJs', () => {
  it('rejects inlined scheduler license', () => {
    const js = `${minimalValidHeader}
/**
* @license React
* scheduler.production.js
*/`;
    expect(() => validatePublishBundleJs(js, 'index.js')).toThrow(
      /inlined React runtime/
    );
  });

  it('rejects use-sync-external-store shim', () => {
    const js = `${minimalValidHeader}
/**
* @license React
* use-sync-external-store-shim.production.js
*/`;
    expect(() => validatePublishBundleJs(js, 'index.js')).toThrow(
      /use-sync-external-store/
    );
  });

  it('rejects inlined react-reconciler', () => {
    const js = `${minimalValidHeader}
/**
* @license React
* react-reconciler.production.js
*/`;
    expect(() => validatePublishBundleJs(js, 'index.js')).toThrow(
      /inlined React runtime/
    );
  });

  it('requires host react-reconciler import when opted in', () => {
    expect(() =>
      validatePublishBundleJs(minimalValidHeader, 'index.js', {
        requireHostReactReconciler: true,
      })
    ).toThrow(/react-reconciler/);
    validatePublishBundleJs(
      `${minimalValidHeader}import R from"react-reconciler";`,
      'index.js',
      { requireHostReactReconciler: true }
    );
  });

  it('accepts clean bundle with only ESM react imports', () => {
    validatePublishBundleJs(minimalValidHeader, 'index.js');
  });
});
