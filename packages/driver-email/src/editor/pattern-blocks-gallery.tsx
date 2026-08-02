import { ContextKeyServiceId, getActivePage } from '@openenvx/core';
import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/headless/react';
import type { BlockRegistry } from '@openenvx/html';
import { getPageRootId, resolveInsertParentId } from '@openenvx/html';
import { memo, useCallback, useMemo, useState } from 'react';

import {
  emailBlockRegistry,
  EmailBlockRegistryServiceId,
} from '../block-registry';
import {
  emailPatternCatalog,
  filterPatternCatalog,
  patternGroups,
  type EmailPatternEntry,
} from '../blocks/patterns';
import { EMAIL_BLOCKS_SHEET_OPEN_KEY } from '../contributions/email-patterns-sidebar';
import { renderPatternThumbnail } from './block-thumbnail';

import styles from './pattern-blocks-gallery.module.css';

export const EmailPatternBlocksGallery = memo(() => {
  const { api, executeCommand } = useWorkbenchContext();
  const scene = useWorkbenchContextSelector((state) => state.scene);
  const selection = useWorkbenchContextSelector((state) => state.selection);
  const registry =
    api.getService(EmailBlockRegistryServiceId) ?? emailBlockRegistry;

  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string | null>(null);

  const groups = useMemo(() => patternGroups(emailPatternCatalog), []);
  const filtered = useMemo(
    () => filterPatternCatalog(emailPatternCatalog, query, group),
    [query, group]
  );

  const handleInsert = useCallback(
    (blockType: string) => {
      if (!(scene && selection)) {
        return;
      }
      const page = getActivePage(scene, selection.activePageId);
      const selectedId =
        selection.primaryLayerId ?? selection.selectedLayerIds[0] ?? null;
      const rootId = getPageRootId(page, 'email.root');
      const parentId = resolveInsertParentId(
        page.layers,
        selectedId,
        rootId,
        registry
      );
      if (!parentId) {
        return;
      }
      void executeCommand('email.insertBlock', {
        type: blockType,
        parentId,
        index: Number.POSITIVE_INFINITY,
      });
      api
        .getService(ContextKeyServiceId)
        ?.setContext(EMAIL_BLOCKS_SHEET_OPEN_KEY, false);
    },
    [api, executeCommand, registry, scene, selection]
  );

  return (
    <>
      <div className={styles.searchSection}>
        <div className={styles.searchWrap}>
          <svg
            aria-hidden
            className={styles.searchIcon}
            fill="currentColor"
            height="1em"
            viewBox="0 0 256 256"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
          </svg>
          <input
            aria-label="Search blocks"
            className={styles.search}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, description or tag…"
            type="search"
            value={query}
          />
        </div>
      </div>

      <div className={styles.chipsSection}>
        <div className={styles.chips}>
          <FilterChip
            active={group === null}
            label="All"
            onClick={() => setGroup(null)}
          />
          {groups.map((name) => (
            <FilterChip
              active={group === name}
              key={name}
              label={name}
              onClick={() => setGroup(name)}
            />
          ))}
        </div>
      </div>

      <div className={styles.scroll}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No blocks match your search.</p>
        ) : (
          <div className={styles.grid}>
            {filtered.map((entry) => (
              <PatternCard
                entry={entry}
                key={entry.block.type}
                onInsert={() => handleInsert(entry.block.type)}
                registry={registry}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
});

EmailPatternBlocksGallery.displayName = 'EmailPatternBlocksGallery';

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={active ? styles.chipActive : styles.chip}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function PatternCard({
  entry,
  registry,
  onInsert,
}: {
  entry: EmailPatternEntry;
  registry: BlockRegistry;
  onInsert: () => void;
}) {
  return (
    <button
      aria-label={`Insert ${entry.block.label}`}
      className={styles.card}
      onClick={onInsert}
      type="button"
    >
      <span className={styles.thumb}>
        <span className={styles.thumbScale}>
          {renderPatternThumbnail(entry.block, registry)}
        </span>
      </span>
      <span className={styles.cardMeta}>
        <span className={styles.cardTitle}>{entry.block.label}</span>
        <span className={styles.cardDesc}>{entry.description}</span>
      </span>
    </button>
  );
}
