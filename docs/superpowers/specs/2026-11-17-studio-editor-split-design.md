# Studio / editor split

**Date:** 2026-11-17 **Status:** Draft for review

## Goal

`@openenvx/studio` is a declarative UI framework: views, commands, layout, and shell. It has no document, no scene, and no editor.

`@openenvx/editor` owns the artboard document, the scene store, and the editor plugins (pages, layers, variables, undo, save). It depends on studio.

`@openenvx/canvas-driver` stays the Konva side implementation. It depends on editor for the document and on studio for panels.

This cut does not build the cloud, chatbots, an agent action API, or a weselnemomenty integration. Those hosts mount the shell after it can boot with zero document.

## Hard rule

After the cut, `packages/studio` contains no document model, no scene store, and no editor session.

That includes public types, props, filenames, and identifiers. A center surface may remain. It is a main pane, not an editor pane. The host runtime may remain. It is the workbench runtime, not an editor runtime.

A search of `packages/studio` for `DocumentStore`, `EditorRuntime`, `EditorService`, `initialScene`, and `scene.layer` returns nothing. No filename under `packages/studio` contains `editor`, `scene`, or `document`.

`useDocumentTheme` reads the DOM theme attribute. Rename it to `useWorkbenchTheme`. The DOM is not an exception to the filename rule.

## Packages

```text
@openenvx/studio          views, commands, layout, shell
        ▲
@openenvx/editor          document, scene store, editor plugins
        ▲
@openenvx/canvas-driver   Konva. Document from editor, panels from studio
```

Studio does not depend on editor or canvas-driver. Editor depends on studio. Canvas-driver depends on both. `editor-sandbox` depends on editor for schema and preview, and on studio for contributions.

There is no re-export of editor symbols from studio. Packages are pre-1.0.

The artboard model lives in `@openenvx/editor`, which imports the workbench. A canvas library with no studio dependency is a later split.

## What moves to `@openenvx/editor`

**Model** (no React, no Konva):

- `schema/` — document Zod schemas, artboards, nodes, sessions, validation
- `scene/` — `DocumentStore`, layer tree, history, page ops, editability
- `preview/` — render IR, `compileArtboard`

**Document session**, taken out of the studio host:

- `EditorService` and `EditorInput` (open, save, dirty is a `Document`)
- Document load, save, revert, undo, redo
- `DocumentHostService`, `DocumentOperationsService`
- `ContextKeySynchronizer` scene keys (`scene.layerSelected`, dirty, active document)
- `RichTextInsertService`
- Scene and editor slices of workbench state

**Editor plugins and contributions:**

- Scene plugin, variables plugin, version history
- Pages and Layers views
- `LayerDefinition`, node definition, node compiler, node inspector, node tree, page rules
- Property paths that read `scene.layer.*`
- `LayerPreview` types used by those contributions

**Selection chrome:**

- `src/chrome` (floating selection toolbar) has no in-repo caller besides its own export. It is editor surface chrome. Move the folder to `@openenvx/editor/chrome` and drop studio's `./chrome` export.

## What stays in `@openenvx/studio`

- `Plugin`, `Command`, shortcuts, services, DI, registries, context-key mechanism
- Views, toolbars, command palette, status bar, dialogs, menus, layout, shell
- Activity bar and sidebar show/hide commands
- Generic property fields and plugin-path properties
- Main pane slot: a plugin registers a component for the center. The shell renders it. The shell does not know which document surface is active.

## Renames inside studio

| Today | After |
| --- | --- |
| `EditorRuntime` | `WorkbenchRuntime` |
| `CommandContext.scene`, `.selection`, `.editor` | removed |
| `PluginContext.scene`, `.editor` | removed |
| `EditorPane*` / `renderEditorPane` / `showEditorArea` / `editorPaneKind` | `MainPane*` / `renderMainPane` / `showMainArea` / `mainPaneKind` |
| `EditorViewport*` | `Viewport*` |
| `EditorChrome` (the shell frame) | `WorkbenchFrame` |
| `setEditorDebug` / editor diagnostics | `setWorkbenchDebug` / workbench diagnostics |
| `useDocumentTheme` | `useWorkbenchTheme` |

