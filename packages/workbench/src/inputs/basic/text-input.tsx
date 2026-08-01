import { useEffect, useRef, useState } from 'react';

import { Input } from '../../primitives/input';

export interface TextInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Debounce property commits (ms). Blur and unmount flush immediately. */
  debounceMs?: number;
}

export function TextInput({ id, value, onChange, debounceMs }: TextInputProps) {
  if (!debounceMs) {
    return (
      <Input
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    );
  }

  return (
    <DebouncedTextInput
      debounceMs={debounceMs}
      id={id}
      onChange={onChange}
      value={value}
    />
  );
}

function DebouncedTextInput({
  id,
  value,
  onChange,
  debounceMs,
}: TextInputProps & { debounceMs: number }) {
  const [draft, setDraft] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);
  const onChangeRef = useRef(onChange);
  const lastCommittedRef = useRef(value);
  draftRef.current = draft;
  onChangeRef.current = onChange;

  useEffect(() => {
    if (value === lastCommittedRef.current) {
      return;
    }
    lastCommittedRef.current = value;
    setDraft(value);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [value]);

  useEffect(
    () => () => {
      if (!timerRef.current) {
        return;
      }
      clearTimeout(timerRef.current);
      timerRef.current = null;
      lastCommittedRef.current = draftRef.current;
      onChangeRef.current(draftRef.current);
    },
    []
  );

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const commit = (next: string) => {
    clearTimer();
    lastCommittedRef.current = next;
    onChangeRef.current(next);
  };

  const handleChange = (next: string) => {
    setDraft(next);
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      lastCommittedRef.current = next;
      onChangeRef.current(next);
    }, debounceMs);
  };

  return (
    <Input
      id={id}
      onBlur={() => {
        if (draft !== value) {
          commit(draft);
        }
      }}
      onChange={(event) => handleChange(event.target.value)}
      value={draft}
    />
  );
}
