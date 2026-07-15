import { ArrowDown } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '../../lib/cn';

import styles from './conversation.module.css';

export type ConversationProps = HTMLAttributes<HTMLDivElement>;

export function Conversation({
  className,
  children,
  ...props
}: ConversationProps) {
  return (
    <div className={cn(styles.conversation, className)} role="log" {...props}>
      {children}
    </div>
  );
}

export type ConversationContentProps = HTMLAttributes<HTMLDivElement> & {
  /** Change this value to scroll to the bottom (e.g. messages.length). */
  scrollAnchor?: number | string;
};

export function ConversationContent({
  className,
  children,
  scrollAnchor,
  ...props
}: ConversationContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const updateScrollButton = useCallback(() => {
    const element = contentRef.current;
    if (!element) {
      return;
    }
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    setShowScrollButton(distanceFromBottom > 48);
  }, []);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) {
      return;
    }
    updateScrollButton();
    element.addEventListener('scroll', updateScrollButton, { passive: true });
    return () => element.removeEventListener('scroll', updateScrollButton);
  }, [updateScrollButton]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) {
      return;
    }
    element.scrollTop = element.scrollHeight;
    updateScrollButton();
  }, [scrollAnchor, updateScrollButton]);

  const scrollToBottom = useCallback(() => {
    const element = contentRef.current;
    if (!element) {
      return;
    }
    element.scrollTo({ behavior: 'smooth', top: element.scrollHeight });
  }, []);

  return (
    <>
      <div
        className={cn(styles.content, className)}
        ref={contentRef}
        {...props}
      >
        {children}
      </div>
      {showScrollButton ? (
        <button
          aria-label="Scroll to bottom"
          className={styles.scrollButton}
          onClick={scrollToBottom}
          type="button"
        >
          <ArrowDown aria-hidden size={14} />
        </button>
      ) : null}
    </>
  );
}

export type ConversationEmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  icon?: ReactNode;
};

export function ConversationEmptyState({
  className,
  title = 'No messages yet',
  description = 'Start a conversation to see messages here',
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) {
  return (
    <div className={cn(styles.emptyState, className)} {...props}>
      {children ?? (
        <>
          {icon ? <div className={styles.emptyIcon}>{icon}</div> : null}
          <p className={styles.emptyTitle}>{title}</p>
          {description ? (
            <p className={styles.emptyDescription}>{description}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
