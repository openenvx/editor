import {
  DEFAULT_HTML_STUDIO_PLUGINS,
  WorkbenchShell,
  createHtmlDemoScene,
  createHtmlSandboxExtensionHost,
  DEFAULT_WORKBENCH_LAYOUT,
  mountSandboxExtensions,
  type WorkbenchApi,
} from '@openenvx/html-studio';
import countdownSource from 'openenvx-widget:./extensions/countdown.widget.tsx';
import rsvpSource from 'openenvx-widget:./extensions/rsvp.widget.tsx';
import { useMemo } from 'react';

import weddingManifest, {
  guestsViewTree,
} from './extensions/wedding.extension';

import '@openenvx/html-studio/theme.css';

interface SandboxHot {
  pushWidgetSource: (id: string, source: string) => Promise<void>;
  applySurfaceRender?: (id: string, tree: unknown) => void;
}

if (import.meta.hot) {
  import.meta.hot.accept(
    'openenvx-widget:./extensions/countdown.widget.tsx',
    (mod) => {
      const source = (mod as { default?: string } | undefined)?.default;
      const sandbox = import.meta.hot?.data.sandbox as SandboxHot | undefined;
      if (source && sandbox) {
        void sandbox.pushWidgetSource('wm.countdown', source);
      }
    }
  );
  import.meta.hot.accept(
    'openenvx-widget:./extensions/rsvp.widget.tsx',
    (mod) => {
      const source = (mod as { default?: string } | undefined)?.default;
      const sandbox = import.meta.hot?.data.sandbox as SandboxHot | undefined;
      if (source && sandbox) {
        void sandbox.pushWidgetSource('wm.rsvp', source);
      }
    }
  );
}

function preferSandboxInProcess(): boolean {
  const enabled = new URLSearchParams(window.location.search).has(
    'sandboxInProcess'
  );
  if (enabled) {
    console.warn(
      '[openenvx] ?sandboxInProcess=1 enables in-process QuickJS (test-only). Production hosts must use a Worker.'
    );
  }
  return enabled;
}

export function App() {
  const mountExternalHosts = useMemo(() => {
    const sandbox = createHtmlSandboxExtensionHost({
      permission: 'edit',
      preferInProcess: preferSandboxInProcess(),
      manifests: [weddingManifest],
      grants: [
        {
          id: 'wm.countdown',
          kind: 'widget',
          source: countdownSource,
          capabilities: ['widget:render', 'widget:values'],
          allowedCommands: ['wm.countdown.insert'],
          title: 'Countdown',
        },
        {
          id: 'wm.rsvp',
          kind: 'widget',
          source: rsvpSource,
          capabilities: ['widget:render', 'widget:values'],
          allowedCommands: ['wm.rsvp.insert'],
          title: 'RSVP',
        },
      ],
    });

    return (api: WorkbenchApi) => {
      const dispose = mountSandboxExtensions(api, sandbox);
      if (import.meta.hot) {
        import.meta.hot.data.sandbox = sandbox;
      }
      void sandbox.pushWidgetSource('wm.countdown', countdownSource);
      void sandbox.pushWidgetSource('wm.rsvp', rsvpSource);
      if (guestsViewTree) {
        sandbox.applySurfaceRender('wm.wedding.guests', guestsViewTree);
      }
      return () => {
        if (import.meta.hot) {
          import.meta.hot.data.sandbox = undefined;
        }
        dispose();
      };
    };
  }, []);

  return (
    <div className="html-demo-app">
      <WorkbenchShell
        className="html-workbench"
        editorTitle="Website"
        editorUri="openworkbench://html-demo"
        initialScene={createHtmlDemoScene()}
        layout={DEFAULT_WORKBENCH_LAYOUT}
        mountExternalHosts={mountExternalHosts}
        plugins={DEFAULT_HTML_STUDIO_PLUGINS}
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        .html-demo-app { height: 100%; display: flex; flex-direction: column; }
        .html-workbench { flex: 1; min-height: 0; }
      `}</style>
    </div>
  );
}
