# Architecture documentation design

**Audience:** Internal engineers + coding agents first; structure peelable into external client docs later.

**Layout:** Hybrid — keep root `Architecture.md` + `Plugin-boundaries.md` as agent entry points; deep chapters under `docs/architecture/`. Leave `apps/docs/extension-guide.md` as the author how-to.

**Approach:** Concern-per-file hybrid (overview, runtime/core, workbench/headless, canvas, html, studio/products, extensions summary).

**Principles:** Hub + deep chapters; truth from current packages; separate _what exists_ from _how to author_; one-line audience note per chapter; diagrams + tables over prose walls.

**Out of scope for v1:** Moving Plugin-boundaries; rewriting extension-guide; public docs site; FEATURES.md restructure.
