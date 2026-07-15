import type { UIMessage } from 'ai';
import { memo, type HTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

import styles from './message.module.css';

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role'];
};

export function Message({ className, from, ...props }: MessageProps) {
  return (
    <div
      className={cn(
        styles.message,
        from === 'user' ? styles.messageUser : styles.messageAssistant,
        className
      )}
      {...props}
    />
  );
}

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export function MessageContent({
  className,
  children,
  ...props
}: MessageContentProps) {
  return (
    <div className={cn(styles.content, className)} {...props}>
      {children}
    </div>
  );
}

export type MessageResponseProps = HTMLAttributes<HTMLDivElement>;

export const MessageResponse = memo(
  ({ className, children, ...props }: MessageResponseProps) => (
    <div className={cn(styles.response, className)} {...props}>
      {children}
    </div>
  )
);
