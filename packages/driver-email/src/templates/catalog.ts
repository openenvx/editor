import type { Scene } from '@xmazu/openenvxee-schema';

import { createBarebonesActivationScene } from './scenes/barebones-activation';
import { createBarebonesFeatureAnnouncementScene } from './scenes/barebones-feature-announcement';

export interface EmailTemplateEntry {
  id: string;
  name: string;
  description: string;
  createScene: () => Scene;
}

export interface EmailTemplateCollection {
  id: string;
  name: string;
  description: string;
  templates: EmailTemplateEntry[];
}

export const emailTemplateCatalog: EmailTemplateCollection[] = [
  {
    id: 'barebones',
    name: 'Barebones',
    description: 'Clean transactional emails with a quiet layout.',
    templates: [
      {
        id: 'activation',
        name: 'Activation',
        description: 'Confirm email address after signup.',
        createScene: createBarebonesActivationScene,
      },
      {
        id: 'feature-announcement',
        name: 'Feature announcement',
        description: 'Release notes and what shipped this month.',
        createScene: createBarebonesFeatureAnnouncementScene,
      },
    ],
  },
];

export function findTemplateCollection(
  collectionId: string
): EmailTemplateCollection | undefined {
  return emailTemplateCatalog.find((entry) => entry.id === collectionId);
}

export function findTemplate(
  collectionId: string,
  templateId: string
): EmailTemplateEntry | undefined {
  return findTemplateCollection(collectionId)?.templates.find(
    (entry) => entry.id === templateId
  );
}
