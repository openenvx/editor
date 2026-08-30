# Workbench & headless

**Audience:** Contributors and integrators. "Headless" is the UI-agnostic controller/contribution layer that lives inside `@openenvx/core`; "workbench" is the React shell package `@openenvx/workbench`.

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md).

## Split

| Package | Responsibility |
| --- | --- |
| `@openenvx/core` (headless layer) | Runtime: `WorkbenchController`, state, contributions, builders, property host context, `ExternalHostMount` |
| `@openenvx/workbench` | React shell: `WorkbenchShell`, field/status renderers, default chrome plugins, sandbox/embed host adapters |

The headless layer is framework UI-agnostic descriptors, shipped from `@openenvx/core` (`.` and `./react`). Workbench is the first-party React consumer.

## What the headless layer (in `@openenvx/core`) owns

- `WorkbenchController`, `WorkbenchState`, `WorkbenchApi` - owns `EditorRuntime`, injects it into `PluginManager`
- `bootstrapWorkbenchServices()` - headless DI services on the runtime
- `WorkbenchPlugin` + `ctx.registerWorkbench()` - UI contribution registration
- Provider registries: `registerTreeDataProvider`, `registerFieldRenderer`, `registerStatusBarItemRenderer`, `registerEditorPane`, `registerTopBar`, `registerDialog`
- View content kinds: `tree` (explorer), `list` (flat catalogs with row actions + optional reorder), `properties` (inspector forms), `component` (custom React panels), `welcome` (empty state)
- Contribution points: Toolbar, CommandPalette, ViewContainer, View, ContextMenu, StatusBar, SidebarHeader, Overlay, PropertyPane, TopBar
- Builders: `MenuBuilder`, `ToolbarBuilder`, `CommandPaletteBuilder`, `StatusBarBuilder`, `SidebarHeaderBuilder`, `PropertyPaneBuilder`
- `WorkbenchLayout` (independent `activityBar` / `primarySidebar` / `secondarySidebar`), `ShellUiService`, `DEFAULT_WORKBENCH_LAYOUT`
- Optional `WorkbenchLayoutStore` for persisted visibility + container locations
- `WorkbenchProvider`, `useWorkbenchContext` (from `@openenvx/core/react`)
- `createPropertyHostContext`, `PropertyPathResolver`, `LayerPropertiesPaneFactory`, `PropertyPath`
- External hosts (not PluginManager): `ExternalHostMount`, `SandboxHostSurface`, `EmbedPanelHostSurface`, `mountSandboxHost` / `mountEmbedPanelHost`

## What workbench owns

- **WorkbenchShell** - React chrome; resolves default plugins via `resolveWorkbenchPlugins()` (ordered catalog in `packages/workbench/src/plugins/resolve-workbench-plugins.ts`); optional `onSceneChange` for content persistence; optional `mountExternalHosts` mounts sandbox/embed after start
- `DefaultWorkbenchChromePlugin` - scene-generic Pages + Layers sidebar, dirty Saved/Unsaved status
- Default inspector container + field renderer plugins
- `SandboxExtensionHost` / `mountSandboxExtensions`, `EmbedPanelHost` / `mountEmbedPanel`
- `PluginPanel`, postMessage transport, command gate helpers
- Shared by canvas studio and HTML studio (no canvas branding on generic chrome)

**Host rule:** Product apps declare contributions; the shell renders. Do not mount React panel views from the product host for form/settings panels - use `ViewContribution.buildProperties()` / `emptyMessage` / `when`. Use `registerViewPanel` only for non-form surfaces (chat, version history, …).

**View resolve order** (per `ViewContribution`): `buildProperties` → `componentId` → registered `TreeDataProvider` (`presentation: 'list' | 'tree'`, default `tree`) → `emptyMessage` welcome when no provider → empty tree.

**List views** - declare `presentation: 'list'` on the view and register a `TreeDataProvider`. Optional `addCommandId` / `addLabel` render a footer add button; `TreeItem.actions` render per-row icon buttons. Reorder uses the same `handleMove` / `canMove` hooks as explorer trees.

**Dialogs** - plugins register modal bodies with `ctx.registerDialog(id, Component)`; commands and services open them via `DialogService` / `api.openDialog(id, payload?)`. The shell mounts a single `DialogHost` (no per-feature `*DialogHost` in product hosts). One active dialog at a time - a new `open` replaces the current. Built-in `api.showConfirm({ title, description, confirmLabel?, cancelLabel? })` opens `workbench.confirm` and resolves `Promise<boolean>`. Confirm dialogs resolve via `api.resolveDialogConfirm(confirmed)` (shell-internal; do not reach into `DialogService` from React). Dialog components implement `WorkbenchDialogProps<TPayload>` (`open`, `payload`, `onClose`).

```ts
ctx.registerDialog('workbench.variables.edit', VariableEditDialog);
ctx.services
  .get(DialogServiceId)
  ?.open('workbench.variables.edit', { mode: 'create' });
const ok = await api.showConfirm({
  title: 'Delete?',
  description: 'Cannot undo.',
});
```

## Layout defaults

