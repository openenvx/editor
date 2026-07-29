import {
  DocumentHostServiceId,
  LocalizationServiceId,
  MutableDocumentHostService,
  ThemeServiceId,
} from '@openenvx/core';
import type { Plugin } from '@openenvx/core';
import { ShellUiServiceId } from '@openenvx/headless';
import type {
  InspectorHostContext,
  InspectorPathContextOptions,
  LayerSurfaceItem,
  WorkbenchApi,
  WorkbenchControllerOptions,
} from '@openenvx/headless';
import type { Scene } from '@openenvx/schema';
import type { MutableRefObject, ReactNode } from 'react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { EditorViewportProvider } from '../context/editor-viewport-context';
import { DEFAULT_LOCALE, LocaleProvider } from '../context/locale-context';
import { ThemeProvider, DEFAULT_THEME } from '../context/theme-context';
import {
  WorkbenchProvider,
  useWorkbenchContext,
} from '../context/workbench-context';
import {
  DEFAULT_FIELDS_PLUGIN_ID,
  DefaultWorkbenchFieldsPlugin,
} from '../fields/default-fields-plugin';
import { useMountEffect } from '../hooks/use-mount-effect';
import { useWorkbench } from '../hooks/use-workbench';
import { useWorkbenchContextSelector } from '../hooks/use-workbench-selector';
import { workbenchI18n } from '../i18n/workbench-i18n';
import { WorkbenchI18nProvider } from '../i18n/workbench-i18n-provider';
import { ActivitySidebar } from '../layout/activity-sidebar';
import { CanvasChrome } from '../layout/canvas-chrome';
import { EditorLayout } from '../layout/editor-layout';
import { CommandPaletteRenderer } from '../renderers/command-palette-renderer';
import { ContextMenuRenderer } from '../renderers/context-menu-renderer';
import { EditorPaneRenderer } from '../renderers/editor-pane-renderer';
import { FloatingToolbarRenderer } from '../renderers/floating-toolbar-renderer';
import { OverlayRenderer } from '../renderers/overlay-renderer';
import { SecondarySidebarRenderer } from '../renderers/secondary-sidebar-renderer';
import { StatusBarRenderer } from '../renderers/status-bar-renderer';
import {
  DEFAULT_INSPECTOR_PLUGIN_ID,
  DefaultInspectorContainerPlugin,
} from '../views/default-inspector-plugin';
import {
  DEFAULT_WORKBENCH_CHROME_PLUGIN_ID,
  DefaultWorkbenchChromePlugin,
} from '../views/default-workbench-chrome-plugin';

export interface WorkbenchShellProps {
  plugins: Plugin[];
  locale?: string;
  fallbackLocale?: string;
  onLocaleChange?: (locale: string) => void;
  className?: string;
  theme?: 'light' | 'dark' | string;
  onThemeChange?: (theme: string) => void;
  initialScene?: Scene;
  editorUri?: string;
  editorTitle?: string;
  layout?: WorkbenchControllerOptions['layout'];
  layoutStore?: WorkbenchControllerOptions['layoutStore'];
  showEditorArea?: boolean;
  onOpenDocument?: () => Promise<string | undefined>;
  onSaveAs?: () => Promise<string | undefined>;
  createInspectorHostContext?: (
    options: InspectorPathContextOptions,
    helpers: {
      api: WorkbenchApi;
      executeCommand: (commandId: string) => Promise<boolean>;
    }
  ) => InspectorHostContext;
  renderEditorPane?: (ctx: {
    layerSurface: LayerSurfaceItem[];
    editorPaneKind: string;
  }) => ReactNode;
}

const ChromeRegion = memo(
  ({
    paletteOpen,
    onPaletteOpenChange,
  }: {
    paletteOpen: boolean;
    onPaletteOpenChange: (open: boolean) => void;
  }) => {
    const overlays = useWorkbenchContextSelector((state) => state.overlays);
    const commandPalette = useWorkbenchContextSelector(
      (state) => state.commandPalette
    );
    const commandStates = useWorkbenchContextSelector(
      (state) => state.commandStates
    );
    const { api } = useWorkbenchContext();

    return (
      <>
        {overlays ? <OverlayRenderer overlays={overlays} /> : null}
        {paletteOpen && commandPalette && commandStates ? (
          <CommandPaletteRenderer
            commandPalette={commandPalette}
            commandStates={commandStates}
            executeCommand={(commandId) => api.executeCommand(commandId)}
            onOpenChange={onPaletteOpenChange}
            open={paletteOpen}
          />
        ) : null}
      </>
    );
  }
);

