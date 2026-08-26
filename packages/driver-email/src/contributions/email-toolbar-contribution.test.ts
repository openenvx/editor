import { createToolbarBuilder } from '@openenvx/core';
import { describe, expect, it } from 'vitest';

import { EmailToolbarContribution } from './email-toolbar-contribution';

describe('EmailToolbarContribution', () => {
  it('registers bottom-center edit chrome gated by email edit mode', () => {
    const builder = createToolbarBuilder();
    new EmailToolbarContribution().contribute(builder, {
      scene: {
        getScene: () => ({
          schemaVersion: 4,
          pages: [],
          variables: [{ id: 'v1', key: 'test' }],
        }),
      },
    } as never);

    const items = builder.build();
    const when = "page.layout == 'email' && email.modeEdit";

    expect(items.every((item) => item.placement === 'bottom-center')).toBe(
      true
    );
    expect(items.every((item) => item.when === when)).toBe(true);

    const textDropdown = items.find((item) => item.id === 'email-toolbar-text');
    expect(textDropdown?.kind).toBe('dropdown');
    if (textDropdown?.kind === 'dropdown') {
      expect(textDropdown.icon).toBe('text');
      expect(textDropdown.items).toHaveLength(4);
    }

    const layoutDropdown = items.find(
      (item) => item.id === 'email-toolbar-layout'
    );
    expect(layoutDropdown?.kind).toBe('dropdown');
    if (layoutDropdown?.kind === 'dropdown') {
      expect(layoutDropdown.icon).toBe('grid');
      expect(layoutDropdown.items).toHaveLength(4);
    }

    expect(
      items.some(
        (item) =>
          item.kind === 'command' && item.commandId === 'scene.undo'
      )
    ).toBe(true);
    const image = items.find((item) => item.id === 'email-toolbar-image');
    expect(image?.kind === 'command' || image?.commandId === 'email.insertBlock')
      .toBe(true);
    if (image && 'args' in image) {
      expect(image.args).toEqual({ type: 'email.image' });
    }

    const variablesDropdown = items.find(
      (item) => item.id === 'email-toolbar-variables'
    );
    expect(variablesDropdown?.kind).toBe('dropdown');
    if (variablesDropdown?.kind === 'dropdown') {
      expect(variablesDropdown.icon).toBe('braces');
      expect(variablesDropdown.items).toHaveLength(2);
      expect(variablesDropdown.items[0]?.commandId).toBe('scene.insertVariable');
      expect(variablesDropdown.items[1]?.commandId).toBe('workbench.createVariable');
    }
  });
});
