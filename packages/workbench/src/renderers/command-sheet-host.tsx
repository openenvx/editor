import { ContextKeyServiceId } from '@openenvx/core';
import type {
  ViewContainerDescriptor,
  ViewPanelRegistration,
} from '@openenvx/headless';
import { memo, useCallback, useMemo, type ComponentType } from 'react';

import { useWorkbenchContext } from '../context/workbench-context';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../primitives/sheet';

function resolveViewPanels(
  registered: ViewPanelRegistration[] | undefined
): Record<string, ComponentType> {
  const map: Record<string, ComponentType> = {};
  for (const entry of registered ?? []) {
    map[entry.id] = entry.Component as ComponentType;
  }
  return map;
}

function CommandSheet({
  container,
  open,
  Component,
  onOpenChange,
}: {
  container: ViewContainerDescriptor;
  open: boolean;
  Component: ComponentType;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        side="left"
        // Radix points aria-describedby at SheetDescription; opt out when absent.
        {...(container.sheetDescription
          ? {}
          : { 'aria-describedby': undefined })}
      >
        <SheetHeader>
          <SheetTitle>{container.title}</SheetTitle>
          {container.sheetDescription ? (
            <SheetDescription>{container.sheetDescription}</SheetDescription>
          ) : null}
        </SheetHeader>
        <Component />
      </SheetContent>
    </Sheet>
  );
}

/** Hosts Sheet chrome for command-behavior view containers with sheetOpenKey. */
export const CommandSheetHost = memo(() => {
  const { api } = useWorkbenchContext();
  const viewContainers = useWorkbenchContextSelector(
    (state) => state.viewContainers
  );
  const contextKeys = useWorkbenchContextSelector((state) => state.contextKeys);
  const registeredViewPanels = useWorkbenchContextSelector(
    (state) => state.viewPanels
  );
  const viewPanels = useMemo(
    () => resolveViewPanels(registeredViewPanels ?? undefined),
    [registeredViewPanels]
  );

  const setOpen = useCallback(
    (key: string, next: boolean) => {
      api.getService(ContextKeyServiceId)?.setContext(key, next);
    },
    [api]
  );

  const sheets = (viewContainers ?? []).filter(
    (container) =>
      container.sidebarBehavior === 'command' && container.sheetOpenKey
  );

  if (sheets.length === 0) {
    return null;
  }

  return (
    <>
      {sheets.map((container) => {
        const openKey = container.sheetOpenKey!;
        const open = contextKeys?.[openKey] === true;
        const componentView = container.views.find(
          (view) => view.content.kind === 'component'
        );
        if (!componentView || componentView.content.kind !== 'component') {
          return null;
        }
        const Component = viewPanels[componentView.content.componentId];
        if (!Component) {
          return null;
        }
        return (
          <CommandSheet
            Component={Component}
            container={container}
            key={container.id}
            onOpenChange={(next) => setOpen(openKey, next)}
            open={open}
          />
        );
      })}
    </>
  );
});

CommandSheetHost.displayName = 'CommandSheetHost';
