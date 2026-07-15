import { cn } from '../lib/cn';
import type { ProposedChangesPayload } from '../schemas/proposed-changes';

import styles from './proposal-card.module.css';

export interface ProposalCardProps {
  proposal: ProposedChangesPayload;
  autoApplyEnabled: boolean;
  onAutoApplyChange: (enabled: boolean) => void;
  onApply: () => void;
  onReject: () => void;
  applying?: boolean;
}

export function ProposalCard({
  proposal,
  autoApplyEnabled,
  onAutoApplyChange,
  onApply,
  onReject,
  applying = false,
}: ProposalCardProps) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Proposed changes</span>
        {proposal.summary ? (
          <span className={styles.summary}>{proposal.summary}</span>
        ) : null}
      </div>
      <ul className={styles.list}>
        {proposal.changes.map((change, index) => {
          let fallback: string = change.kind;
          if (change.kind === 'executeCommand') {
            fallback = change.commandId;
          } else if (change.kind === 'updateProperty') {
            fallback = `${change.layerId}.${change.key}`;
          } else if (change.kind === 'selectLayers') {
            fallback = `Select ${change.layerIds.length} layer(s)`;
          } else if (change.kind === 'createLayer') {
            fallback = `Create ${change.type}`;
          } else if (change.kind === 'deleteLayer') {
            fallback = `Delete ${change.layerIds.length} layer(s)`;
          }
          return (
            <li key={`${change.kind}-${index}`}>{change.label ?? fallback}</li>
          );
        })}
      </ul>
      <label className={styles.autoApply}>
        <input
          checked={autoApplyEnabled}
          onChange={(event) => onAutoApplyChange(event.target.checked)}
          type="checkbox"
        />
        Auto-apply future proposals
      </label>
      <div className={styles.actions}>
        <button
          className={cn(styles.button, styles.buttonPrimary)}
          disabled={applying}
          onClick={onApply}
          type="button"
        >
          {applying ? 'Applying…' : 'Apply'}
        </button>
        <button
          className={styles.button}
          disabled={applying}
          onClick={onReject}
          type="button"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
