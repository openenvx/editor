import type { ChatStatus } from 'ai';
import { CornerDownLeft, Square, X } from 'lucide-react';
import {
  useCallback,
  useState,
  type FormEvent,
  type FormEventHandler,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type TextareaHTMLAttributes,
} from 'react';

import { cn } from '../../lib/cn';

import styles from './prompt-input.module.css';

export interface PromptInputMessage {
  text: string;
}

export type PromptInputProps = Omit<
  HTMLAttributes<HTMLFormElement>,
  'onSubmit'
> & {
  onSubmit: (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>
  ) => void | Promise<void>;
};

export function PromptInput({
  className,
  onSubmit,
  children,
  ...props
}: PromptInputProps) {
  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const textarea = form.querySelector('textarea');
      const text = textarea?.value.trim() ?? '';
      if (!text) {
        return;
      }
      void onSubmit({ text }, event);
      if (textarea) {
        textarea.value = '';
        textarea.style.height = 'auto';
      }
    },
    [onSubmit]
  );

  return (
    <form
      className={cn(styles.form, className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <div className={styles.inputGroup}>{children}</div>
    </form>
  );
}

export type PromptInputTextareaProps =
  TextareaHTMLAttributes<HTMLTextAreaElement>;

export function PromptInputTextarea({
  className,
  onChange,
  onKeyDown,
  placeholder = 'Ask the agent…',
  ...props
}: PromptInputTextareaProps) {
  const [isComposing, setIsComposing] = useState(false);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) {
        return;
      }
      if (event.key === 'Enter') {
        if (isComposing || event.nativeEvent.isComposing || event.shiftKey) {
          return;
        }
        event.preventDefault();
        const form = event.currentTarget.form;
        const submitButton = form?.querySelector(
          'button[type="submit"]'
        ) as HTMLButtonElement | null;
        if (submitButton?.disabled) {
          return;
        }
        form?.requestSubmit();
      }
    },
    [isComposing, onKeyDown]
  );

  const handleInput = useCallback(
    (event: React.FormEvent<HTMLTextAreaElement>) => {
      const target = event.currentTarget;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
      onChange?.(event as unknown as React.ChangeEvent<HTMLTextAreaElement>);
    },
    [onChange]
  );

  return (
    <textarea
      className={cn(styles.textarea, className)}
      onChange={onChange}
      onCompositionEnd={() => setIsComposing(false)}
      onCompositionStart={() => setIsComposing(true)}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      rows={1}
      {...props}
    />
  );
}

export type PromptInputSubmitProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'type'
> & {
  status?: ChatStatus;
  onStop?: () => void;
};

export function PromptInputSubmit({
  className,
  status,
  onStop,
  disabled,
  children,
  onClick,
  ...props
}: PromptInputSubmitProps) {
  const isGenerating = status === 'submitted' || status === 'streaming';

  let icon = <CornerDownLeft aria-hidden size={16} />;
  if (status === 'submitted') {
    icon = <span aria-hidden className={styles.spinner} />;
  } else if (status === 'streaming') {
    icon = <Square aria-hidden size={14} />;
  } else if (status === 'error') {
    icon = <X aria-hidden size={14} />;
  }

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isGenerating && onStop) {
        event.preventDefault();
        onStop();
        return;
      }
      onClick?.(event);
    },
    [isGenerating, onClick, onStop]
  );

  return (
    <button
      aria-label={isGenerating ? 'Stop' : 'Submit'}
      className={cn(
        styles.submit,
        isGenerating ? styles.submitStreaming : undefined,
        className
      )}
      disabled={disabled}
      onClick={handleClick}
      type={isGenerating && onStop ? 'button' : 'submit'}
      {...props}
    >
      {children ?? icon}
    </button>
  );
}

export function PromptInputError({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  if (!children) {
    return null;
  }
  return (
    <p className={cn(styles.error, className)} {...props}>
      {children}
    </p>
  );
}
