# Changelog

All notable changes to this project are documented here.
Published npm packages (`@openenvx/html-studio`, `@openenvx/email-studio`, `@openenvx/canvas-studio`) share one version per GitHub Release.

## [0.1.2] - 2026-08-30

### Other

- Update npm publish instructions and workflow

- Revised the `PUBLISHING.md` documentation to clarify the use of `NPM_TOKEN` for publishing and the option for npm trusted publishing.
- Updated the GitHub Actions workflow to use `actions/setup-node@v7` and ensure the current npm CLI is installed.
- Enhanced the verification step for package repository metadata to align with npm trusted publishing requirements.

These changes improve the clarity and reliability of the publishing process.

- V0.1.6

- Standardize punctuation and formatting across documentation

- Updated various markdown files to replace em dashes with hyphens for consistency.
- Revised the formatting of lists and instructions to ensure uniformity in style.
- Enhanced clarity in the `PUBLISHING.md` and `README.md` files regarding package publishing and documentation references.

These changes improve the readability and professionalism of the documentation.

## [0.1.5] - 2026-08-30

### Other

- Update npm trusted publishing instructions and repository URLs

- Enhanced the `PUBLISHING.md` documentation to clarify the configuration for npm trusted publishing, including exact matching requirements for repository URLs.
- Added a verification step in the `release.yml` workflow to ensure that each package's `repository.url` matches the expected format for trusted publishing.
- Updated `package.json` files for `html-studio`, `email-studio`, and `canvas-studio` to correct the repository URLs to the new format.

These changes improve the reliability of the publishing process and ensure compliance with npm's trusted publishing requirements.

- V0.1.4

- V0.1.5

## [0.1.3] - 2026-08-30

### Other

- Enhance release workflow with skip_bump option

- Added a `skip_bump` input to the release workflow, allowing users to retry a failed publish without incrementing the version.
- Updated the `release.yml` to conditionally skip version bumping, changelog updates, and tagging based on the `skip_bump` input.
- Clarified publishing instructions in `PUBLISHING.md` to include guidance on using the `skip_bump` feature.

These changes improve the flexibility and reliability of the release process.

- V0.1.3

## [0.1.2] - 2026-08-30

### Bug Fixes

- Fix

- Fix

- Fix

- Fix

- Fix

- Fix


### Documentation

- Update AGENTS.md with guidelines for commit messages and add esbuild dependency


### Other

- Initial commit

- Version packages

- Correct versioning in the npm

- Version packages

- Correct versioning in the npm

- Version packages

- Correct versioning in the npm

- Version packages

- Add simple demo playground

- Fixes

- Fixes

- Fixes

- Cleanup

- Version packages

- Separate smart guides from the canvas

- Small cleanup

- Remove pro plugin

- Bump actions/setup-node from 4 to 6

