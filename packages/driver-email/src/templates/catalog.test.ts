import { describe, expect, it } from 'vitest';

import {
  createBarebonesActivationScene,
  emailTemplateCatalog,
  findTemplate,
  findTemplateCollection,
} from './index';

function findLayerById(
  layers: unknown,
  id: string
): { id: string; type: string; data?: Record<string, unknown> } | undefined {
  if (!Array.isArray(layers)) {
    return undefined;
  }
  for (const layer of layers) {
    if (!layer || typeof layer !== 'object') {
      continue;
    }
    const node = layer as {
      id?: string;
      type?: string;
      data?: { children?: unknown };
    };
    if (node.id === id && typeof node.type === 'string') {
      return node as {
        id: string;
        type: string;
        data?: Record<string, unknown>;
      };
    }
    const nested = findLayerById(node.data?.children, id);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

describe('emailTemplateCatalog', () => {
  it('lists Barebones with Activation', () => {
    const barebones = findTemplateCollection('barebones');
    expect(barebones?.name).toBe('Barebones');
    expect(emailTemplateCatalog).toHaveLength(1);

    const activation = findTemplate('barebones', 'activation');
    expect(activation?.name).toBe('Activation');
  });
});

describe('createBarebonesActivationScene', () => {
  it('builds an email scene with confirm heading and button', () => {
    const scene = createBarebonesActivationScene();
    const page = scene.pages[0];
    expect(page?.layout).toBe('email');
    expect(page?.name).toBe('Activation');

    const json = JSON.stringify(scene);
    expect(json).toContain("We're almost there!");
    expect(json).toContain('Confirm email');
    expect(json).toContain('Barebones');
    expect(json).toContain('https://example.com/');
  });

  it('keeps social icons as inline image links inside a section', () => {
    const scene = createBarebonesActivationScene();
    const social = findLayerById(scene.pages[0]?.layers, 'footer-social');
    expect(social?.type).toBe('email.section');
    expect(social?.data?.align).toBe('center');

    const children = social?.data?.children;
    expect(Array.isArray(children)).toBe(true);
    expect(
      (children as { id: string; type: string }[]).map((child) => child.type)
    ).toEqual([
      'email.imageLink',
      'email.imageLink',
      'email.imageLink',
      'email.imageLink',
    ]);
  });

  it('centers the hero logo via section + image align', () => {
    const scene = createBarebonesActivationScene();
    const hero = findLayerById(scene.pages[0]?.layers, 'hero-section');
    expect(hero?.data?.align).toBe('center');
    const logoHeading = findLayerById(
      scene.pages[0]?.layers,
      'hero-logo-heading'
    );
    expect(logoHeading?.data?.align).toBe('center');
    const logo = findLayerById(scene.pages[0]?.layers, 'hero-logo');
    expect(logo?.type).toBe('email.image');
    expect(logo?.data?.align).toBe('center');
  });
});
