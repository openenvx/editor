import type { DynamicToolUIPart, ToolUIPart } from 'ai';
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Wrench,
  XCircle,
} from 'lucide-react';
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,isValidElement
} from 'react';

import { cn } from '../../lib/cn';

import styles from './tool.module.css';

export type ToolPart = ToolUIPart | DynamicToolUIPart;

interface ToolContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ToolContext = createContext<ToolContextValue | null>(null);

function useTool(): ToolContextValue {
  const context = useContext(ToolContext);
  if (!context) {
    throw new Error('Tool components must be used within Tool');
  }
  return context;
}

export type ToolProps = HTMLAttributes<HTMLDivElement> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Tool({
  className,
  defaultOpen = false,
  open,
  onOpenChange,
  children,
  ...props
}: ToolProps) {
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
    <ToolContext.Provider value={value}>
      <div className={cn(styles.root, className)} {...props}>
        {children}
      </div>
    </ToolContext.Provider>
  );
}

const statusLabels: Record<ToolPart['state'], string> = {
  'approval-requested': 'Awaiting approval',
  'approval-responded': 'Responded',
  'input-available': 'Running',
  'input-streaming': 'Pending',
  'output-available': 'Completed',
  'output-denied': 'Denied',
  'output-error': 'Error',
};

function StatusIcon({ state }: { state: ToolPart['state'] }) {
  switch (state) {
    case 'output-available': {
      return <CheckCircle2 aria-hidden size={12} />;
    }
    case 'output-error':
    case 'output-denied': {
      return <XCircle aria-hidden size={12} />;
    }
    case 'input-available':
    case 'approval-requested': {
      return <Clock aria-hidden className={styles.statusSpin} size={12} />;
    }
    default: {
      return <Circle aria-hidden size={12} />;
    }
  }
}

export function getStatusBadge(state: ToolPart['state']): ReactNode {
  return (
    <span
      className={cn(
        styles.badge,
        state === 'output-available' ? styles.badgeSuccess : undefined,
        state === 'output-error' || state === 'output-denied'
          ? styles.badgeError
          : undefined,
        state === 'input-available' || state === 'approval-requested'
          ? styles.badgeRunning
          : undefined
      )}
    >
      <StatusIcon state={state} />
      {statusLabels[state]}
    </span>
  );
}

export type ToolHeaderProps = HTMLAttributes<HTMLButtonElement> & {
  title?: string;
} & (
    | { type: ToolUIPart['type']; state: ToolUIPart['state']; toolName?: never }
    | {
        type: DynamicToolUIPart['type'];
        state: DynamicToolUIPart['state'];
        toolName: string;
      }
  );

export function ToolHeader({
  className,
  title,
  type,
  state,
  toolName,
  ...props
}: ToolHeaderProps) {
  const { isOpen, setIsOpen } = useTool();
  const derivedName =
    type === 'dynamic-tool' ? toolName : type.split('-').slice(1).join('-');

  return (
    <button
      aria-expanded={isOpen}
      className={cn(styles.header, className)}
      onClick={() => setIsOpen(!isOpen)}
      type="button"
      {...props}
    >
      <Wrench aria-hidden className={styles.toolIcon} size={14} />
      <span className={styles.title}>{title ?? derivedName}</span>
      {getStatusBadge(state)}
      <ChevronDown
        aria-hidden
        className={cn(styles.chevron, isOpen ? styles.chevronOpen : undefined)}
        size={14}
      />
    </button>
  );
}

export type ToolContentProps = HTMLAttributes<HTMLDivElement>;

export function ToolContent({
  className,
  children,
  ...props
}: ToolContentProps) {
  const { isOpen } = useTool();
  if (!isOpen) {
    return null;
  }
  return (
    <div className={cn(styles.content, className)} {...props}>
      {children}
    </div>
  );
}

export type ToolInputProps = HTMLAttributes<HTMLDivElement> & {
  input: ToolPart['input'];
};

export function ToolInput({ className, input, ...props }: ToolInputProps) {
  if (input === undefined) {
    return null;
  }
  return (
    <div className={cn(styles.section, className)} {...props}>
      <div className={styles.sectionLabel}>Parameters</div>
      <pre className={styles.code}>{formatJson(input)}</pre>
    </div>
  );
}

export type ToolOutputProps = HTMLAttributes<HTMLDivElement> & {
  output: unknown;
  errorText?: ToolPart['errorText'];
};

export const ToolOutput = memo(
  ({ className, output, errorText, ...props }: ToolOutputProps) => {
    if (!(output || errorText)) {
      return null;
    }

    let rendered: ReactNode;
    if (isValidElement(output)) {
      rendered = output;
    } else if (typeof output === 'object' && output !== null) {
      rendered = <pre className={styles.code}>{formatJson(output)}</pre>;
    } else if (typeof output === 'string') {
      rendered = <pre className={styles.code}>{output}</pre>;
    } else if (output !== undefined && output !== null) {
      rendered = <pre className={styles.code}>{String(output)}</pre>;
    } else {
      rendered = null;
    }

    return (
      <div className={cn(styles.section, className)} {...props}>
        <div className={styles.sectionLabel}>
          {errorText ? 'Error' : 'Result'}
        </div>
        {errorText ? <p className={styles.errorText}>{errorText}</p> : null}
        {rendered}
      </div>
    );
  }
);

ToolOutput.displayName = 'ToolOutput';

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
