import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
} from 'react';

import styles from './floating-toolbar.module.css';

export interface HiddenFileInputHandle {
  pick(): void;
}

export interface HiddenFileInputProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'type'
> {
  onPick?: (file: File) => void;
}

/** Visually hidden file input for toolbar replace actions. */
export const HiddenFileInput = forwardRef<
  HiddenFileInputHandle,
  HiddenFileInputProps
>(({ onPick, onChange, className, ...props }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    pick: () => inputRef.current?.click(),
  }));

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    event.target.value = '';
    onPick?.(file);
    onChange?.(event);
  };

  return (
    <input
      {...props}
      className={[styles.hiddenFileInput, className].filter(Boolean).join(' ')}
      onChange={handleChange}
      ref={inputRef}
      type="file"
    />
  );
});
