import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/headless/react';
import type {
  Modification,
  Scene,
  TemplateField,
} from '@xmazu/openenvxee-schema';
import {
  createEmptyScene,
  extractTemplateManifest,
  validateTemplateNames,
} from '@xmazu/openenvxee-schema';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { applyModificationsWithTextFit } from '../fit-text-layer-to-content';

import styles from './template-data-panel.module.css';

type FieldValues = Record<string, Modification>;

function modificationFromField(
  field: TemplateField,
  previous?: Modification
): Modification {
  const base: Modification = { name: field.name, ...previous };
  if (
    (field.kind === 'text' || field.kind === 'qr') &&
    base.text === undefined &&
    field.sample
  ) {
    return { ...base, text: field.sample };
  }
  if (field.kind === 'image' && base.imageUrl === undefined && field.sample) {
    return { ...base, imageUrl: field.sample };
  }
  if (field.kind === 'color' && base.color === undefined && field.sample) {
    return { ...base, color: field.sample };
  }
  return base;
}

function valuesEqualScene(a: Scene, b: Scene): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const TemplateDataPanel = memo(() => {
  const { api } = useWorkbenchContext();
  const selectedScene = useWorkbenchContextSelector((state) => state.scene);
  const scene = selectedScene ?? api.scene.getScene() ?? createEmptyScene();

  const baseSceneRef = useRef<Scene>(structuredClone(scene));
  const previewingRef = useRef(false);
  const lastContentRevisionRef = useRef(api.scene.getContentRevision());
  const [values, setValues] = useState<FieldValues>({});
  const [previewing, setPreviewing] = useState(false);
  const [baseEpoch, setBaseEpoch] = useState(0);
  const [baseManifest, setBaseManifest] = useState(() =>
    extractTemplateManifest(baseSceneRef.current)
  );
  const [nameValidation, setNameValidation] = useState(() =>
    validateTemplateNames(baseSceneRef.current)
  );

  useEffect(() => {
    if (!selectedScene) {
      return;
    }
    const contentRevision = api.scene.getContentRevision();
    if (previewingRef.current) {
      lastContentRevisionRef.current = contentRevision;
      return;
    }
    if (contentRevision === lastContentRevisionRef.current && baseEpoch > 0) {
      return;
    }
    lastContentRevisionRef.current = contentRevision;
    const nextBase = structuredClone(selectedScene);
    baseSceneRef.current = nextBase;
    setBaseManifest(extractTemplateManifest(nextBase));
    setNameValidation(validateTemplateNames(nextBase));
    setBaseEpoch((epoch) => epoch + 1);
  }, [api.scene, baseEpoch, selectedScene]);

  const applyPreview = useCallback(
    (nextValues: FieldValues) => {
      const mods = Object.values(nextValues).filter(
        (mod) =>
          mod.text !== undefined ||
          mod.imageUrl !== undefined ||
          mod.color !== undefined ||
          mod.fontFamily !== undefined ||
          mod.fontSize !== undefined ||
          mod.hidden !== undefined
      );
      const resolved = applyModificationsWithTextFit(
        baseSceneRef.current,
        mods
      );
      previewingRef.current = true;
      setPreviewing(true);
      if (!valuesEqualScene(api.scene.getScene(), resolved)) {
        api.scene.setScene(resolved);
      }
    },
    [api.scene]
  );

  const clearPreview = useCallback(() => {
    previewingRef.current = false;
    setPreviewing(false);
    setValues({});
    api.scene.setScene(structuredClone(baseSceneRef.current));
  }, [api.scene]);

  const updateField = useCallback(
    (name: string, patch: Partial<Modification>) => {
      setValues((prev) => {
        const field = baseManifest.fields.find((entry) => entry.name === name);
        const current = prev[name] ?? { name };
        const next: FieldValues = {
          ...prev,
          [name]: {
            ...(field ? modificationFromField(field, current) : current),
            ...patch,
            name,
          },
        };
        queueMicrotask(() => applyPreview(next));
        return next;
      });
    },
    [applyPreview, baseManifest.fields]
  );

  if (baseManifest.fields.length === 0) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <h2 className={styles.title}>Template data</h2>
          <p className={styles.hint}>
            Name layers in the Layers panel to expose them as template fields.
          </p>
        </div>
        <p className={styles.empty}>
          No named text, QR, image, or shape layers yet.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Template data</h2>
        <p className={styles.hint}>
          Live preview applies modifications without writing into undo history.
          Clear preview to restore the template.
        </p>
        {previewing ? (
          <span className={styles.previewing}>Preview active</span>
        ) : null}
      </div>

      {nameValidation.duplicates.length > 0 ? (
        <p className={styles.warning}>
          Duplicate layer names break the template API:{' '}
          {nameValidation.duplicates.join(', ')}. Rename layers so each name is
          unique.
        </p>
      ) : null}

      <div className={styles.fields}>
        {baseManifest.fields.map((field) => {
          const value = values[field.name] ?? modificationFromField(field);
          return (
            <label
              className={styles.field}
              key={`${field.pageId}:${field.layerId}:${field.name}`}
            >
              <span className={styles.label}>
                {field.name} <span className={styles.kind}>({field.kind})</span>
              </span>
              {field.kind === 'text' || field.kind === 'qr' ? (
                <textarea
                  className={styles.textarea}
                  onChange={(event) =>
                    updateField(field.name, { text: event.target.value })
                  }
                  value={value.text ?? field.sample ?? ''}
                />
              ) : null}
              {field.kind === 'image' ? (
                <input
                  className={styles.input}
                  onChange={(event) =>
                    updateField(field.name, { imageUrl: event.target.value })
                  }
                  type="url"
                  value={value.imageUrl ?? field.sample ?? ''}
                />
              ) : null}
              {field.kind === 'color' ? (
                <div className={styles.row}>
                  <input
                    onChange={(event) =>
                      updateField(field.name, { color: event.target.value })
                    }
                    type="color"
                    value={value.color ?? field.sample ?? '#000000'}
                  />
                  <input
                    className={styles.input}
                    onChange={(event) =>
                      updateField(field.name, { color: event.target.value })
                    }
                    value={value.color ?? field.sample ?? ''}
                  />
                </div>
              ) : null}
              {field.kind === 'text' || field.kind === 'qr' ? (
                <div className={styles.row}>
                  <input
                    className={styles.input}
                    onChange={(event) =>
                      updateField(field.name, {
                        color: event.target.value || undefined,
                      })
                    }
                    placeholder={
                      field.kind === 'qr' ? 'Foreground color' : 'Text color'
                    }
                    value={value.color ?? ''}
                  />
                  <label className={styles.row}>
                    <input
                      checked={value.hidden === true}
                      onChange={(event) =>
                        updateField(field.name, {
                          hidden: event.target.checked,
                        })
                      }
                      type="checkbox"
                    />
                    Hide
                  </label>
                </div>
              ) : (
                <label className={styles.row}>
                  <input
                    checked={value.hidden === true}
                    onChange={(event) =>
                      updateField(field.name, {
                        hidden: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  Hide
                </label>
              )}
            </label>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.button}
          disabled={!previewing}
          onClick={clearPreview}
          type="button"
        >
          Clear preview
        </button>
      </div>
    </div>
  );
});
