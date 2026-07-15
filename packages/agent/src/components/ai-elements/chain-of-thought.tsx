import type { LucideIcon } from 'lucide-react';
import { Brain, ChevronDown, Dot } from 'lucide-react';
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '../../lib/cn';

import styles from './chain-of-thought.module.css';

interface ChainOfThoughtContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | null>(
  null
);

function useChainOfThought(): ChainOfThoughtContextValue {
  const context = useContext(ChainOfThoughtContext);
  if (!context) {
    throw new Error(
      'ChainOfThought components must be used within ChainOfThought'
    );
  }
  return context;
}

export type ChainOfThoughtProps = HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const ChainOfThought = memo(
  ({
    className,
    open,
    defaultOpen = false,
    onOpenChange,
    children,
    ...props
  }: ChainOfThoughtProps) => {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
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

    const value = useMemo(() => ({ isOpen, setIsOpen }), [isOpen, setIsOpen]);

    return (
      <ChainOfThoughtContext.Provider value={value}>
        <div className={cn(styles.root, className)} {...props}>
          {children}
        </div>
      </ChainOfThoughtContext.Provider>
    );
  }
);

ChainOfThought.displayName = 'ChainOfThought';

export type ChainOfThoughtHeaderProps = HTMLAttributes<HTMLButtonElement>;

export const ChainOfThoughtHeader = memo(
  ({ className, children, ...props }: ChainOfThoughtHeaderProps) => {
    const { isOpen, setIsOpen } = useChainOfThought();

    return (
      <button
        aria-expanded={isOpen}
        className={cn(styles.header, className)}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        {...props}
      >
        <Brain aria-hidden className={styles.headerIcon} size={14} />
        <span className={styles.headerLabel}>
          {children ?? 'Chain of Thought'}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            styles.chevron,
            isOpen ? styles.chevronOpen : undefined
          )}
          size={14}
        />
      </button>
    );
  }
);

ChainOfThoughtHeader.displayName = 'ChainOfThoughtHeader';

export type ChainOfThoughtStepStatus = 'complete' | 'active' | 'pending';

export type ChainOfThoughtStepProps = HTMLAttributes<HTMLDivElement> & {
  icon?: LucideIcon;
  label: ReactNode;
  description?: ReactNode;
  status?: ChainOfThoughtStepStatus;
};

export const ChainOfThoughtStep = memo(
  ({
    className,
    icon: Icon = Dot,
    label,
    description,
    status = 'complete',
    children,
    ...props
  }: ChainOfThoughtStepProps) => (
    <div
      className={cn(
        styles.step,
        status === 'active' ? styles.stepActive : undefined,
        status === 'pending' ? styles.stepPending : undefined,
        className
      )}
      data-status={status}
      {...props}
    >
      <div className={styles.stepRail}>
        <span className={styles.stepIconWrap}>
          <Icon aria-hidden className={styles.stepIcon} size={14} />
        </span>
        <span aria-hidden className={styles.stepLine} />
      </div>
      <div className={styles.stepBody}>
        <div className={styles.stepLabel}>{label}</div>
        {description ? (
          <div className={styles.stepDescription}>{description}</div>
        ) : null}
        {children}
      </div>
    </div>
  )
);

ChainOfThoughtStep.displayName = 'ChainOfThoughtStep';

export type ChainOfThoughtContentProps = HTMLAttributes<HTMLDivElement>;

export const ChainOfThoughtContent = memo(
  ({ className, children, ...props }: ChainOfThoughtContentProps) => {
    const { isOpen } = useChainOfThought();
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

ChainOfThoughtContent.displayName = 'ChainOfThoughtContent';
