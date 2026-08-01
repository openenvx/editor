import { createHtmlDemoScene, type Scene } from '@openenvx/html-studio';

import { menuWidget } from './extensions/menu.widget';

const { schemaVersion: SCHEMA_VERSION } = createHtmlDemoScene();

/** Demo scene: one sandbox wedding menu widget under html.root. */
export function createMenuDemoScene(): Scene {
  const manifest = menuWidget.manifest;
  const values = { ...manifest.defaults };

  return {
    schemaVersion: SCHEMA_VERSION,
    pages: [
      {
        id: 'menu-page',
        name: 'Menu',
        layout: 'html',
        layers: [
          {
            id: 'root',
            type: 'html.root',
            data: {
              background: '#fafaf9',
              children: [
                {
                  id: 'wm-menu-layer',
                  type: 'openenvx.widget',
                  name: manifest.label,
                  data: {
                    extensionId: manifest.id,
                    label: manifest.label,
                    values,
                    children: [],
                    manifest: {
                      id: manifest.id,
                      label: manifest.label,
                      kinds: manifest.kinds,
                      fields: manifest.fields,
                      defaults: values,
                    },
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
