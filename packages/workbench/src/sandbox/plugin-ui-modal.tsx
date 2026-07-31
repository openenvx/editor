import { useEffect, useState, type ReactNode } from 'react';

import { PluginUiFrame } from './plugin-ui-frame';
import type {
  SandboxExtensionController,
  SandboxUiState,
} from './sandbox-extension-controller';

import styles from './plugin-ui-modal.module.css';

/** Renders into the sandbox plugin's createRoot host (already on document.body). */
export function PluginUiModal({
  controller,
}: {
  controller: SandboxExtensionController;
}): ReactNode {
  const [ui, setUi] = useState<SandboxUiState | null>(controller.getUiState());

  useEffect(() => controller.subscribeUi(setUi), [controller]);

  if (!ui) {
    return null;
  }

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          controller.closeUi(ui.extensionId);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          controller.closeUi(ui.extensionId);
        }
      }}
    >
      <div
        aria-label="Plugin UI"
        aria-modal="true"
        className={styles.dialog}
        role="dialog"
      >
        <div className={styles.header}>
          <span className={styles.title}>{ui.extensionId}</span>
          <button
            className={styles.close}
            type="button"
            onClick={() => controller.closeUi(ui.extensionId)}
          >
            Close
          </button>
        </div>
        <PluginUiFrame
          html={ui.html}
          width={ui.width}
          height={ui.height}
          onClose={() => controller.closeUi(ui.extensionId)}
        />
      </div>
    </div>
  );
}
