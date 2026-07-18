import {
  VersionHistoryProviderId,
  type DocumentVersion,
} from '@openenvx/headless';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useMountEffect } from '../hooks/use-mount-effect';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { useWorkbenchTranslation } from '../i18n/use-workbench-translation';
import { cn } from '../lib/cn';
import { VERSION_HISTORY_RESTORE_COMMAND_ID } from './restore-version-command';

import styles from './version-history-panel.module.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; versions: DocumentVersion[] };

function formatVersionTime(createdAt: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(createdAt));
}

function AuthorRow({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  return (
    <span className={styles.author}>
      {avatarUrl ? (
        <img alt="" className={styles.avatar} src={avatarUrl} />
      ) : (
        <span aria-hidden className={styles.avatarFallback}>
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className={styles.authorName}>{name}</span>
    </span>
  );
}

function VersionRow({
  version,
  onSelect,
  restoring,
  selected,
}: {
  version: DocumentVersion;
  onSelect: (versionId: string) => void;
  restoring: boolean;
  selected: boolean;
}) {
  const title = version.label ?? formatVersionTime(version.createdAt);

  return (
    <button
      aria-busy={restoring && selected}
      className={cn(styles.row, selected && styles.rowSelected)}
      disabled={restoring}
      onClick={() => onSelect(version.id)}
      type="button"
    >
      <span className={styles.timelineNode} />
      <span className={styles.rowBody}>
        <span className={styles.rowTitle}>{title}</span>
        {version.author ? (
          <AuthorRow
            avatarUrl={version.author.avatarUrl}
            name={version.author.name}
          />
        ) : null}
      </span>
    </button>
  );
}

function AutosaveGroup({
  versions,
  onSelect,
  restoring,
  selectedId,
}: {
  versions: DocumentVersion[];
  onSelect: (versionId: string) => void;
  restoring: boolean;
  selectedId: string | null;
}) {
  const { t } = useWorkbenchTranslation();
  const [open, setOpen] = useState(true);

  return (
    <div className={styles.autosaveGroup}>
      <button
        aria-expanded={open}
        className={styles.autosaveHeader}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? (
          <ChevronDown aria-hidden className={styles.chevron} size={14} />
        ) : (
          <ChevronRight aria-hidden className={styles.chevron} size={14} />
        )}
        {t('versionHistory.autosaveGroup', { count: versions.length })}
      </button>
      {open
        ? versions.map((version) => (
            <VersionRow
              key={version.id}
              onSelect={onSelect}
              restoring={restoring}
              selected={selectedId === version.id}
              version={version}
            />
          ))
        : null}
    </div>
  );
}

function VersionHistoryPanelBody({ documentUri }: { documentUri: string }) {
  const { api, executeCommand } = useWorkbenchContext();
  const { t } = useWorkbenchTranslation();
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useMountEffect(() => {
    let cancelled = false;
    const provider = api.getService(VersionHistoryProviderId);
    if (!provider) {
      setLoadState({
        message: t('versionHistory.missingProvider'),
        status: 'error',
      });
      return;
    }

    setLoadState({ status: 'loading' });
    void provider
      .listVersions(documentUri)
      .then((versions) => {
        if (cancelled) {
          return;
        }
        const sorted = [...versions].toSorted(
          (a, b) => b.createdAt - a.createdAt
        );
        setLoadState({ status: 'ready', versions: sorted });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setLoadState({
          message:
            error instanceof Error
              ? error.message
              : t('versionHistory.loadFailed'),
          status: 'error',
        });
      });

    return () => {
      cancelled = true;
    };
  });

  const { named, autosaves } = useMemo(() => {
    if (loadState.status !== 'ready') {
      return {
        autosaves: [] as DocumentVersion[],
        named: [] as DocumentVersion[],
      };
    }
    const namedVersions: DocumentVersion[] = [];
    const autosaveVersions: DocumentVersion[] = [];
    for (const version of loadState.versions) {
      if (version.isAutosave) {
        autosaveVersions.push(version);
      } else {
        namedVersions.push(version);
      }
    }
    return { autosaves: autosaveVersions, named: namedVersions };
  }, [loadState]);

  const handleSelect = useCallback(
    async (versionId: string) => {
      setRestoringId(versionId);
      try {
        await executeCommand(VERSION_HISTORY_RESTORE_COMMAND_ID, { versionId });
      } finally {
        setRestoringId(null);
      }
    },
    [executeCommand]
  );

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h2 className={styles.title}>{t('versionHistory.title')}</h2>
      </header>

      <div className={cn(styles.row, styles.currentRow)}>
        <span className={styles.timelineNode} />
        <span className={styles.rowBody}>
          <span className={styles.rowTitle}>{t('versionHistory.current')}</span>
        </span>
      </div>

      {loadState.status === 'loading' ? (
        <p className={styles.status}>{t('versionHistory.loading')}</p>
      ) : null}

      {loadState.status === 'error' ? (
        <p className={styles.statusError}>{loadState.message}</p>
      ) : null}

      {loadState.status === 'ready' &&
      named.length === 0 &&
      autosaves.length === 0 ? (
        <p className={styles.status}>{t('versionHistory.empty')}</p>
      ) : null}

      {loadState.status === 'ready' ? (
        <div className={styles.timeline}>
          {autosaves.length > 0 ? (
            <AutosaveGroup
              onSelect={handleSelect}
              restoring={restoringId !== null}
              selectedId={restoringId}
              versions={autosaves}
            />
          ) : null}
          {named.map((version) => (
            <VersionRow
              key={version.id}
              onSelect={handleSelect}
              restoring={restoringId !== null}
              selected={restoringId === version.id}
              version={version}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function VersionHistoryPanel() {
  const { t } = useWorkbenchTranslation();
  const documentUri = useWorkbenchContextSelector(
    (state) => state.editor?.uri ?? null
  );

  if (!documentUri) {
    return (
      <div className={styles.root}>
        <p className={styles.status}>{t('versionHistory.noDocument')}</p>
      </div>
    );
  }

  return (
    <VersionHistoryPanelBody documentUri={documentUri} key={documentUri} />
  );
}
