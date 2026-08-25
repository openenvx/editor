import {
  createEmailDemoScene,
  DEFAULT_EMAIL_LAYOUT,
  EmailBlocksPlugin,
  EmailTopBar,
} from '@openenvx/driver-email';
import { WorkbenchShell } from '@openenvx/workbench';

import '@openenvx/workbench/theme.css';

const DEFAULT_EMAIL_DEMO_PLUGINS = [new EmailBlocksPlugin()];

export function App() {
  return (
    <div className="email-demo-app">
      <WorkbenchShell
        className="email-workbench openenvx-email-editor"
        editorTitle="Welcome email"
        editorUri="openworkbench://email-demo/welcome"
        initialScene={createEmailDemoScene()}
        layout={DEFAULT_EMAIL_LAYOUT}
        plugins={DEFAULT_EMAIL_DEMO_PLUGINS}
        theme="dark"
        topBar={<EmailTopBar />}
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        .email-demo-app { height: 100%; display: flex; flex-direction: column; }
        .email-workbench { flex: 1; min-height: 0; }
        .openenvx-email-editor { --wb-topbar-height: 48px; }
      `}</style>
    </div>
  );
}