`WorkbenchController` does not construct a `DocumentStore`. Its options are plugins, layout, layout store, and debug. `initialScene`, `initialEditorState`, `editorUri`, `editorTitle`, and `enforceTemplatePolicy` move to `createEditorPlugins`.

`WorkbenchState` keeps chrome: view containers, layout, context keys, dialogs, toolbar, palette, status bar, main pane registrations. It drops `scene`, `selection`, `layerSurface`, and `editor`.

`WorkbenchApi` keeps command execution, layout toggles, dialogs, generic view-item selection, contribution registration, and diagnostics. It drops `scene`, `updateProperty`, `updateProperties`, `selectNodes`, `setHoveredLayer`, `undo`, `redo`, `save`, `saveAs`, `openDocument`, `revert`, `serializeScene`, and `loadScene`.

`viewSelection: 'layer' | 'page' | 'none'` leaves `ViewDescriptor`. A tree click is `selectViewItem(viewId, item)`. Pages and Layers, in the editor package, turn that click into document selection.

## How a host boots

```tsx
import { WorkbenchShell } from '@openenvx/studio/shell';
import { createEditorPlugins } from '@openenvx/editor';
import { defaultCanvasWorkbench } from '@openenvx/canvas-driver';

<WorkbenchShell
  plugins={[
    ...createEditorPlugins({ document, session }),
    ...defaultCanvasWorkbench.plugins,
  ]}
  layout={defaultCanvasWorkbench.layout}
/>;
```

`createEditorPlugins` builds the `DocumentStore`, registers it on the host, and contributes pages, layers, variables, undo, save, and the scene context keys.

`WorkbenchShell` no longer accepts `initialScene`, `editorUri`, `editorTitle`, `enforceTemplatePolicy`, `onOpenDocument`, `onSaveAs`, or `onSceneChange`.

A command reads the document from the container. `DocumentStoreServiceId` is exported from `@openenvx/editor` only.

```ts
const document = ctx.services.get(DocumentStoreServiceId);
```

The editor plugin registers document commands only after that service exists. A command whose store is missing returns `canExecute: false` and does not run.

`defaultCanvasWorkbench.plugins` is `CanvasPlugin` only. Variables come from `createEditorPlugins`.

## Imports

| Before | After |
| --- | --- |
| `@openenvx/studio/schema` | `@openenvx/editor/schema` |
| `@openenvx/studio/preview` | `@openenvx/editor/preview` |
| `DocumentStore`, layer helpers, `ScenePlugin` from `@openenvx/studio` | `@openenvx/editor` |
| `@openenvx/studio/plugins/variables` | `@openenvx/editor` |
| `@openenvx/studio/shell`, commands, views | unchanged |

`canvas-driver`, `editor-sandbox`, and the demo apps update their imports. Studio's publish build drops the schema, preview, and chrome entries. The editor package publishes `.`, `./schema`, `./preview`, and `./chrome`.

## Errors

Document validation stays in `@openenvx/editor` (`DocumentValidationError`, `validateDocument`). The shell does not catch or translate those errors.

Missing document service is a disabled command, not a thrown error on the workbench host.

## Tests

- Studio: `WorkbenchController` with an empty plugin list builds state and runs a command. The test file does not import the editor package.
- Editor: existing schema, scene, and document-store tests move with the files.
- Canvas demo: shell plus `createEditorPlugins` plus canvas still loads a document, undoes, and saves.
- Grep gate from the hard rule, run as part of the editor package's check or a studio test that scans filenames.

## Out of scope

- Renaming the npm package `@openenvx/studio`
- A document entry point that does not import studio
- Agent actions, chat, cloud, billing, or the weselnemomenty API
- Rewriting contributions into a new declaration style

## Scale

About 48 model files move as folders. About 60 more studio files split or move with the editor plugins and the document session. About 144 files in `canvas-driver` and `editor-sandbox` change imports from studio schema/preview to editor. Studio files that remain change the runtime and the renamed pane and viewport identifiers.