const EditorRegion = memo(
  ({
    showEditorArea,
    renderEditorPane,
  }: {
    showEditorArea: boolean;
    renderEditorPane?: WorkbenchShellProps['renderEditorPane'];
  }) => {
    const layerSurface = useWorkbenchContextSelector(
      (state) => state.layerSurface
    );
    const editorPaneKind = useWorkbenchContextSelector(
      (state) => state.editorPaneKind
    );
    const editorPanes = useWorkbenchContextSelector(
      (state) => state.editorPanes
    );
    const layout = useWorkbenchContextSelector((state) => state.layout);
    const contextMenu = useWorkbenchContextSelector(
      (state) => state.contextMenu
    );
    const toolbarItems = useWorkbenchContextSelector(
      (state) => state.toolbarItems
    );

    if (
      !layerSurface ||
      !editorPaneKind ||
      !editorPanes ||
      !layout ||
      !contextMenu ||
      !toolbarItems
    ) {
      return null;
    }

    if (!showEditorArea || !layout.editorArea) {
      return null;
    }

    const editorPane = renderEditorPane ? (
      renderEditorPane({ editorPaneKind, layerSurface })
    ) : (
      <EditorPaneRenderer
        editorPaneKind={editorPaneKind}
        editorPanes={editorPanes}
        layerSurface={layerSurface}
        onContainerResize={() => {}}
      />
    );

    return (
      <ContextMenuRenderer items={contextMenu}>
        {layout.floatingToolbar ? (
          <CanvasChrome
            floatingToolbar={<FloatingToolbarRenderer items={toolbarItems} />}
          >
            {editorPane}
          </CanvasChrome>
        ) : (
          editorPane
        )}
      </ContextMenuRenderer>
    );
  }
);

const SidebarRegion = memo(
  ({
    createInspectorHostContext,
  }: {
    createInspectorHostContext?: WorkbenchShellProps['createInspectorHostContext'];
  }) => {
    const viewContainers = useWorkbenchContextSelector(
      (state) => state.viewContainers
    );
    const contextMenu = useWorkbenchContextSelector(
      (state) => state.contextMenu
    );
    const layout = useWorkbenchContextSelector((state) => state.layout);

    if (
      !layout ||
      !(layout.activityBar || layout.primarySidebar) ||
      !contextMenu ||
      !viewContainers
    ) {
      return null;
    }

    return (
      <ActivitySidebar
        contextMenuItems={contextMenu}
        createInspectorHostContext={createInspectorHostContext}
        viewContainers={viewContainers}
      />
    );
  }
);

const StatusBarRegion = memo(() => {
  const statusBar = useWorkbenchContextSelector((state) => state.statusBar);
  const statusBarItemRenderers = useWorkbenchContextSelector(
    (state) => state.statusBarItemRenderers
  );
  const layout = useWorkbenchContextSelector((state) => state.layout);

  if (!layout?.statusBar || !statusBar) {
    return null;
  }

  return (
    <StatusBarRenderer
      itemRenderers={statusBarItemRenderers ?? undefined}
      items={statusBar}
    />
  );
});

const LayoutRegion = memo(
  ({
    showEditorArea,
    renderEditorPane,
    createInspectorHostContext,
  }: Pick<
    WorkbenchShellProps,
    'showEditorArea' | 'renderEditorPane' | 'createInspectorHostContext'
  >) => {
    const layout = useWorkbenchContextSelector((state) => state.layout);
    if (!layout) {
      return null;
    }

    return (
      <EditorLayout
        editor={
          <EditorRegion
            renderEditorPane={renderEditorPane}
            showEditorArea={showEditorArea ?? true}
          />
        }
        inspector={
          <SecondarySidebarRenderer
            createInspectorHostContext={createInspectorHostContext}
          />
        }
        primarySidebar={
          <SidebarRegion
            createInspectorHostContext={createInspectorHostContext}
          />
        }
        statusBar={<StatusBarRegion />}
      />
    );
  }
);

