import {
  createEmailDemoScene,
  EmailBlocksPlugin,
} from '@openenvx/driver-email';
import { DEFAULT_WORKBENCH_LAYOUT } from '@openenvx/headless';
import { WorkbenchShell } from '@openenvx/workbench';

import '@openenvx/workbench/theme.css';

const DEFAULT_EMAIL_DEMO_PLUGINS = [new EmailBlocksPlugin()];

export function App() {
  return (
    <div className="email-demo-app">
      <WorkbenchShell
        className="email-workbench"
        editorTitle="Welcome email"
        editorUri="openworkbench://email-demo/welcome"
        initialScene={createEmailDemoScene()}
        layout={DEFAULT_WORKBENCH_LAYOUT}
        plugins={DEFAULT_EMAIL_DEMO_PLUGINS}
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        .email-demo-app { height: 100%; display: flex; flex-direction: column; }
        .email-workbench { flex: 1; min-height: 0; }
      `}</style>
    </div>
  );
}
