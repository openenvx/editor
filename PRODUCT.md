# Product

## Register

product

## Users

Developers and product teams embedding a visual editor (canvas, HTML/email, flow) into their own apps, plus the end designers/marketers who use those editors daily. They are in a task: arranging layers, editing properties, shipping a design.

## Product Purpose

OpenEnvx is a composable visual-editor framework: plugins register layers, commands, and UI contributions; a headless controller owns scene state; apps compose their own React shell. Success means the workbench chrome feels as precise and trustworthy as Figma/Paper/shadcn-designer while staying fully composable.

## Brand Personality

Precise, quiet, tool-native. Architectural monochrome - the artboard is the hero, the chrome recedes. Confidence through density and alignment, not decoration.

## Anti-references

- Generic SaaS dark mode with blue focus rings on everything
- VS Code fork aesthetics (heavy borders, cramped 6px radii everywhere)
- Decorative gradients, purple accents, warm cream palettes
- Over-animated chrome; motion that doesn't convey state

## Design Principles

1. The artboard is the hero; chrome is scaffolding - thin, precise, visually quiet.
2. Accent color (blue) marks selection and state only, never decoration.
3. One type family, tight scale; mono + tabular numerals for all numeric fields.
4. Same control vocabulary everywhere - descriptor → registered renderer, no ad-hoc controls.
5. Motion conveys state (reveal, expand, feedback) at 150–250 ms; reduced-motion always honored.

## Accessibility & Inclusion

Keyboard-first workbench (commands, focus rings on every control), visible focus states via `--wb-shadow-focus`, `prefers-reduced-motion` alternatives for all animation, WCAG AA contrast for text on chrome surfaces.
