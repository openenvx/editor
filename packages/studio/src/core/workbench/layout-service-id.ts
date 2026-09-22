import { createServiceId } from '../runtime/create-service-id';
import type { WorkbenchLayout, WorkbenchPart } from './workbench-layout';

/** Host-facing API for workbench region visibility (VS Code–style parts). */
export interface LayoutService {
  getLayout(): Readonly<WorkbenchLayout>;
  isVisible(part: WorkbenchPart): boolean;
  setVisible(part: WorkbenchPart, visible: boolean): void;
  toggle(part: WorkbenchPart): void;
}

export const LayoutServiceId = createServiceId<LayoutService>('layoutService');
