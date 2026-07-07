import { applyShellItemOptions, DescriptorBuilder } from './descriptor-builder';
import type {
  DescriptorItemBase,
  ShellItemOptions,
} from './descriptor-builder';
import type {
  ShellDropdownItemBase,
  ShellDropdownMenuItemDescriptor,
} from './shell-dropdown';

export interface StatusBarItemBase extends DescriptorItemBase {
  alignment: 'left' | 'right';
}

export interface StatusBarTextItemDescriptor extends StatusBarItemBase {
  kind?: 'text';
  text: string;
  commandId?: string;
}

export interface StatusBarDropdownItemDescriptor extends ShellDropdownItemBase {
  alignment: 'left' | 'right';
  variant?: 'statusBar';
}

export type StatusBarItemDescriptor =
  | StatusBarTextItemDescriptor
  | StatusBarDropdownItemDescriptor;

export interface StatusBarDropdownOptions extends ShellItemOptions {
  label?: string;
  labelBinding?: string;
  labelSuffix?: string;
  items: ShellDropdownMenuItemDescriptor[];
}

class StatusBarRegionBuilder {
  constructor(
    private readonly parent: StatusBarBuilder,
    private readonly alignment: 'left' | 'right'
  ) {}

  text(
    text: string,
    options: ShellItemOptions & { id: string }
  ): StatusBarRegionBuilder {
    this.parent.append(
      applyShellItemOptions(
        {
          alignment: this.alignment,
          id: options.id,
          kind: 'text',
          text,
        },
        options
      )
    );
    return this;
  }

  dropdown(
    id: string,
    options: StatusBarDropdownOptions
  ): StatusBarRegionBuilder {
    this.parent.append(
      applyShellItemOptions(
        {
          alignment: this.alignment,
          id,
          items: options.items,
          kind: 'dropdown',
          label: options.label,
          labelBinding: options.labelBinding,
          labelSuffix: options.labelSuffix,
          variant: 'statusBar',
        },
        options
      )
    );
    return this;
  }

  item(descriptor: StatusBarItemDescriptor): StatusBarRegionBuilder {
    this.parent.append({ ...descriptor, alignment: this.alignment });
    return this;
  }

  end(): StatusBarBuilder {
    return this.parent;
  }
}

export class StatusBarBuilder extends DescriptorBuilder<StatusBarItemDescriptor> {
  append(item: StatusBarItemDescriptor): this {
    return this.push(item);
  }

  left(): StatusBarRegionBuilder {
    return new StatusBarRegionBuilder(this, 'left');
  }

  right(): StatusBarRegionBuilder {
    return new StatusBarRegionBuilder(this, 'right');
  }
}

export function createStatusBarBuilder(): StatusBarBuilder {
  return new StatusBarBuilder();
}

export function isStatusBarDropdownItem(
  item: StatusBarItemDescriptor
): item is StatusBarDropdownItemDescriptor {
  return item.kind === 'dropdown';
}
