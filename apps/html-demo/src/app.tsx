import {
  DEFAULT_HTML_STUDIO_PLUGINS,
  WorkbenchShell,
  createHtmlDemoScene,
  createHtmlSandboxExtensionHost,
  DEFAULT_WORKBENCH_LAYOUT,
  mountSandboxExtensions,
  type WorkbenchApi,
} from '@xmazu/openenvxee-html-studio';
import countdownSource from 'openenvx-widget:./extensions/countdown.widget.tsx';
import rsvpSource from 'openenvx-widget:./extensions/rsvp.widget.tsx';
import { useMemo } from 'react';

import weddingManifest, {
  guestsViewTree,
} from './extensions/wedding.extension';

import '@xmazu/openenvxee-html-studio/theme.css';

export function App() {
  const mountExternalHosts = useMemo(() => {
    const sandbox = createHtmlSandboxExtensionHost({
      permission: 'edit',
      preferInProcess: true,
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
      void sandbox.pushWidgetSource('wm.countdown', countdownSource);
      void sandbox.pushWidgetSource('wm.rsvp', rsvpSource);
      if (guestsViewTree) {
        sandbox.applySurfaceRender('wm.wedding.guests', guestsViewTree);
      }
      return dispose;
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
