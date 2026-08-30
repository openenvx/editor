import type { WidgetFieldDef } from '@openenvx/core/schema';

import type { createPropertyBuilder } from './property-builder';

type SectionBuilder = ReturnType<
  ReturnType<typeof createPropertyBuilder>['section']
>;

export function appendWidgetManifestField(
  section: SectionBuilder,
  path: string,
  field: WidgetFieldDef
): void {
  const label = field.label;
  switch (field.kind) {
    case 'number': {
      section.number(path, label);
      break;
    }
    case 'color': {
      section.color(path, label);
      break;
    }
    case 'toggle': {
      section.toggle(path, label);
      break;
    }
    case 'image': {
      section.image(path, label);
      break;
    }
    case 'richText': {
      section.richText(path, label);
      break;
    }
    case 'align': {
      section.align(path, label);
      break;
    }
    case 'select': {
      if ('options' in field) {
        section.select(path, field.options, label);
      } else {
        section.text(path, label);
      }
      break;
    }
    case 'repeater': {
      // ponytail: repeater of nested objects - expose as JSON text until PropertyBuilder
      // gains nested object repeater wiring for widget manifests.
      section.text(path, `${label} (JSON)`);
      break;
    }
    default: {
      section.text(path, label);
    }
  }
}
