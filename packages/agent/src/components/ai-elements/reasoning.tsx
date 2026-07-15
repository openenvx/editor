import { Brain, ChevronDown } from 'lucide-react';
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '../../lib/cn';
import { Shimmer } from './shimmer';

import styles from './reasoning.module.css';

interface ReasoningContextValue {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number | undefined;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

export function useReasoning(): ReasoningContextValue {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error('Reasoning components must be used within Reasoning');
  }
  return context;
}

export type ReasoningProps = HTMLAttributes<HTMLDivElement> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

const AUTO_CLOSE_DELAY_MS = 1000;
const MS_IN_S = 1000;

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen,
    onOpenChange,
    duration: durationProp,
    children,
    ...props
  }: ReasoningProps) => {
    const resolvedDefaultOpen = defaultOpen ?? isStreaming;
    const isExplicitlyClosed = defaultOpen === false;

    const [uncontrolledOpen, setUncontrolledOpen] =
      useState(resolvedDefaultOpen);
    const isOpen = open ?? uncontrolledOpen;
    const setIsOpen = useCallback(
      (next: boolean) => {
        if (open === undefined) {
          setUncontrolledOpen(next);
        }
        onOpenChange?.(next);
      },
      [onOpenChange, open]
    );

    const [duration, setDuration] = useState<number | undefined>(durationProp);
    const hasEverStreamedRef = useRef(isStreaming);
    const [hasAutoClosed, setHasAutoClosed] = useState(false);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
      if (durationProp !== undefined) {
        setDuration(durationProp);
      }
    }, [durationProp]);

    useEffect(() => {
      if (isStreaming) {
        hasEverStreamedRef.current = true;
        if (startTimeRef.current === null) {
          startTimeRef.current = Date.now();
        }
        return;
      }
      if (startTimeRef.current !== null) {
        setDuration(Math.ceil((Date.now() - startTimeRef.current) / MS_IN_S));
        startTimeRef.current = null;
      }
    }, [isStreaming]);

    useEffect(() => {
      if (isStreaming && !isOpen && !isExplicitlyClosed) {
        setIsOpen(true);
      }
    }, [isStreaming, isOpen, isExplicitlyClosed, setIsOpen]);

    useEffect(() => {
      if (
        !(
          hasEverStreamedRef.current &&
          !isStreaming &&
          isOpen &&
          !hasAutoClosed
        )
      ) {
        return;
      }
      const timer = setTimeout(() => {
        setIsOpen(false);
        setHasAutoClosed(true);
      }, AUTO_CLOSE_DELAY_MS);
      return () => clearTimeout(timer);
    }, [isStreaming, isOpen, setIsOpen, hasAutoClosed]);

    const contextValue = useMemo(
      () => ({ duration, isOpen, isStreaming, setIsOpen }),
      [duration, isOpen, isStreaming, setIsOpen]
    );

    return (
      <ReasoningContext.Provider value={contextValue}>
        <div className={cn(styles.root, className)} {...props}>
          {children}
        </div>
      </ReasoningContext.Provider>
    );
  }
);

Reasoning.displayName = 'Reasoning';

export type ReasoningTriggerProps = HTMLAttributes<HTMLButtonElement> & {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
};

function defaultGetThinkingMessage(
  isStreaming: boolean,
  duration?: number
): ReactNode {
  if (isStreaming || duration === 0) {
    return <Shimmer duration={1.5}>Thinking…</Shimmer>;
  }
  if (duration === undefined) {
    return 'Thought for a few seconds';
  }
  return `Thought for ${duration} second${duration === 1 ? '' : 's'}`;
}

export const ReasoningTrigger = memo(
  ({
    className,
    children,
    getThinkingMessage = defaultGetThinkingMessage,
    ...props
  }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, duration, setIsOpen } = useReasoning();

    return (
      <button
        aria-expanded={isOpen}
        className={cn(styles.trigger, className)}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        {...props}
      >
        {children ?? (
          <>
            <Brain aria-hidden className={styles.icon} size={14} />
            <span className={styles.triggerLabel}>
              {getThinkingMessage(isStreaming, duration)}
            </span>
            <ChevronDown
              aria-hidden
              className={cn(
                styles.chevron,
                isOpen ? styles.chevronOpen : undefined
              )}
              size={14}
            />
          </>
        )}
      </button>
    );
  }
);

ReasoningTrigger.displayName = 'ReasoningTrigger';

export type ReasoningContentProps = HTMLAttributes<HTMLDivElement> & {
  children: string;
};

export const ReasoningContent = memo(
  ({ className, children, ...props }: ReasoningContentProps) => {
    const { isOpen } = useReasoning();
    if (!isOpen) {
      return null;
    }
    return (
      <div className={cn(styles.content, className)} {...props}>
        {children}
      </div>
    );
  }
);

ReasoningContent.displayName = 'ReasoningContent';
