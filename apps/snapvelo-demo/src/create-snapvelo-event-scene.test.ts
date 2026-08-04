import { describe, expect, it } from 'vitest';

import { createSnapveloEventScene } from './create-snapvelo-event-scene';
import {
  EVENT_GALLERY_TYPE,
  EVENT_HERO_LAYER_ID,
  EVENT_HERO_TYPE,
  EVENT_LOGO_TYPE,
  EVENT_PAGE_LAYER_ID,
  EVENT_PAGE_TYPE,
  eventGalleryBlock,
  eventHeroBlock,
  eventLogoBlock,
  eventPageBlock,
} from './plugin/blocks';

describe('createSnapveloEventScene', () => {
  it('seeds a real layer tree (hero, logo, texts, gallery)', () => {
    const scene = createSnapveloEventScene();
    const page = scene.pages[0]!;
    expect(page.layout).toBe('html');
    expect(scene.templatePolicy?.allowDuplicateLayers).toBe(false);
    const root = page.layers[0]!;
    expect(root.id).toBe(EVENT_PAGE_LAYER_ID);
    expect(root.type).toBe(EVENT_PAGE_TYPE);
    expect(root.writeMode).toBe('content');
    const eventPage = root as {
      id: string;
      type: string;
      writeMode?: string;
      data: {
        children: {
          id: string;
          type: string;
          writeMode?: string;
          data: { children?: { id: string; type: string; writeMode?: string }[] };
        }[];
      };
    };

    const hero = eventPage.data.children[0]!;
    expect(hero.id).toBe(EVENT_HERO_LAYER_ID);
    expect(hero.type).toBe(EVENT_HERO_TYPE);
    expect(hero.writeMode).toBe('content');
    expect(hero.data.children?.map((c) => c.id)).toEqual([
      'event-logo',
      'event-date',
      'event-title',
      'event-subtitle',
    ]);
    expect(hero.data.children?.[0]?.type).toBe(EVENT_LOGO_TYPE);
    expect(hero.data.children?.[1]?.type).toBe('html.heading');
    expect(hero.data.children?.[2]?.type).toBe('html.heading');
    expect(hero.data.children?.[3]?.type).toBe('html.text');
    expect(hero.data.children?.every((c) => c.writeMode === 'content')).toBe(
      true
    );

    const gallery = eventPage.data.children[1]!;
    expect(gallery.id).toBe('event-gallery');
    expect(gallery.type).toBe(EVENT_GALLERY_TYPE);
    expect(gallery.writeMode).toBe('content');
    const galleryData = gallery.data as {
      slots?: { images?: { type: string; data: { src: string } }[] };
    };
    expect(galleryData.slots?.images?.length).toBe(13);
    expect(galleryData.slots?.images?.[0]?.type).toBe('html.image');
    expect(galleryData.slots?.images?.[0]?.data.src).toBe('/demo/g1.jpg');
  });
});

describe('snapvelo block configs', () => {
  it('uses child layers (not slots) and hides from palette', () => {
    expect(eventPageBlock.palette).toBe(false);
    expect(eventHeroBlock.palette).toBe(false);
    expect(eventLogoBlock.palette).toBe(false);
    expect(eventGalleryBlock.palette).toBe(false);
    expect(eventPageBlock.acceptsChildren).toBe(true);
    expect(eventHeroBlock.acceptsChildren).toBe(true);
    expect(eventHeroBlock.childRichTextToolbar).toEqual({
      blockType: false,
      link: false,
      code: false,
      align: false,
    });
    expect(eventPageBlock.fields.pageLayout).toBeUndefined();
    expect(eventPageBlock.fields.backgroundColor?.kind).toBe('color');
    expect(eventHeroBlock.fields.heroVariant).toBeUndefined();
    expect(eventHeroBlock.fields.backgroundImage).toBeUndefined();
    expect(eventLogoBlock.fields.src?.kind).toBe('image');
    expect(eventPageBlock.slots).toBeUndefined();
    expect(eventHeroBlock.slots).toBeUndefined();
    expect(eventGalleryBlock.slots?.images?.partType).toBe('html.image');
    expect(eventGalleryBlock.fields.imageUrls).toBeUndefined();
  });
});
