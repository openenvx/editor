import { ContextKeyServiceId } from '@openenvx/core';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/core/react';
import { memo, useCallback, useState } from 'react';

import { EMAIL_TEMPLATES_SHEET_OPEN_KEY } from '../contributions/email-templates-sidebar';
import { emailTemplateCatalog, findTemplateCollection } from '../templates';
import type { EmailTemplateEntry } from '../templates';

import styles from './templates-gallery.module.css';

export const EmailTemplatesGallery = memo(() => {
  const { api } = useWorkbenchContext();
  const sheetOpen =
    useWorkbenchContextSelector(
      (state) => state.contextKeys[EMAIL_TEMPLATES_SHEET_OPEN_KEY] === true
    ) ?? false;
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [prevSheetOpen, setPrevSheetOpen] = useState(sheetOpen);
  if (sheetOpen !== prevSheetOpen) {
    setPrevSheetOpen(sheetOpen);
    if (!sheetOpen) {
      setCollectionId(null);
    }
  }

  const collection = collectionId
    ? findTemplateCollection(collectionId)
    : undefined;

  const closeSheet = useCallback(() => {
    api
      .getService(ContextKeyServiceId)
      ?.setContext(EMAIL_TEMPLATES_SHEET_OPEN_KEY, false);
  }, [api]);

  const handleLoad = useCallback(
    (entry: EmailTemplateEntry) => {
      api.loadScene(entry.createScene());
      closeSheet();
    },
    [api, closeSheet]
  );

  if (collection) {
    return (
      <>
        <div className={styles.navSection}>
          <button
            className={styles.backButton}
            onClick={() => setCollectionId(null)}
            type="button"
          >
            ← Collections
          </button>
          <p className={styles.collectionTitle}>{collection.name}</p>
        </div>
        <div className={styles.scroll}>
          {collection.templates.length === 0 ? (
            <p className={styles.empty}>No templates in this collection.</p>
          ) : (
            <div className={styles.grid}>
              {collection.templates.map((entry) => (
                <CatalogCard
                  description={entry.description}
                  key={entry.id}
                  label={`Load ${entry.name} template`}
                  name={entry.name}
                  onSelect={() => handleLoad(entry)}
                />
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className={styles.scroll}>
      {emailTemplateCatalog.length === 0 ? (
        <p className={styles.empty}>No template collections yet.</p>
      ) : (
        <div className={styles.grid}>
          {emailTemplateCatalog.map((entry) => (
            <CatalogCard
              description={entry.description}
              key={entry.id}
              label={`Open ${entry.name} templates`}
              name={entry.name}
              onSelect={() => setCollectionId(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

EmailTemplatesGallery.displayName = 'EmailTemplatesGallery';

function CatalogCard({
  name,
  description,
  label,
  onSelect,
}: {
  name: string;
  description: string;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={styles.card}
      onClick={onSelect}
      type="button"
    >
      <span className={styles.cardMeta}>
        <span className={styles.cardTitle}>{name}</span>
        <span className={styles.cardDesc}>{description}</span>
      </span>
    </button>
  );
}
