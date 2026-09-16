import { describe, expect, it } from 'vitest';
import type { RefObject } from 'react';

import { measurePropertyPopoverAnchor } from './use-property-popover-anchor';

function mockRect(left: number, width: number, top = 0, height = 24) {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    toJSON: () => ({}),
    width,
    x: left,
    y: top,
  } as DOMRect;
}

function refs(panel: HTMLElement, trigger: HTMLElement) {
  return {
    panelRef: { current: panel } as RefObject<HTMLElement | null>,
    triggerRef: { current: trigger } as RefObject<HTMLElement | null>,
  };
}

describe('measurePropertyPopoverAnchor', () => {
  it('anchors on panel left and opens left for right-docked inspector', () => {
    const panel = document.createElement('div');
    const trigger = document.createElement('button');
    panel.getBoundingClientRect = () => mockRect(900, 280, 0, 600);
    trigger.getBoundingClientRect = () => mockRect(920, 24, 120, 24);

    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 1200,
    });

    const result = measurePropertyPopoverAnchor(
      refs(panel, trigger).panelRef,
      refs(panel, trigger).triggerRef
    );

    expect(result).toEqual({
      height: 24,
      left: 900,
      side: 'left',
      top: 120,
    });
  });

  it('anchors on panel right and opens right for left-docked primary sidebar', () => {
    const panel = document.createElement('div');
    const trigger = document.createElement('button');
    panel.getBoundingClientRect = () => mockRect(0, 280, 0, 600);
    trigger.getBoundingClientRect = () => mockRect(200, 24, 120, 24);

    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 1200,
    });

    const result = measurePropertyPopoverAnchor(
      refs(panel, trigger).panelRef,
      refs(panel, trigger).triggerRef
    );

    expect(result).toEqual({
      height: 24,
      left: 280,
      side: 'right',
      top: 120,
    });
  });

  it('returns null when panel or trigger is missing', () => {
    const trigger = document.createElement('button');
    expect(
      measurePropertyPopoverAnchor(
        { current: null },
        { current: trigger } as RefObject<HTMLElement | null>
      )
    ).toBeNull();
  });

  it('clamps anchor top when trigger is above the panel visible band', () => {
    const panel = document.createElement('div');
    const trigger = document.createElement('button');
    panel.getBoundingClientRect = () => mockRect(900, 280, 100, 400);
    trigger.getBoundingClientRect = () => mockRect(920, 24, 40, 24);

    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 1200,
    });

    const result = measurePropertyPopoverAnchor(
      refs(panel, trigger).panelRef,
      refs(panel, trigger).triggerRef
    );

    expect(result?.top).toBe(100);
  });

  it('clamps anchor top when trigger is below the panel visible band', () => {
    const panel = document.createElement('div');
    const trigger = document.createElement('button');
    panel.getBoundingClientRect = () => mockRect(900, 280, 100, 400);
    trigger.getBoundingClientRect = () => mockRect(920, 24, 520, 24);

    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 1200,
    });

    const result = measurePropertyPopoverAnchor(
      refs(panel, trigger).panelRef,
      refs(panel, trigger).triggerRef
    );

    expect(result?.top).toBe(476);
  });
});
