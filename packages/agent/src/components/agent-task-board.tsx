import { Bot, LayoutTemplate, Loader2, Palette, Sparkles } from 'lucide-react';
import { memo } from 'react';

import { cn } from '../lib/cn';
import type { AgentTaskEvent } from '../schemas/proposed-changes';

import styles from './agent-task-board.module.css';

function agentIcon(agentId: string) {
  const lower = agentId.toLowerCase();
  if (lower.includes('layout')) {
    return LayoutTemplate;
  }
  if (lower.includes('style')) {
    return Palette;
  }
  if (lower.includes('design')) {
    return Sparkles;
  }
  return Bot;
}

function statusLabel(status: AgentTaskEvent['status']): string {
  switch (status) {
    case 'pending': {
      return 'Pending';
    }
    case 'running': {
      return 'Running';
    }
    case 'complete': {
      return 'Done';
    }
    case 'error': {
      return 'Error';
    }
    default: {
      return status;
    }
  }
}

export interface AgentTaskBoardProps {
  tasks: AgentTaskEvent[];
  className?: string;
}

export const AgentTaskBoard = memo(
  ({ tasks, className }: AgentTaskBoardProps) => {
    if (tasks.length === 0) {
      return null;
    }

    return (
      <div className={cn(styles.board, className)}>
        <div className={styles.header}>Tasks</div>
        <ul className={styles.list}>
          {tasks.map((task) => {
            const Icon = agentIcon(task.agentId);
            return (
              <li
                className={cn(styles.row, styles[`status-${task.status}`])}
                key={task.taskId}
              >
                <span className={styles.icon}>
                  {task.status === 'running' ? (
                    <Loader2 className={styles.spin} size={14} />
                  ) : (
                    <Icon size={14} />
                  )}
                </span>
                <div className={styles.body}>
                  <div className={styles.labelRow}>
                    <span className={styles.label}>{task.label}</span>
                    <span className={styles.badge}>
                      {statusLabel(task.status)}
                    </span>
                  </div>
                  {task.summary ? (
                    <p className={styles.summary}>{task.summary}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
);

AgentTaskBoard.displayName = 'AgentTaskBoard';