function ThemeServiceBinding({
  api,
  theme,
}: {
  api: WorkbenchApi;
  theme: string;
}) {
  useMountEffect(() => {
    api.getService(ThemeServiceId)?.setTheme(theme);
  });

  return null;
}

function LocaleServiceBinding({
  api,
  locale,
  fallbackLocale,
}: {
  api: WorkbenchApi;
  locale: string;
  fallbackLocale: string;
}) {
  useMountEffect(() => {
    const localization = api.getService(LocalizationServiceId);
    if (!localization) {
      return;
    }
    localization.setLocale(locale);
    localization.setFallbackLocale(fallbackLocale);
  });

  return null;
}

function DocumentHostBinding({
  api,
  onOpenDocument,
  onSaveAs,
}: {
  api: WorkbenchApi;
  onOpenDocument?: () => Promise<string | undefined>;
  onSaveAs?: () => Promise<string | undefined>;
}) {
  const onOpenDocumentRef = useRef(onOpenDocument);
  const onSaveAsRef = useRef(onSaveAs);
  onOpenDocumentRef.current = onOpenDocument;
  onSaveAsRef.current = onSaveAs;

  useMountEffect(() => {
    const documentHost = api.getService(DocumentHostServiceId);
    if (!(documentHost instanceof MutableDocumentHostService)) {
      return;
    }

    documentHost.configurePrompts({
      promptOpen: Boolean(onOpenDocument),
      promptSaveAs: Boolean(onSaveAs),
    });
    documentHost.updateBindings({
      promptOpen: () => onOpenDocumentRef.current?.() ?? Promise.resolve(null),
      promptSaveAs: () => onSaveAsRef.current?.() ?? Promise.resolve(null),
    });
  });

  return null;
}

function WorkbenchShellSubscriptions({
  api,
  setActiveTheme,
  setActiveLocale,
  setPaletteOpen,
  onThemeChangeRef,
  onLocaleChangeRef,
}: {
  api: WorkbenchApi;
  setActiveTheme: (theme: string) => void;
  setActiveLocale: (locale: string) => void;
  setPaletteOpen: (open: boolean) => void;
  onThemeChangeRef: MutableRefObject<((theme: string) => void) | undefined>;
  onLocaleChangeRef: MutableRefObject<((locale: string) => void) | undefined>;
}) {
  useMountEffect(() => {
    const themeService = api.getService(ThemeServiceId);
    const localization = api.getService(LocalizationServiceId);
    const shellUi = api.getService(ShellUiServiceId);

    if (shellUi) {
      setPaletteOpen(shellUi.commandPaletteOpen);
    }

    const disposeTheme = themeService?.onDidChangeTheme((nextTheme) => {
      setActiveTheme(nextTheme);
      onThemeChangeRef.current?.(nextTheme);
    }).dispose;

    const disposeLocale = localization?.onDidChangeLocale((nextLocale) => {
      setActiveLocale(nextLocale);
      onLocaleChangeRef.current?.(nextLocale);
    }).dispose;

    const disposePalette = shellUi?.onDidChangeCommandPaletteOpen((open) => {
      setPaletteOpen(open);
    }).dispose;

    return () => {
      disposeTheme?.();
      disposeLocale?.();
      disposePalette?.();
    };
  });

  return null;
}

