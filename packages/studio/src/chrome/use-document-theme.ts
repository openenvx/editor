import { useSyncExternalStore } from 'react';

function readDocumentTheme(): string {
  const scoped = document.querySelector('[data-owb-theme]');
  return scoped instanceof HTMLElement
    ? (scoped.dataset.owbTheme ?? 'light')
    : 'light';
}

function subscribeDocumentTheme(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-owb-theme'],
    subtree: true,
  });
  return () => observer.disconnect();
}

export function useDocumentTheme(): string {
  return useSyncExternalStore(
    subscribeDocumentTheme,
    readDocumentTheme,
    () => 'light'
  );
}
