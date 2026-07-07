import { Emitter } from '../runtime/emitter';
import type {
  MenuChoice,
  MenuChoiceBindings,
  MenuChoiceProvider,
} from './menu-choice';

export class MutableMenuChoiceProvider implements MenuChoiceProvider {
  private bindings: MenuChoiceBindings;
  private readonly emitter = new Emitter<string>();
  readonly onDidChangeValue = this.emitter.event;

  constructor(
    readonly id: string,
    bindings: MenuChoiceBindings
  ) {
    this.bindings = bindings;
  }

  updateBindings(bindings: MenuChoiceBindings): void {
    this.bindings = bindings;
  }

  getValue(): string {
    return this.bindings.getValue();
  }

  setValue(value: string): void {
    this.bindings.setValue(value);
    this.emitter.fire(value);
  }

  getChoices(): MenuChoice[] {
    return this.bindings.getChoices();
  }

  notifyValueChanged(): void {
    this.emitter.fire(this.getValue());
  }
}
