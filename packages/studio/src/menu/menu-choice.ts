import type { Event } from '../runtime/emitter';

export interface MenuChoice {
  value: string;
  label: string;
}

export interface MenuChoiceProvider {
  readonly id: string;
  getValue(): string;
  setValue(value: string): void;
  getChoices(): MenuChoice[];
  readonly onDidChangeValue?: Event<string>;
}

export interface MenuChoiceBindings {
  getValue: () => string;
  setValue: (value: string) => void;
  getChoices: () => MenuChoice[];
}
