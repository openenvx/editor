import {
  createEmailScene,
  defaultEmailWorkbench,
  renderEmailHtml,
} from '@openenvx/email-driver';
import { WorkbenchShell } from '@openenvx/studio';
import type { Scene as CoreScene } from '@openenvx/studio/schema';
import { useCallback, useMemo } from 'react';

import '@openenvx/email-driver/theme.css';
import '@openenvx/studio/theme.css';

export function App() {
  const initialScene = useMemo(() => createEmailScene(), []);
  const plugins = useMemo(() => defaultEmailWorkbench.plugins, []);

  const onSceneChange = useCallback((scene: CoreScene) => {
    void renderEmailHtml(
      scene as unknown as Parameters<typeof renderEmailHtml>[0]
    ).then((html) => {
      console.log('[email-package-demo] HTML length:', html.length);
    });
  }, []);

  return (
    <div className="email-package-demo">
      <WorkbenchShell
        className="email-package-demo-editor openenvx-email-editor"
        editorTitle="Welcome email"
        editorUri="openenvx://email/editor"
        initialScene={initialScene as unknown as CoreScene}
        layout={defaultEmailWorkbench.layout}
        onSceneChange={onSceneChange}
        plugins={plugins}
        theme="dark"
      />
      <style>{`
        html, body, #root { height: 100%; margin: 0; }
        .email-package-demo { height: 100%; display: flex; flex-direction: column; }
        .email-package-demo-editor { flex: 1; min-height: 0; }
      `}</style>
    </div>
  );
}
