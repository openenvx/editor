import { createHtmlDemoScene, type Scene } from '@openenvx/html-studio';

import {
  createGalleryImageSlots,
  EVENT_GALLERY_TYPE,
  EVENT_HERO_LAYER_ID,
  EVENT_HERO_TYPE,
  EVENT_LOGO_TYPE,
  EVENT_PAGE_LAYER_ID,
  EVENT_PAGE_TYPE,
} from './plugin/blocks';

const { schemaVersion: SCHEMA_VERSION } = createHtmlDemoScene();

const LOGO_SRC = '/demo/logo.jpg';

const DEMO_IMAGES = [
  '/demo/g1.jpg',
  '/demo/g2.jpg',
  '/demo/g3.jpg',
  '/demo/g4.jpg',
  '/demo/g5.jpg',
  '/demo/g6.jpg',
  '/demo/g7.jpg',
  '/demo/g8.jpg',
  '/demo/g9.jpg',
  '/demo/g10.jpg',
  '/demo/g11.jpg',
  '/demo/g12.jpg',
  '/demo/g13.jpg',
];

/** Structural template parts: content editable, not delete/duplicate/reorder. */
const STRUCTURAL = { writeMode: 'content' as const };

export function createSnapveloEventScene(): Scene {
  return {
    schemaVersion: SCHEMA_VERSION,
    templatePolicy: {
      version: 1,
      allowDuplicateLayers: false,
      allowDeleteLayers: true,
      allowInsertLayers: true,
      allowPageResize: true,
    },
    pages: [
      {
        id: 'event-page-1',
        name: 'Event',
        layout: 'html',
        layers: [
          {
            id: EVENT_PAGE_LAYER_ID,
            type: EVENT_PAGE_TYPE,
            ...STRUCTURAL,
            data: {
              backgroundColor: '#f5f0e8',
              brandColor: '#a50016',
              textColor: '#ffffff',
              galleryRadius: 6,
              maxWidth: 1024,
              children: [
                {
                  id: EVENT_HERO_LAYER_ID,
                  type: EVENT_HERO_TYPE,
                  ...STRUCTURAL,
                  data: {
                    children: [
                      {
                        id: 'event-logo',
                        type: EVENT_LOGO_TYPE,
                        ...STRUCTURAL,
                        data: {
                          src: LOGO_SRC,
                          alt: 'Event logo',
                        },
                      },
                      {
                        id: 'event-date',
                        type: 'html.heading',
                        ...STRUCTURAL,
                        data: {
                          html: '22/12/2023',
                          level: '3',
                          color: '#ffffff',
                        },
                      },
                      {
                        id: 'event-title',
                        type: 'html.heading',
                        ...STRUCTURAL,
                        data: {
                          html: 'Company Christmas Party',
                          level: '1',
                          color: '#ffffff',
                        },
                      },
                      {
                        id: 'event-subtitle',
                        type: 'html.text',
                        ...STRUCTURAL,
                        data: {
                          html: 'Celebrate the holiday season and a successful year together!',
                          color: '#ffffff',
                        },
                      },
                    ],
                  },
                },
                {
                  id: 'event-gallery',
                  type: EVENT_GALLERY_TYPE,
                  ...STRUCTURAL,
                  data: {
                    columns: 3,
                    borderRadius: 6,
                    slots: createGalleryImageSlots(DEMO_IMAGES),
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}