export function WorkbenchShell({
  plugins,
  locale = DEFAULT_LOCALE,
  fallbackLocale = DEFAULT_LOCALE,
  onLocaleChange,
  className,
  theme = DEFAULT_THEME,
  onThemeChange,
  initialScene,
  editorUri,
  editorTitle,
  layout,
  layoutStore,
  showEditorArea = true,
  onOpenDocument,
  onSaveAs,
  createInspectorHostContext,
  renderEditorPane,
}: WorkbenchShellProps) {
  const [activeTheme, setActiveTheme] = useState(theme);
  const [prevThemeProp, setPrevThemeProp] = useState(theme);
  const [activeLocale, setActiveLocale] = useState(locale);
  const [prevLocaleProp, setPrevLocaleProp] = useState(locale);
  const [paletteOpen, setPaletteOpen] = useState(false);

  if (theme !== prevThemeProp) {
    setPrevThemeProp(theme);
    setActiveTheme(theme);
  }

  if (locale !== prevLocaleProp) {
    setPrevLocaleProp(locale);
    setActiveLocale(locale);
  }

  const onThemeChangeRef = useRef(onThemeChange);
  const onLocaleChangeRef = useRef(onLocaleChange);
  onThemeChangeRef.current = onThemeChange;
  onLocaleChangeRef.current = onLocaleChange;

  const resolvedPlugins = useMemo(() => {
    const hasFieldsPlugin = plugins.some(
      (plugin) => plugin.id === DEFAULT_FIELDS_PLUGIN_ID
    );
    const hasInspectorPlugin = plugins.some(
      (plugin) => plugin.id === DEFAULT_INSPECTOR_PLUGIN_ID
    );
    const hasChromePlugin = plugins.some(
      (plugin) => plugin.id === DEFAULT_WORKBENCH_CHROME_PLUGIN_ID
    );
    const next = [...plugins];
    if (!hasChromePlugin) {
      next.unshift(new DefaultWorkbenchChromePlugin());
    }
    if (!hasInspectorPlugin) {
      next.unshift(new DefaultInspectorContainerPlugin());
    }
    if (!hasFieldsPlugin) {
      next.unshift(new DefaultWorkbenchFieldsPlugin());
    }
    return next;
  }, [plugins]);

  const workbenchOptions = useMemo(
    (): WorkbenchControllerOptions => ({
      editorTitle,
      editorUri,
      initialScene,
      layout,
      layoutStore,
      plugins: resolvedPlugins,
    }),
    [editorTitle, editorUri, initialScene, layout, layoutStore, resolvedPlugins]
  );

  const { api, ready } = useWorkbench(workbenchOptions);

  const handleThemeChange = useCallback(
    (nextTheme: string) => {
      setActiveTheme(nextTheme);
      onThemeChange?.(nextTheme);
      api?.getService(ThemeServiceId)?.setTheme(nextTheme);
    },
    [api, onThemeChange]
  );

  const handleLocaleChange = useCallback(
    (nextLocale: string) => {
      setActiveLocale(nextLocale);
      onLocaleChange?.(nextLocale);
      api?.getService(LocalizationServiceId)?.setLocale(nextLocale);
    },
    [api, onLocaleChange]
  );

  const handlePaletteOpenChange = useCallback(
    (open: boolean) => {
      setPaletteOpen(open);
      api?.getService(ShellUiServiceId)?.setCommandPaletteOpen(open);
    },
    [api]
  );

  if (!ready || !api) {
    return (
      <ThemeProvider onThemeChange={handleThemeChange} theme={activeTheme}>
        <div className={className} data-owb-theme={activeTheme}>
          {workbenchI18n.t('loading')}
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider onThemeChange={handleThemeChange} theme={activeTheme}>
      <LocaleProvider locale={activeLocale} onLocaleChange={handleLocaleChange}>
        <WorkbenchProvider api={api}>
          <WorkbenchI18nProvider
            fallbackLocale={fallbackLocale}
            locale={activeLocale}
          >
            <EditorViewportProvider>
              <ThemeServiceBinding api={api} key={theme} theme={activeTheme} />
              <LocaleServiceBinding
                api={api}
                fallbackLocale={fallbackLocale}
                key={`${locale}:${fallbackLocale}`}
                locale={activeLocale}
              />
              <DocumentHostBinding
                api={api}
                key={`${Boolean(onOpenDocument)}:${Boolean(onSaveAs)}`}
                onOpenDocument={onOpenDocument}
                onSaveAs={onSaveAs}
              />
              <WorkbenchShellSubscriptions
                api={api}
                onLocaleChangeRef={onLocaleChangeRef}
                onThemeChangeRef={onThemeChangeRef}
                setActiveLocale={setActiveLocale}
                setActiveTheme={setActiveTheme}
                setPaletteOpen={setPaletteOpen}
              />
              <div
                className={className}
                data-owb-theme={activeTheme}
                style={{ height: '100%', minHeight: 0 }}
              >
                <ChromeRegion
                  onPaletteOpenChange={handlePaletteOpenChange}
                  paletteOpen={paletteOpen}
                />
                <LayoutRegion
                  createInspectorHostContext={createInspectorHostContext}
                  renderEditorPane={renderEditorPane}
                  showEditorArea={showEditorArea}
                />
              </div>
            </EditorViewportProvider>
          </WorkbenchI18nProvider>
        </WorkbenchProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