| Field | `DEFAULT_WORKBENCH_LAYOUT` | Canvas Pro `DEFAULT_CANVAS_LAYOUT` | HTML `DEFAULT_HTML_LAYOUT` | Email `DEFAULT_EMAIL_LAYOUT` |
| --- | --- | --- | --- | --- |
| `activityBar` | `true` | `true` | `true` | `true` |
| `primarySidebar` | `true` | `true` | `true` | `true` |
| `secondarySidebar` | `true` | `true` | `true` | `true` |
| `editorToolbars` | `false` | `true` | `true` | `false` |
| `topBar` | `false` | `false` | `false` | `true` |
| Other parts | all enabled | all enabled | all enabled | all enabled |

Visibility is mutable (`toggleActivityBar` / …). Containers move via `api.moveContainer`. Set `layout: { editorToolbars: true }` (or use `DEFAULT_CANVAS_LAYOUT` / `DEFAULT_HTML_LAYOUT`) to show editor overlay toolbars. Items declare a `placement` (`top-left` | `top-center` | `top-right` | `bottom-left` | `bottom-center` | `bottom-right`) via `ToolbarBuilder.placement(...)`. Set `layout: { topBar: true }` (or use `DEFAULT_EMAIL_LAYOUT`) to show the optional shell header; plugins declare `TopBarContribution` and `ctx.registerTopBar(id, Component)`. Highest `priority` wins; later equal priority overwrites. No contribution = no header.

**Host rule (toolbars):** Product engines (canvas / html / email) contribute toolbar descriptors only - no React toolbar components in those packages. Workbench `EditorChrome` + `ToolbarRenderer` render shared `IconButton` / `DropdownMenu` chrome. Product **top bars** (email mode switch, etc.) are the exception: they are optional layout + `TopBarContribution`, not a `WorkbenchShell` prop.

## Property pane flow

```mermaid
flowchart LR
  subgraph plugins [Plugins]
    PropertyPlugin[PropertyPaneContribution]
  end
  subgraph corePkg [core]
    PropertyBuilder[PropertyBuilder]
    Builder[PropertyPaneBuilder]
    GenericCtx[createPropertyHostContext]
    Factory[LayerPropertiesPaneFactory]
  end
  subgraph shell [workbench]
    Visitor[Property field renderers]
  end
  PropertyPlugin -->|buildDescriptor| Builder
  PropertyBuilder -->|layer.properties| Factory
  GenericCtx --> Visitor
```

1. Plugins subclass `PropertyPaneContribution` and implement `buildDescriptor()` via `createPropertyPane()`.
2. `LayerDefinition.properties()` returns core `PropertySectionDescriptor[]`.
3. Controller merges plugin panes + synthesized layer panes into inspector views (`content.kind: 'properties'`).
4. Shell renders via `ViewPane` + `PropertyContentRenderer` (shell-internal - hosts must not import these).

Field descriptors, kinds, and `layout`: [property-fields.md](property-fields.md) (including layout-node `when` for conditional rows/blocks).

**Editor diagnostics:** global debug flag (`openenvx:debug`, `WorkbenchControllerOptions.debug`, `api.setEditorDebug`) drives `[OpenEnvx]` console groups (e.g. `property.when` token resolution, `property.field` descriptor validation). See [property-fields.md](property-fields.md#diagnostics-global-editor-debug).

**Naming:** **Inspector** = default secondary container (`workbench.inspector`) hosting canvas/HTML layer property views. Generic form content is a `properties` view + `PropertyPane` / `PropertyPath` in any container.

`PropertyPaneContribution` is for **built-in** workbench plugins (e.g. canvas transform panes) merged into the Inspector - not for embed/dashboard product hosts. Product hosts use `ViewContribution.buildProperties()`.

## External host mount (DI isolation)

Trusted OOP plugins activate on `PluginManager` with full `WorkbenchPluginContext`. Sandbox and embed hosts mount on **narrow surfaces** that never expose `InstantiationService`:

```text
WorkbenchApi.mountSandboxHost / mountEmbedPanelHost
        → ExternalHostMount
        → SandboxHostSurface / EmbedPanelHostSurface
        → workbench SandboxExtensionHost / EmbedPanelHost
```

Isolates / `panel:*` parents never see the surfaces. This is DI isolation, not registry isolation: sandbox may still register run commands; embed may register workbench contributions so the shell can render them. Details: [extensions.md](extensions.md), [Plugin-boundaries.md](../../Plugin-boundaries.md).

## Composable app layout (custom shell)

```text
PlaygroundShell
├── WorkbenchProvider          ← @openenvx/core/react
├── EditorPaneHost             ← app-owned: CanvasHostProvider + CanvasEditor
├── PlaygroundToolbar          ← app-owned
└── Inspector / sidebars       ← app-owned React UI
```

Most product apps skip this and use `WorkbenchShell` from studio / html-studio.

## Related

- Visual shell design notes (tokens only): [packages/workbench/Design.md](../../packages/workbench/Design.md)
- Property field API: [property-fields.md](property-fields.md)
- Extension trust: [Plugin-boundaries.md](../../Plugin-boundaries.md)
