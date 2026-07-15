import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { memo } from 'react';

import type { AgentThread } from '../client/agent-service-client';

import styles from './chat-history-list.module.css';

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const deltaMs = Date.now() - date.getTime();
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export interface ChatHistoryListProps {
  threads: AgentThread[];
  activeThreadId: string | null;
  disabled?: boolean;
  onNewChat: () => void;
  onSelect: (threadId: string) => void;
  onDelete: (threadId: string) => void;
}

export const ChatHistoryList = memo(
  ({
    threads,
    activeThreadId,
    disabled = false,
    onNewChat,
    onSelect,
    onDelete,
  }: ChatHistoryListProps) => (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>History</span>
        <button
          className={styles.newButton}
          disabled={disabled}
          onClick={onNewChat}
          type="button"
        >
          <MessageSquarePlus size={14} strokeWidth={2} />
          New chat
        </button>
      </div>
      {threads.length === 0 ? (
        <p className={styles.empty}>No past chats yet</p>
      ) : (
        <ul className={styles.list}>
          {threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <li key={thread.id}>
                <div
                  className={
                    isActive
                      ? `${styles.item} ${styles.itemActive}`
                      : styles.item
                  }
                >
                  <button
                    className={styles.selectButton}
                    disabled={disabled}
                    onClick={() => onSelect(thread.id)}
                    type="button"
                  >
                    <span className={styles.title}>{thread.title}</span>
                    <span className={styles.meta}>
                      {formatRelativeTime(thread.updatedAt)}
                    </span>
                  </button>
                  <button
                    aria-label={`Delete ${thread.title}`}
                    className={styles.deleteButton}
                    disabled={disabled}
                    onClick={() => onDelete(thread.id)}
                    type="button"
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  )
);