Bumps [actions/setup-node](https://github.com/actions/setup-node) from 4 to 6.
- [Release notes](https://github.com/actions/setup-node/releases)
- [Commits](https://github.com/actions/setup-node/compare/v4...v6)

---
updated-dependencies:
- dependency-name: actions/setup-node
  dependency-version: '6'
  dependency-type: direct:production
  update-type: version-update:semver-major
...

Signed-off-by: dependabot[bot] <support@github.com>

- Merge pull request #2 from openenvx/dependabot/github_actions/actions/setup-node-6

chore(deps): bump actions/setup-node from 4 to 6

- Bump github/codeql-action from 3 to 4

Bumps [github/codeql-action](https://github.com/github/codeql-action) from 3 to 4.
- [Release notes](https://github.com/github/codeql-action/releases)
- [Changelog](https://github.com/github/codeql-action/blob/main/CHANGELOG.md)
- [Commits](https://github.com/github/codeql-action/compare/v3...v4)

---
updated-dependencies:
- dependency-name: github/codeql-action
  dependency-version: '4'
  dependency-type: direct:production
  update-type: version-update:semver-major
...

Signed-off-by: dependabot[bot] <support@github.com>

- Merge pull request #3 from openenvx/dependabot/github_actions/github/codeql-action-4

chore(deps): bump github/codeql-action from 3 to 4

- Bump the dev-dependencies group across 1 directory with 4 updates

Bumps the dev-dependencies group with 4 updates in the / directory: [eslint-plugin-github](https://github.com/github/eslint-plugin-github), [typescript](https://github.com/microsoft/TypeScript), [ultracite](https://github.com/haydenbleasel/ultracite) and [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/node).


Updates `eslint-plugin-github` from 6.0.0 to 6.1.1
- [Release notes](https://github.com/github/eslint-plugin-github/releases)
- [Commits](https://github.com/github/eslint-plugin-github/compare/v6.0.0...v6.1.1)

Updates `typescript` from 6.0.3 to 7.0.2
- [Release notes](https://github.com/microsoft/TypeScript/releases)
- [Commits](https://github.com/microsoft/TypeScript/commits)

Updates `ultracite` from 7.9.2 to 7.9.3
- [Release notes](https://github.com/haydenbleasel/ultracite/releases)
- [Commits](https://github.com/haydenbleasel/ultracite/compare/ultracite@7.9.2...ultracite@7.9.3)

Updates `@types/node` from 22.20.1 to 26.1.1
- [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
- [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/node)

---
updated-dependencies:
- dependency-name: "@types/node"
  dependency-version: 26.1.1
  dependency-type: direct:development
  update-type: version-update:semver-major
  dependency-group: dev-dependencies
- dependency-name: eslint-plugin-github
  dependency-version: 6.1.1
  dependency-type: direct:development
  update-type: version-update:semver-minor
  dependency-group: dev-dependencies
- dependency-name: typescript
  dependency-version: 7.0.2
  dependency-type: direct:development
  update-type: version-update:semver-major
  dependency-group: dev-dependencies
- dependency-name: ultracite
  dependency-version: 7.9.3
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dev-dependencies
...

Signed-off-by: dependabot[bot] <support@github.com>

- Merge pull request #8 from openenvx/dependabot/bun/dev-dependencies-5abc16f48e

chore(deps-dev): bump the dev-dependencies group across 1 directory with 4 updates

- Refactor canvas architecture and update dependencies

- Updated the canvas architecture to improve the integration between `@openenvx/canvas` and `@openenvx/headless`, including the introduction of `CanvasHostProvider` for better context management.
- Removed the `AbsoluteEditorPane` and related contributions, streamlining the editor pane structure.
- Updated TypeScript dependency to `catalog:dev` across multiple package.json files.
- Enhanced documentation in `extension-guide.md` to clarify the roles of OSS and enterprise packages.
- Cleaned up unused configurations and contributions in the canvas package.

This commit aims to enhance the overall structure and maintainability of the canvas engine while ensuring compatibility with the latest development practices.

- Enhance canvas editor functionality and improve TypeScript configurations

- Updated `.gitignore` to exclude TypeScript emit artifacts from source directories while preserving specific type definitions.
- Added `@openenvx/headless` as a dependency in multiple package.json files and set it as a peer dependency.
- Refactored `AbsoluteEditorPane` to utilize the new `hoveredLayerId` state, improving layer interaction capabilities.
- Introduced `CanvasHoverOutline` component for visual feedback on hovered layers in the canvas.
- Enhanced `CanvasStage` and related components to support layer hover functionality, including event handling for pointer interactions.

These changes aim to improve the user experience in the canvas editor by providing better layer management and visual cues.

- Version packages

- Implement interaction state management and update event handling

- Refactored the `AbsoluteEditorPane` to access `hoveredLayerId` from the new `interaction` state, enhancing layer interaction capabilities.
- Introduced `DidChangeInteraction` event in `WorkbenchEvents` to handle changes in interaction state.
- Updated `WorkbenchController` to manage interaction state and emit relevant events, improving responsiveness to user actions.
- Modified tests to validate interaction state changes and ensure proper event handling.

These changes aim to improve the user experience by providing a more robust interaction model within the canvas editor.

- Version packages

- Enhance canvas functionality with new layer management capabilities

- Introduced new layer write modes (`locked`, `free`, `content`, `properties`) to improve layer management and editing capabilities.
- Refactored various commands and functions to utilize the new layer write modes, enhancing the logic for layer selection, transformation, and editing.
- Updated the canvas editor and related components to support the new layer management features, improving user interaction and experience.
- Added template policies to control layer operations such as insertion, deletion, and duplication, providing more granular control over layer behavior.

These changes aim to enhance the overall functionality and user experience within the canvas editor.

- Version packages

- Enhance playground export functionality and introduce driver image support

- Added `PlaygroundExportPlugin` to facilitate exporting scenes in various formats (SVG, PNG, JPG) from the playground.
- Updated `PlaygroundToolbar` to include export buttons for the new export formats.
- Integrated `DriverImagePlugin` into the playground controller for enhanced image handling capabilities.
- Implemented `flattenSceneToIR` and `renderIrDocument` functions to support rendering scenes to intermediate representations and SVG documents.
- Added tests for the new flattening and rendering functionalities to ensure reliability.

These changes aim to improve the export capabilities and overall functionality of the playground environment.

- Implement grouping functionality in canvas editor

- Added new commands for grouping (`GroupSelectionCommand`), ungrouping (`UngroupSelectionCommand`), and inserting groups (`InsertCanvasGroupCommand`) to enhance layer management.
- Updated the `CanvasStageLayerGroup` component to support rendering grouped layers with visual indicators.
- Introduced a new `CanvasGroupLayer` type to encapsulate grouped layers and their properties.
- Enhanced the playground toolbar with new actions for grouping and ungrouping layers.
- Implemented utility functions for managing layer transformations and grouping logic.
- Added tests to validate the new grouping and ungrouping functionalities, ensuring reliability and correctness.

These changes aim to improve the user experience by providing robust layer grouping capabilities within the canvas editor.

- Bump lucide-react from 1.23.0 to 1.24.0

---
updated-dependencies:
- dependency-name: lucide-react
  dependency-version: 1.24.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
...

Signed-off-by: dependabot[bot] <support@github.com>

- Merge pull request #10 from openenvx/dependabot/bun/lucide-react-1.24.0

chore(deps): bump lucide-react from 1.23.0 to 1.24.0

- Bump the dev-dependencies group across 1 directory with 2 updates

Bumps the dev-dependencies group with 2 updates in the / directory: [turbo](https://github.com/vercel/turborepo) and [typescript](https://github.com/microsoft/TypeScript).


Updates `turbo` from 2.10.4 to 2.10.5
- [Release notes](https://github.com/vercel/turborepo/releases)
- [Changelog](https://github.com/vercel/turborepo/blob/main/RELEASE.md)
- [Commits](https://github.com/vercel/turborepo/compare/v2.10.4...v2.10.5)

Updates `typescript` from 6.0.3 to 7.0.2
- [Release notes](https://github.com/microsoft/TypeScript/releases)
- [Commits](https://github.com/microsoft/TypeScript/commits)

---
updated-dependencies:
- dependency-name: turbo
  dependency-version: 2.10.5
  dependency-type: direct:development
  update-type: version-update:semver-patch
  dependency-group: dev-dependencies
- dependency-name: typescript
  dependency-version: 7.0.2
  dependency-type: direct:development
  update-type: version-update:semver-major
  dependency-group: dev-dependencies
...

Signed-off-by: dependabot[bot] <support@github.com>

- Merge pull request #11 from openenvx/dependabot/bun/dev-dependencies-151e55169e

chore(deps-dev): bump the dev-dependencies group across 1 directory with 2 updates

- Enhance canvas layer interaction and data management

- Updated `CanvasLayerInteractionContribution` to support custom handles and drag events, improving user interaction with canvas layers.
- Introduced `dataPatch` functionality in layer transformation commands to allow for concurrent updates to layer data alongside transformations.
- Added new utility functions for resolving handle drag targets and managing layer handles, enhancing the overall interaction model.
- Refactored `CanvasStage` and related components to integrate new handle management features and improve performance.
- Implemented tests for new functionalities to ensure reliability and correctness.

These changes aim to provide a more intuitive and responsive user experience within the canvas editor, particularly in handling layer interactions and transformations.

- Enhance layer interaction and preview functionality

- Introduced `tryActivateLayerInteraction` function to manage layer activation and interaction previews, improving user experience during layer selection.
- Updated `CanvasStageLayerGroup` to handle interaction previews and layer activation more effectively, ensuring smoother transitions between editing and interaction states.
- Enhanced `CanvasStageRuntime` with methods to enter and exit interaction previews, allowing for better state management.
- Added new types and context for layer activation to support the updated interaction model.
- Implemented tests for interaction preview functionality to ensure reliability and correctness.

These changes aim to provide a more intuitive and responsive interaction model within the canvas editor, particularly for layer management and editing.

- Merge pull request #12 from openenvx/new-contribution-image-layers

Enhance canvas layer interaction and data management

- Version packages

- Add Workbench views and tree provider contributions

- Introduced a new structure for Workbench views, aligning with VS Code's model using `ViewContribution` and `ViewTreeProviderContribution`.
- Implemented examples for declaring and registering views and tree providers, enhancing the extensibility of the Workbench.
- Updated the `WorkbenchController` to utilize a `ViewProviderRegistry`, allowing for better management of view providers.
- Added tests to validate the behavior of view contributions, including handling of visibility based on context keys and prioritization of tree providers.

These changes enhance the plugin architecture, enabling more flexible and powerful view management within the Workbench.

- Version packages

- Streamline Workbench provider registrations and remove deprecated contributions

- Version packages

- Enhance core and headless architecture with EditorRuntime integration

- Introduced `EditorRuntime` to manage core services and plugin lifecycle, improving dependency injection and context management.
- Updated `PluginManager` to utilize `EditorRuntime`, streamlining plugin context creation and service registration.
- Enhanced documentation to reflect new architecture and usage patterns for extending the OpenEnvx canvas engine.
- Added examples for custom editor hosts and improved keybinding handling in the workbench.

These changes significantly improve the extensibility and maintainability of the OpenEnvx framework.

- Simplify WorkbenchController by integrating SceneStore and EditorService into EditorRuntime

- Removed direct references to SceneStore and EditorService in WorkbenchController.
- Updated constructor to instantiate SceneStore and EditorService within EditorRuntime, enhancing encapsulation.
- Adjusted methods to retrieve scene and editor instances from EditorRuntime, streamlining state management and improving code clarity.

These changes contribute to a cleaner architecture and better separation of concerns within the WorkbenchController.

- Progress

- Progress

- Progress

- Integrate `@openenvx/schema` for scene validation and enhance scene context management

- Added `@openenvx/schema` to manage scene document structure and validation, improving data integrity.
- Introduced `isValidSceneContext` function to validate scene documents within the agent service.
- Updated scene context handling in various components, ensuring consistent usage of active page and selection states.
- Enhanced tests to cover new schema validations and context management features.

These changes significantly improve the robustness of scene handling and validation across the application.

- Progress

- Enhance page management and cloning functionality in canvas

- Implemented full page CRUD operations, allowing users to add, duplicate, and remove pages with proper context management.
- Updated the cloning mechanism to remap nested layer IDs during duplication, ensuring unique identifiers for cloned elements.
- Enhanced command palette and context menu to include new page actions, improving user accessibility to page management features.
- Added comprehensive tests for page commands, ensuring reliability and correctness of the new functionalities.

These changes significantly improve the usability and functionality of the canvas editor, aligning with user expectations for a robust design tool.

- Implement inline renaming for pages and layers in canvas

- Added functionality for inline renaming of pages and layers, enhancing user experience and accessibility.
- Updated the canvas sidebar to support rename commands, allowing users to edit labels directly.
- Enhanced the schema to include optional display names for layers, improving clarity in the layers panel.
- Implemented tests for rename commands to ensure reliability and correctness of the new features.

These changes significantly improve the usability of the canvas editor, aligning with user expectations for intuitive design tools.

- Implement grid functionality with toggle and snapping features

- Added grid settings management, allowing users to enable/disable grid overlays and set grid size.
- Implemented snapping behavior for drag and resize operations, enhancing precision in layer positioning.
- Updated canvas editor to include grid toggle button in the toolbar for easy access.
- Enhanced overlay rendering to include grid lines based on user settings, improving visual alignment tools.
- Added tests for grid snapping and toggle functionality to ensure reliability.

These changes significantly enhance the usability and functionality of the canvas editor, aligning with user expectations for precise design tools.

- Implement ruler guides and measurement features in canvas

- Added functionality for user-placed guides, allowing users to drag from rulers to create alignment aids.
- Enhanced ruler settings management, enabling toggling of rulers and clearing of guides for specific pages.
- Updated canvas editor to integrate ruler guides, improving precision in layer positioning and design alignment.
- Implemented tests for ruler commands and guide management to ensure reliability and correctness of new features.

These changes significantly enhance the usability and functionality of the canvas editor, aligning with user expectations for precise design tools.

- Implement bleed, trim, and crop marks functionality in export service

- Added support for bleed and safe margins in the schema, enhancing print layout capabilities.
- Implemented crop marks in SVG/PDF exports when bleed is greater than zero, improving print production quality.
- Updated canvas overlays to visually represent bleed edges, aiding user awareness during design.
- Enhanced export service to include bleed information in response headers and processing logic.
- Added comprehensive tests to ensure correct application of bleed and crop marks in various export scenarios.

These changes significantly enhance the export functionality, aligning with user expectations for professional print outputs.

- Enhance text rendering with curved text support

- Implemented curved text functionality, allowing text to follow an arc path based on user-defined curve degrees.
- Updated the rich text layer to support curve properties, enhancing design flexibility.
- Added tests for curved text rendering and related utilities to ensure reliability.
- Enhanced font management with a new font registration command and system font catalog integration.

These changes significantly improve the text rendering capabilities of the canvas editor, aligning with user expectations for advanced typography features.

- Enhance template functionality with dynamic data binding and image fitting

- Implemented dynamic templates allowing modifications to named layers via a new Template Data Panel.
- Added support for image fitting options (cover, contain, fill) with focal point adjustments in the canvas image layer.
- Introduced text auto-fitting capabilities, enabling shrink-to-fit functionality for text layers.
- Enhanced the schema to include new properties for image and text layers, improving design flexibility.
- Updated documentation to reflect new template API contract and usage examples.

These changes significantly improve the template management and rendering capabilities, aligning with user expectations for dynamic and responsive design tools.

- Progress

- Progress

- Progress

- Add version history panel and integrate Radix tabs

- Introduced a new VersionPanel component to display version history in the canvas demo.
- Integrated Radix UI tabs for secondary sidebar navigation, enhancing user experience with organized view containers.
- Updated bun.lock and package.json to include the @radix-ui/react-tabs dependency.
- Enhanced the workbench to support dynamic view locations and active container management.

These changes improve the usability and organization of the canvas demo, aligning with user expectations for intuitive design tools.

- Progress

- Update @xmazu/openenvxee-studio to version 0.1.8 and enhance plugin authoring capabilities

- Updated the version of @xmazu/openenvxee-studio to 0.1.8 in package.json and bun.lock.
- Re-exported `@openenvx/core` and `@openenvx/headless` in the studio package to facilitate plugin authoring without requiring private workspace packages.
- Updated documentation to reflect the new re-exports and their roles in plugin development.

These changes improve the usability of the studio package for host applications, streamlining the plugin development process.

- Enhance proposal application and error handling in ChatPanel

- Added support for applying proposed changes in the ChatPanel, including error handling for failed proposals.
- Introduced a new state to manage application errors, improving user feedback during proposal application.
- Updated the applyProposedChanges function to skip invalid changes while applying valid ones, enhancing robustness.
- Added tests to ensure correct behavior of the proposal application process and error handling.

These changes improve the user experience by providing clearer feedback and more reliable proposal application in the chat interface.

- Enhance media tools and asset management in agent service

- Introduced new media tools for searching Unsplash and Iconify, enabling users to easily find and ingest media assets.
- Implemented asset ingestion functionality, allowing images to be stored in R2 and served via a dedicated endpoint.
- Enhanced the agent service to support new media and image generation subagents, improving the overall media handling capabilities.
- Updated documentation and tests to reflect the new features and ensure reliability.

These changes significantly improve the media management experience within the agent service, aligning with user needs for dynamic content integration.

- Introduce HTML demo application and enhance canvas architecture

- Added a new HTML demo application to showcase the HTML block editor capabilities, including a dedicated index.html and main.tsx for rendering.
- Updated the canvas architecture to support HTML-specific features, including the introduction of `@openenvx/html` and `@xmazu/openenvxee-html-studio` packages.
- Enhanced the agent workflow documentation to clarify git usage and pre-commit checks.
- Refactored page rules and presets, moving related logic from `@openenvx/schema` to `@openenvx/canvas`, improving modularity and maintainability.
- Updated various components and tests to reflect the new architecture and ensure compatibility with the HTML demo.

These changes significantly enhance the framework's capabilities for HTML editing and improve the overall development experience within the OpenEnvx ecosystem.

- Enhance HTML block editor with rich text capabilities and new commands

- Updated the HTML block editor to support rich text editing, allowing for on-canvas and HTML-block formatting options such as bold, italic, and underline.
- Refactored block data structure to use `html` instead of `text`, improving consistency across components.
- Introduced new commands for moving and duplicating HTML blocks, enhancing user interaction and editing capabilities.
- Added context menu support for HTML blocks, streamlining the editing process.
- Updated tests and documentation to reflect the new features and ensure reliability.

These changes significantly enhance the functionality and user experience of the HTML block editor within the OpenEnvx ecosystem.

- Implement usePresence hook and integrate into UI components

- Introduced the `usePresence` hook to manage component visibility during exit animations, enhancing user experience with smoother transitions.
- Added tests for the `usePresence` hook to ensure correct behavior in various states.
- Integrated the `usePresence` hook into multiple UI components, including `ConfirmDialog`, `DropdownMenu`, `Popover`, and `CommandPaletteRenderer`, to manage their visibility based on state.
- Updated CSS for overlay surfaces to support new animation styles and improve visual consistency across components.
- Removed outdated CSS rules related to visibility management, streamlining styles.

These changes significantly enhance the responsiveness and visual appeal of the UI components within the workbench.

- Progress

- Enhance HTML block editor with drag-and-drop functionality and new context features

- Added support for drag-and-drop reordering of HTML blocks, improving user interaction and editing capabilities.
- Introduced a BlockEditorContext to manage block selection and editing states, streamlining the editing process.
- Implemented a BlockSelectionMenu for block actions such as duplicate and remove, enhancing usability.
- Updated CSS styles for better visual feedback during drag-and-drop operations and block selection.
- Added tests for new drag-and-drop functionalities to ensure reliability and performance.

These changes significantly enhance the HTML block editor's functionality and user experience within the OpenEnvx ecosystem.

- Enhance HTML block editor with Flex and Grid layout support

- Introduced new Flex and Grid block types, allowing users to create responsive layouts within the HTML block editor.
- Updated the HTML block layout editor to support Flex and Grid configurations, improving layout management.
- Enhanced drag-and-drop functionality to allow nesting of blocks within Flex and Grid containers.
- Updated tests to cover new layout features and ensure reliable behavior during block manipulation.
- Improved documentation to reflect the new layout options and their usage.

These changes significantly enhance the layout capabilities of the HTML block editor, providing users with more flexibility in designing their content.

- Improve drag-and-drop functionality and layout handling in HTML editor

- Removed outdated dependency on @dnd-kit/utilities from package.json.
- Enhanced block-dnd.ts with new functions for managing cross-parent drafts and insert line behavior for Flex and Grid layouts.
- Updated block-dnd.test.ts to include comprehensive tests for new drag-and-drop features and cross-parent draft handling.
- Refactored block-tree-renderer.tsx to utilize new insert line logic and improve visual feedback during drag operations.
- Adjusted CSS styles for better handling of insert lines and container previews during drag-and-drop actions.

These changes significantly enhance the user experience and functionality of the HTML block editor, particularly in managing complex layouts.

- Add container nest preview functionality for Flex and Grid layouts

- Implemented the `usesContainerNestPreview` function to determine when to highlight the whole container or show insert lines based on layout type and properties.
- Enhanced tests in `block-dnd.test.ts` to cover new behavior for Flex and Grid layouts regarding wrapping and insert lines.
- Updated `HtmlEditorPane` to utilize the new container preview logic, improving drag-and-drop interactions.
- Adjusted CSS styles to refine hover outlines during drag operations, ensuring a clearer user experience.

These changes significantly improve the handling of nested layouts in the HTML block editor, enhancing usability during block manipulation.

- Enhance HTML block editor with testing and coverage improvements

- Added new test cases for various components, including block registry, block commands, and block selection menu, to ensure robust functionality.
- Implemented coverage reporting using @vitest/coverage-v8 to track test coverage metrics.
- Updated package.json and turbo.json to include coverage scripts and dependencies.
- Enhanced the vitest configuration to support coverage thresholds and improved testing environment setup.

These changes significantly improve the reliability and maintainability of the HTML block editor by ensuring comprehensive test coverage and robust testing practices.

- Implement named slots for composite HTML blocks

- Introduced named slots in `@openenvx/html` blocks, allowing real nested part layers to remain invisible in the Layers tree.
- Updated `HtmlEditorPane` to support inline editing of slot parts and generated inspector fields for better usability.
- Enhanced the HTML block layout editor to accommodate composite blocks with named slots, improving the visual block tree and drag-and-drop functionality.
- Added built-in composite blocks like `html.hero` and `html.button` to streamline block creation.
- Updated tests and documentation to reflect these new features and ensure reliability.

These changes significantly enhance the flexibility and usability of the HTML block editor, providing users with more powerful layout options.

- Introduce @openenvx/plugin-protocol package for declarative embed panels

- Added the `@openenvx/plugin-protocol` package, which includes types and utilities for creating declarative plugin panel trees.
- Implemented a `h`/jsx runtime for building serializable trees and message unions for communication between host and parent.
- Introduced validation functions for plugin trees to ensure structure and size constraints.
- Updated documentation to reflect the new package and its usage in the OpenEnvx ecosystem.
- Enhanced existing packages to integrate with the new protocol, improving modularity and extensibility.

These changes significantly enhance the plugin architecture, enabling more flexible and powerful panel integrations.

- Rename and update plugin protocol package to @xmazu/openenvxee-plugin-protocol

- Renamed the `@openenvx/plugin-protocol` package to `@xmazu/openenvxee-plugin-protocol` to reflect the new namespace.
- Updated all references in documentation, code, and configuration files to the new package name.
- Incremented the version of the plugin protocol package to 0.1.3.
- Enhanced the release process to include the new package name and ensure proper publishing to the registry.
- Adjusted related packages and scripts to maintain compatibility with the renamed protocol.

These changes improve clarity and organization within the project, aligning with the new naming conventions.

- Update HTML editor interactions and enhance block rendering

- Modified the text editing instructions in the demo scene for clarity.
- Updated the block rendering logic to support children elements, allowing for better integration of editable content within heading and text blocks.
- Changed event handling from double-click to single-click for starting edits on blocks, improving user experience.
- Added tests to ensure that editing retains the correct heading structure and styles during interactions.
- Introduced a normalization function for committed rich text HTML to handle common formatting issues.

These changes enhance the usability and functionality of the HTML block editor, providing a more intuitive editing experience.

- Implement text layer content fitting and enhancements

- Introduced functions to fit canvas text layers to their content, allowing for dynamic resizing based on text length and formatting.
- Updated the `applyModificationsWithTextFit` function to remasure text layers after modifications, ensuring accurate height adjustments.
- Enhanced the `fitCanvasTextLayerToContent` function to support different fitting modes (height and box) for better layout control.
- Added tests for the new fitting functionalities to ensure reliability and correctness in various scenarios.
- Updated relevant components and documentation to reflect these changes, improving the overall text handling experience in the canvas.

These enhancements significantly improve the usability and flexibility of text layers within the canvas, providing a more intuitive editing experience.

- Enhance HTML editor with device preview and zoom functionality

- Introduced a new  component for managing device presets and zoom levels in the HTML editor.
- Implemented logic to dynamically adjust the artboard width based on selected device presets and zoom settings.
- Added functionality for auto-zoom and manual zoom adjustments, improving the editing experience for users.
- Updated the  to integrate the new toolbar, allowing seamless switching between device views and zoom levels.
- Enhanced tests to cover the new device preview and zoom features, ensuring reliability and usability.

These enhancements significantly improve the HTML editor's functionality, providing users with better control over their design previews.

- Introduce plugin boundaries documentation and enhance plugin protocol integration

- Added a new  file to outline the trust model and interaction between internal and external plugins.
- Updated  to reference the new plugin boundaries documentation for better guidance on plugin development.
- Enhanced  to include information about the plugin boundaries and their implications for security and trust.
- Incremented the version of  to 0.2.0 and updated related package dependencies.
- Introduced new functions and types in the headless package to support the plugin protocol, including mappers for inspector panes and menus.
- Added tests for the new plugin protocol features to ensure reliability and correctness.

These changes improve the overall architecture and security of the plugin system, providing clearer guidelines for developers and enhancing the integration of plugins within the editor.

- Enhance rich text editing capabilities and introduce new commands

- Added support for inline color and font family in rich text layers, improving text styling options.
- Updated the rich text editor to parse and apply styles from HTML spans, allowing for more dynamic text formatting.
- Introduced new commands for managing canvas guides, including adding, moving, and removing guides, enhancing layout control.
- Implemented grid size settings with presets for better user experience in canvas editing.
- Enhanced tests for new features to ensure reliability and correctness in rich text handling and guide management.

These improvements significantly enhance the editing experience, providing users with more flexibility and control over text and layout elements.

- Enhance workbench layout management and introduce layout persistence

- Updated  to support independent visibility for activity bar and sidebars, allowing for more flexible UI configurations.
- Introduced  for optional persistence of layout settings across sessions, enhancing user experience.
- Added new methods in  for managing layout visibility and container order, improving layout control.
- Enhanced documentation to reflect changes in layout management and persistence features.
- Updated dependencies in  to include new utilities for drag-and-drop functionality.

These improvements significantly enhance the workbench's layout management capabilities, providing users with greater control and a more personalized experience.

- Add quicks integration

- Enhance QuickJS sandbox integration and UI message handling

- Updated the QuickJS sandbox implementation to ensure each extension runs in a dedicated Web Worker, improving isolation and performance.
- Introduced new capabilities for managing UI messages between the sandboxed environment and the host, including size limits and validation.
- Enhanced the sandbox extension controller to support UI message delivery, ensuring messages are processed correctly without exceeding defined limits.
- Added tests to validate the new UI message handling and sandbox capabilities, ensuring reliability and adherence to constraints.
- Updated documentation to reflect changes in sandbox capabilities and UI message policies, providing clearer guidance for developers.

These enhancements significantly improve the security and functionality of the QuickJS sandbox, offering a more robust environment for plugin development.

- Enhance sandbox extension capabilities and UI integration

- Updated the sandbox extension framework to support new widget types and improved state management for on-canvas elements.
- Introduced a new `postToUI` method for better communication between the sandbox and the host, allowing for more dynamic UI interactions.
- Enhanced the `SandboxExtensionController` to manage UI context and selection updates, ensuring a seamless user experience.
- Added a new demo HTML file showcasing React integration within the sandbox environment, providing a reference for developers.
- Refactored existing code to improve clarity and maintainability, including renaming variables for consistency.

These changes significantly enhance the functionality and usability of the sandbox extensions, providing developers with more robust tools for creating interactive plugins.

- Progress

- Progress

- Enhance external host integration and icon management

- Updated the `WorkbenchShell` to support mounting external hosts via a new `mountExternalHosts` prop, improving flexibility for sandbox and embed panel integration.
- Refactored the `ExternalHostMount` class to streamline the mounting process for sandbox and embed panels, enhancing code maintainability.
- Introduced `unregister` functionality in the `IconRegistry` to allow for better management of icon registrations, ensuring icons are properly disposed of when no longer needed.
- Enhanced the `EmbedPanelHost` and `SandboxExtensionHost` to manage surface disposables, improving resource cleanup during unmounting.
- Added tests to validate the new icon unregistering feature and ensure proper disposal of resources in external hosts.

These changes significantly improve the integration and management of external hosts within the workbench, providing a more robust and efficient development environment.

- Merge pull request #32 from xmazu/new-isolation

New isolation

- Progress

- Update package descriptions and versions, refactor sandbox UI components

- Corrected the description formatting in `plugin-protocol` and `studio` package.json files.
- Updated the version of the `studio` package to 0.3.0.
- Refactored the sandbox UI components by replacing the modal with a new panel implementation, enhancing usability and interaction.
- Added new styles for the sandbox UI panel and implemented tests to ensure functionality and responsiveness.

These changes improve the overall user experience and maintainability of the sandbox UI components.

- Update package names and improve documentation

- Renamed packages from  to  for consistency across the codebase.
- Updated references in documentation, including , , and , to reflect the new package names.
- Enhanced the  to clarify the distinction between internal and published packages.
- Adjusted build and publish scripts in  to accommodate the new package structure.
- Improved type checking and linting commands across various applications to ensure consistency and reliability.

These changes streamline the package management process and enhance clarity for developers working with the codebase.

- Update precommit script and package versions, enhance documentation

- Modified the `precommit` script to streamline linting and type checking processes.
- Updated TypeScript version references in multiple package.json files to use `catalog:dev`.
- Enhanced documentation in `AGENTS.md` and `FEATURES.md` to clarify command usage and feature status.
- Added a new `tsconfig.json` file for improved TypeScript configuration across the project.
- Removed unused font dependencies from `knip.json` and `package.json`.

These changes improve the development workflow and ensure consistency in package management and documentation.

- Add QR code layer support and update related packages

- Introduced a new `canvas.qr` layer for QR code generation, including properties for URL, foreground, background, error correction, and margin.
- Updated package versions for `plugin-protocol`, `preview`, `schema`, and `studio` to 0.5.4 to reflect the addition of QR code functionality.
- Enhanced documentation in `FEATURES.md` to include details about the new QR code layer.
- Added tests for QR code encoding functionality to ensure reliability and correctness.

These changes enhance the canvas capabilities by allowing users to insert and customize QR codes, improving the overall feature set of the application.

- Implement typing target detection and enhance input components

- Introduced `isTypingTarget` utility to determine if the current focus is on a text-like input, improving keyboard shortcut handling.
- Updated `CanvasEditor` to utilize `isTypingTarget` for better paste event management.
- Enhanced `NumericInput` and `TextInput` components with debouncing functionality for improved performance during user input.
- Refactored `NumericControl` and `InputGroup` to streamline rendering logic and ensure consistent behavior across numeric inputs.
- Added tests for `isTypingTarget` and input components to ensure reliability and correctness.

These changes enhance user experience by providing more responsive input handling and better integration of keyboard shortcuts within editable fields.

- Progress

- Progress

- Progress

- Progress

- Progress

- Merge pull request #34 from xmazu/new-sandbox

New sandbox

- Rename packages for consistency and update documentation

- Renamed all published packages from `@xmazu/openenvxee-*` to `@openenvx/*` for uniformity across the codebase.
- Updated references in documentation files, including `AGENTS.md`, `FEATURES.md`, and `PUBLISHING.md`, to reflect the new package names.
- Adjusted package dependencies in `package.json`, `bun.lock`, and other configuration files to ensure proper resolution.
- Enhanced the `README.md` to clarify the distinction between internal and published packages.
- Improved type checking and linting commands across various applications for consistency and reliability.

These changes streamline the package management process and enhance clarity for developers.

- Add wedding menu widget and enhance HTML demo

- Introduced a new `menu.widget` for creating editable wedding menus, allowing users to add sections and dishes dynamically.
- Updated the HTML demo to include the new wedding menu widget, with a dedicated scene for demonstration.
- Enhanced the `FEATURES.md` to reflect the addition of the wedding menu functionality.
- Improved the handling of nested widget values in the workbench controller to ensure consistent updates and undo functionality.
- Added tests to verify the correct behavior of the new widget and its integration within the scene.

These changes expand the application's capabilities by providing a customizable wedding menu feature, enhancing user experience in the HTML demo.

- Enhance curved text functionality and layout handling

- Updated the curved text feature to allow for dynamic adjustments, enabling text to hug the measured TextPath bounds.
- Implemented new functions for estimating curved text dimensions and layout, ensuring consistent behavior during text modifications.
- Refactored the text fitting logic to maintain horizontal centering while adjusting for curve changes.
- Enhanced the `FEATURES.md` to reflect the updated capabilities of curved text, including detailed descriptions of the new layout behavior.
- Added tests to verify the accuracy of the new curved text layout and fitting functionalities.

These changes improve the text rendering experience by providing more precise control over curved text layouts, enhancing overall usability in the canvas application.

- Implement transformer rotate anchor functionality and related commands

- Added a custom rotate anchor for the transformer, enhancing the user experience during rotation operations.
- Introduced new functions for managing the rotate anchor's style and SVG representation.
- Implemented commands for setting layer rotation and rotating layers, ensuring proper updates to layer transforms.
- Enhanced the rich text transform strategy to accommodate the new rotate anchor functionality.
- Added tests to verify the behavior of the new rotation commands and the styling of the rotate anchor.

These changes improve the canvas's interactive capabilities, allowing for more intuitive layer manipulation and enhanced visual feedback during transformations.

- Enhance canvas handle interactions and cursor management

- Introduced cursor management for resize handles, allowing dynamic cursor changes based on handle position and rotation.
- Added mouse event handlers for `onMouseEnter` and `onMouseLeave` to update the cursor style appropriately.
- Implemented a new utility function, `resolveResizeHandleCursor`, to determine the correct cursor style based on handle anchor and rotation.
- Created tests for the new cursor resolution logic to ensure accurate behavior across different handle states.

These changes improve user experience by providing visual feedback during handle interactions, making the canvas more intuitive and responsive.

- Introduce email block editor and related architecture

- Added a new package `@openenvx/driver-email` for the email block editor, including components for rendering and managing email blocks.
- Implemented the `EmailBlocksPlugin` and `EmailEditorPane` for editing email layouts, utilizing React-Email for rendering.
- Created a demo application `apps/email-demo` to showcase the email block editor functionality.
- Updated architecture documentation to include the new email driver, detailing its role and integration with existing components.
- Enhanced `FEATURES.md` to reflect the capabilities of the email block editor, including live editing and export features.

These changes expand the platform's capabilities by introducing a dedicated email editing experience, improving usability for users creating email content.

- Progress

- Progress

- Progress

- Progress

- Progress

- Merge pull request #36 from xmazu/email-editor

Email editor

- Enhance email editing capabilities with templates and image link block

- Introduced a new `imageLinkBlock` for embedding inline image links within emails, allowing for better layout control.
- Added a `TemplatesGallery` component to manage and display email templates, enhancing the user experience for selecting and loading templates.
- Implemented commands to open the templates sheet and manage context between blocks and templates.
- Updated the email template catalog with a new "Barebones" collection, including an "Activation" template for user confirmation emails.
- Enhanced the `FEATURES.md` to reflect the new email template functionalities and the image link block capabilities.

These changes significantly improve the email editing experience by providing users with more options for layout and design, facilitating the creation of visually appealing email content.

- Enhance email editor with layout and styling improvements

- Added new padding properties (`paddingX`, `paddingY`) to the `email.root` and `sectionBlock` configurations for better layout control.
- Updated the email preview frame width to 640px, ensuring a more accurate representation of email content.
- Introduced a new `EmailHtmlPreview` component for rendering email previews within an iframe, improving the editing experience.
- Implemented font management for email content, embedding the Inter font with appropriate fallbacks to ensure consistent styling across email clients.
- Enhanced tests for email rendering and preview functionalities to ensure reliability and correctness.

These updates significantly improve the email editing capabilities, providing users with more control over layout and styling while ensuring a consistent preview experience.

- Transition email scene creation to JSX-based components

- Replaced the previous `createEmailDemoScene` implementation with a new JSX-based approach, utilizing `sceneFromEmailJsx` for better readability and maintainability.
- Introduced new components (`Email`, `Section`, `Heading`, `Text`, `Button`) for constructing email layouts in a more intuitive manner.
- Updated the architecture documentation to reflect the new JSX template system, enhancing the email editing experience.
- Removed the old demo scene file to streamline the codebase and reduce redundancy.

These changes significantly improve the structure and usability of the email scene creation process, aligning with modern React practices.

- Unify email and HTML layout handling with new default layout

- Replaced `DEFAULT_WORKBENCH_LAYOUT` with `DEFAULT_HTML_LAYOUT` across email and HTML demo applications for consistency.
- Enhanced the email editor with a new `EmailToolbarContribution` for improved editing controls, including Edit/Preview toggles.
- Introduced `EmailEditorModeService` to manage editor modes (edit/preview) and synchronize context keys.
- Updated architecture documentation to reflect changes in layout handling and toolbar contributions.
- Improved email scene creation by allowing layer names to be set via JSX components, enhancing usability and clarity.

These updates streamline the layout management across different editors, providing a more cohesive user experience and aligning with modern development practices.

- Introduce Snapvelo event page demo application

- Added a new demo application for Snapvelo, showcasing an event page design using the `@openenvx/html` framework.
- Implemented core components including event hero, logo, and gallery blocks, enhancing the visual layout and interactivity.
- Created a structured scene generation function to seed the event page with predefined layers and properties.
- Developed a dedicated plugin for Snapvelo event page integration, allowing for easy registration of custom blocks.
- Included comprehensive documentation updates to reflect new architecture and naming conventions for HTML editor surfaces.

These enhancements provide a robust foundation for creating event pages, improving user experience and design flexibility.

- Rename packages and update references to new scope

- Changed package names from `@openenvx/*` to `@xmazu/openenvxee-*` across the codebase, including schema, preview, protocol, and studio packages.
- Updated all relevant import statements and documentation to reflect the new package names.
- Ensured that the changes maintain compatibility with existing functionality while aligning with the new naming conventions.

These updates improve clarity and consistency in package management, facilitating better organization within the monorepo.

- Fixes

- Add initial product documentation and demo playground setup

- Introduced a new `PRODUCT.md` file detailing the purpose, user personas, design principles, and brand personality for OpenEnvx.
- Set up a demo playground with essential files including `index.html`, `vite.config.js`, and CSS modules for styling.
- Implemented animations for UI components and established a token system for consistent theming across the workbench.
- Added tests for shortcut formatting to enhance user experience across different platforms.

These updates lay the groundwork for a comprehensive visual editor framework, improving documentation and providing a functional demo environment.

- Enhance documentation and introduce property field descriptors

- Added a new `property-fields.md` document detailing inspector field descriptors, their kinds, and usage guidelines for plugin authors and product hosts.
- Updated existing architecture documentation to reference the new property fields documentation and clarify the distinction between design and API references.
- Introduced new `segmented` field kind for property builders, enhancing the flexibility of inspector UI components.
- Updated various components and tests to utilize the new `segmented` field kind, improving the overall user interface and experience.

These changes improve the clarity and usability of the documentation while enhancing the capabilities of the property fields in the editor framework.

- Consolidate and rename packages into @xmazu/openenvxee-extensions

- Merged `@xmazu/openenvxee-protocol`, `@openenvx/elements`, and `@openenvx/widget-sdk` into a single package `@xmazu/openenvxee-extensions`, streamlining the authoring SDK for sandbox extensions.
- Updated all relevant documentation and code references to reflect the new package structure and naming conventions.
- Removed deprecated files and adjusted import paths across the codebase to ensure compatibility with the new package organization.
- Enhanced the architecture documentation to clarify the new structure and usage of the consolidated package.

These changes improve clarity and usability for developers working with the OpenEnvx framework, facilitating a more cohesive development experience.

- Rename CanvasBasicsPlugin to CanvasPlugin and update related documentation

- Renamed `CanvasBasicsPlugin` to `CanvasPlugin` across the codebase to better reflect its functionality, which now includes both engine and workbench chrome features.
- Updated all relevant documentation, including architecture and extension guides, to reference the new `CanvasPlugin` name and its capabilities.
- Removed references to the deprecated `@openenvx/canvas-pro` package, consolidating canvas features under `@openenvx/canvas`.
- Adjusted import paths and examples in demo applications to utilize the new plugin structure, enhancing clarity for developers.

These changes streamline the plugin architecture and improve the overall consistency of the OpenEnvx framework.

- Update package references and documentation for core schema

- Removed references to deprecated `@xmazu/openenvxee-schema` and consolidated schema imports under `@openenvx/core/schema`.
- Updated documentation across multiple files to reflect the new package structure, including changes in architecture and features.
- Adjusted import paths in the agent service and demo applications to utilize the new schema organization, enhancing clarity and consistency.
- Streamlined the overall codebase by eliminating unnecessary package dependencies, improving maintainability.

These changes enhance the organization of the schema components within the OpenEnvx framework, providing a clearer development experience.

- Update property field layout handling and diagnostics

- Renamed `chrome` to `layout` in property field descriptors to clarify inspector row layout options.
- Introduced `when` conditionals for property fields, allowing dynamic visibility based on context keys and property values.
- Enhanced documentation across multiple files, including `property-fields.md`, to reflect the new layout options and conditional logic.
- Implemented global editor diagnostics for better debugging of property `when` expressions, improving developer experience.
- Updated tests and examples to utilize the new layout and conditional features, ensuring consistency and functionality.

These changes improve the flexibility and clarity of property field configurations within the OpenEnvx framework, enhancing the overall development experience.

- Improve HTML block layout editor interaction and update version

- Enhanced the HTML block layout editor by implementing a selection-pill Move handle for drag reordering, improving user experience.
- Removed deprecated draggable properties and associated CSS styles to streamline the block interaction model.
- Updated the package version from 0.7.18 to 0.8.5 to reflect the latest changes and improvements.

These modifications enhance the usability of the HTML editor while ensuring a cleaner codebase.

- Introduce @openenvx/email package and demo application

- Added the @openenvx/email package, which includes a drop-in EmailEditor component, createEmailScene function, and renderEmailHtml for headless exports.
- Updated documentation to reflect the new email product host bundle and its usage.
- Introduced a demo application for @openenvx/email, showcasing its functionality and integration.
- Enhanced the architecture documentation to include the new email package and its components.

These changes expand the OpenEnvx framework's capabilities by providing a dedicated email editing solution, improving usability for developers and end-users.

- Enhance email editor with new top bar and HTML mode

- Introduced a new `EmailTopBar` component for improved navigation and mode switching in the email editor.
- Added support for an HTML editing mode alongside existing edit and preview modes, enhancing user flexibility.
- Updated the `EmailEditor` to utilize the new top bar and default email layout.
- Enhanced documentation to reflect the new features and usage of the email editor.

These changes significantly improve the user experience in the email editing workflow, providing a more intuitive interface and additional functionality.

- Integrate CodeMirror for HTML editing in email editor

- Added CodeMirror as a read-only HTML source editor in the email editor, enhancing the user experience by allowing users to view and edit HTML directly.
- Updated the `EmailEditorPane` to support HTML mode, displaying the rendered HTML with syntax highlighting and line numbers.
- Enhanced the styling and structure of the email editor pane to accommodate the new HTML source view.
- Introduced tests for the new HTML source editor functionality to ensure reliability and performance.

These changes significantly improve the email editing capabilities, providing users with a powerful tool for managing HTML content.

- Introduce top bar functionality in email editor

- Added a new `TopBarContribution` system to support optional top bars in the workbench layout.
- Integrated `EmailTopBar` into the email editor, enhancing navigation and mode switching capabilities.
- Updated the `EmailBlocksPlugin` to allow registration of the top bar, enabling hosts to opt-in for the feature.
- Enhanced documentation to reflect the new top bar functionality and its usage in the email editor.

These changes significantly improve the user experience by providing a more intuitive interface for email editing, allowing for better navigation and control.

- Enhance email editor with bottom insert bar and toolbar functionality

- Introduced a new `EmailToolbarContribution` to provide a bottom-center toolbar for the email editor, gated by edit mode.
- Updated the `EmailBlocksPlugin` to register the new toolbar, enhancing user interaction with text and layout tools.
- Added tests for the `EmailToolbarContribution` to ensure proper registration and functionality of toolbar items.
- Enhanced the `ShellDropdownControl` to support icons in dropdown items, improving visual clarity in the toolbar.
- Updated localization files to include new toolbar labels for email editing tools.

These changes significantly improve the user experience in the email editor by providing intuitive access to editing tools and enhancing the overall interface.

- Implement clipboard paste functionality in email editor

- Introduced `clipboardHtmlToEmailLayers` to map clipboard HTML/plain text into email blocks, enhancing the email editing experience.
- Added `resolvePasteInsertTarget` to determine the appropriate insertion point for pasted content, supporting seamless integration into the email structure.
- Implemented `PasteFromClipboardCommand` to handle paste operations, allowing users to insert formatted content directly into the email editor.
- Enhanced `EmailEditorPane` to listen for paste events and trigger the new command, improving user interaction.
- Added comprehensive tests for clipboard mapping and paste command functionality to ensure reliability.

These changes significantly enhance the email editor's usability by enabling users to easily paste formatted content, streamlining the editing process.

- Update email editor layout to simplify interface

- Modified the email editor layout to remove the activity bar, primary sidebar, and status bar, focusing on a cleaner interface with only the artboard and inspector visible.
- Enhanced the overall user experience by streamlining the editing environment, allowing for a more focused email creation process.

These changes improve usability by providing a more minimalistic and efficient workspace for users.

- Fixes

- Fixes

- Fixes

- Fix

- Enhance email editor with top bar and improved toolbar functionality

- Updated the email editor layout to include a product top bar, providing better navigation and mode switching capabilities.
- Enhanced the bottom insert toolbar for improved access to editing tools, streamlining the user experience.
- Modified the `EmailBlocksPlugin` to support the new top bar and toolbar features, allowing for a more cohesive editing environment.
- Adjusted the visibility of the top-center preview toolbar based on the presence of the top bar, optimizing the interface for users.

These changes significantly improve the usability and functionality of the email editor, creating a more intuitive and efficient workspace for users.

- Implement workbench plugin resolution and testing

- Introduced a new `resolveWorkbenchPlugins` function to manage the injection of default plugins when absent from the host plugin list, ensuring a consistent and ordered plugin experience.
- Created a comprehensive test suite for `resolveWorkbenchPlugins`, validating the correct resolution and ordering of default and host plugins.
- Updated `WorkbenchShell` to utilize the new plugin resolution logic, simplifying the plugin management process and enhancing overall functionality.

These changes improve the workbench's plugin architecture, providing a more robust and flexible environment for users.

- Update email package with new features and improvements

- Added `lightningcss` for enhanced CSS handling and updated `rollup` to version 4.57.0 for better build performance.
- Modified `knip.json` to include `tsup.config.ts` and `verify-pack.ts` in the entry and project sections, improving build configuration.
- Updated `package.json` to version 0.1.2, refined build scripts, and added a new `verify-pack` script for packaging validation.
- Enhanced the email editor's public API by introducing a new `Scene` interface for better persistence handling.
- Improved the `runtime` module to ensure proper type handling and exports, streamlining the integration with the email editor.
- Removed the obsolete `copy-dist-assets.ts` file to clean up the codebase.

These changes enhance the email package's functionality, improve build processes, and refine the public API for better usability.

- Init

- Rename and restructure HTML studio packages for clarity and consistency

- Renamed `@xmazu/openenvxee-html-studio` to `@openenvx/html-studio` for better alignment with the naming conventions of other packages.
- Updated references across documentation and configuration files to reflect the new package name.
- Enhanced the `PUBLISHING.md` to clarify the publishing process and package contents for `@openenvx/html-studio`.
- Adjusted the `package.json` and `release.config.json` to ensure proper integration and publishing of the renamed package.
- Improved the README and architecture documentation to provide clearer guidance for contributors and integrators.

These changes improve the overall clarity and consistency of the package structure, making it easier for users to understand and utilize the HTML studio functionalities.

- Fixes

- Update licensing and documentation for clarity

- Changed the license for all published packages from MIT to MPL-2.0, ensuring consistency across the project.
- Updated `README.md` and `PUBLISHING.md` to reflect the new licensing information and clarify the publishing process.
- Revised `AGENTS.md` and `Architecture.md` to align with the new license and improve overall documentation clarity.
- Added a new `CHANGELOG.md` to document notable changes and updates across the project.

These changes enhance the project's compliance and provide clearer guidance for contributors and users.

- Update TypeScript configuration and vitest settings across packages

- Added new TypeScript paths for `@xmazu/openenvxee-extensions/protocol` in `canvas-studio` and `email-studio` packages to improve module resolution.
- Updated `vitest.config.ts` files in multiple packages to include 'zod' in the inline dependencies, ensuring compatibility and preventing issues with module imports.
- Introduced new declaration files for `openenvx` in the `extensions` package, defining interfaces for the OpenEnvx API and enhancing type safety.

These changes enhance the TypeScript setup and testing configurations, improving overall development experience and code quality.

- Update dependencies and tsup configuration

- Added `@types/node` dependency to `bun.lock` and `packages/extensions/package.json` for improved type definitions.
- Updated `tsup.config.ts` to exclude the `src/vite/**` directory from the build process, refining the output and ensuring only relevant files are included.

These changes enhance type safety and optimize the build configuration for the extensions package.

- Enhance pre-commit hook and update release workflow

- Updated the pre-commit hook to include a step for running `bun run fix` and staging changes, ensuring code quality before commits.
- Modified the `release.yml` workflow to streamline the build and verification process for studio packages, improving the release pipeline.
- Clarified the publishing steps in `PUBLISHING.md` to ensure consistency in versioning and release practices.

These changes improve the development workflow and enhance the reliability of the release process.

- Update tsup configuration to skip DTS generation

- Modified `tsup.config.ts` to disable DTS generation for the private package, addressing memory issues during the build process in CI.
- Added comments to clarify the reasoning behind skipping DTS, ensuring better understanding for future maintainers.

These changes optimize the build process for the canvas package by preventing out-of-memory errors related to large type definitions.

- Update tsup configuration for private packages

- Removed DTS generation for the canvas and workbench packages to prevent out-of-memory errors during the build process in CI.
- Updated the extensions package to enable DTS generation, ensuring type definitions are included for published packages.
- Clarified comments in the tsup.library.js file regarding DTS handling for private and published packages.

These changes optimize the build process and improve type safety for the extensions package.

- Enhance BlockTreeRenderer tests with rich text editor wait function

- Introduced a new `waitForRichTextEditor` function to streamline the process of waiting for the rich text editor to mount, allowing for more flexible selector handling.
- Updated existing tests in `block-tree-renderer.test.tsx` to utilize the new function, improving readability and reducing redundancy in the test code.
- Mocked the lazy loading of the rich text editor to ensure proper isolation during testing.

These changes enhance the reliability and maintainability of the BlockTreeRenderer tests.

- V0.1.2


### Refactor

- Refactor inspector and property pane integration for enhanced UI management

- Updated the inspector and property pane contributions to improve the management of UI elements within the workbench.
- Renamed  to  to better reflect its purpose in the context of property management.
- Introduced new property pane components for canvas layers, enhancing the editing experience with more intuitive controls.
- Enhanced the documentation to clarify the usage of property panes and their integration with the overall architecture.
- Incremented version numbers for relevant packages to reflect the updates and improvements made.

These changes significantly enhance the usability and flexibility of the property management system within the workbench, providing a more streamlined editing experience for users.

- Refactor inspector and property pane integration for enhanced UI management

- Updated the inspector and property pane contributions to improve the management of UI elements within the workbench.
- Renamed  to  to better reflect its purpose in the context of property management.
- Introduced new property pane components for canvas layers, enhancing the editing experience with more intuitive controls.
- Enhanced the documentation to clarify the usage of property panes and their integration with the overall architecture.
- Incremented version numbers for relevant packages to reflect the updates and improvements made.

These changes significantly enhance the usability and flexibility of the property management system within the workbench, providing a more streamlined editing experience for users.

- Refactor BlockTreeRenderer tests to use Workbench API

- Updated tests in `block-tree-renderer.test.tsx` to utilize the new `renderWithWorkbench` function, enhancing test isolation and setup.
- Introduced `beforeEach` and `afterEach` hooks to manage the Workbench lifecycle, ensuring a clean state for each test.
- Adjusted multiple render calls to incorporate the Workbench API, improving the overall testing framework and reliability.

These changes streamline the testing process for the BlockTreeRenderer component, promoting better practices in test management.

<!-- generated by git-cliff -->
