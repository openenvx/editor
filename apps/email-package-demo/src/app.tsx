import { EmailEditor, type Scene } from '@openenvx/email';
import { renderEmailHtml } from '@openenvx/email/runtime';
import { useCallback } from 'react';

import '@openenvx/email/theme.css';

export function App() {
  const onChange = useCallback((scene: Scene) => {
    void renderEmailHtml(scene).then((html) => {
      console.log('[email-package-demo] HTML length:', html.length);
    });
  }, []);

  return (
    <div className="email-package-demo">
      <EmailEditor
        className="email-package-demo-editor openenvx-email-editor"
        editorTitle="Welcome email"
        onChange={onChange}
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
