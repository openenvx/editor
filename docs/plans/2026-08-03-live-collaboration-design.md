# Live collaboration + Figma-style comments (deferred)

**Status:** Roadmap / deferred — decisions captured 2026-08-03; not implementing now.  
**Product context:** Email-template collaboration platform first; ports must work for every editor (canvas, HTML, email, future).  
**Related:** [FEATURES.md](../../FEATURES.md) (Real-time collaboration, P2).

## Goals

1. **Realtime shared editing** via Liveblocks (or a future provider) for scene documents.
2. **Figma-style comments** — canvas/document-anchored pins, threads, resolve — **async**, not Liveblocks Comments.
3. **Provider-agnostic ports** so Liveblocks is one adapter, not the product API.
4. **Editor-agnostic** — any scene-based editor; first host wire = email, then canvas/HTML without redesign.

## Non-goals (v1 when built)

- Liveblocks Comments product / their Comments meter.
- Fine-grained CRDT field sync (may come later behind the same port).
- Command/op-log replay as the primary sync path.

## Decisions

| Topic | Choice |
| --- | --- |
| Scope | Shared scene + presence **and** own Figma-style comments in the same first ship |
| Comments product | Own implementation (async review pins); **not** Liveblocks Comments |
| Sync model | **Whole-scene sync** — room holds scene JSON; local `SceneStore.apply` pushes; remote updates apply via controlled replace/apply |
| Portability | DI ports + adapters (`CollaborationPort`, `CommentPort`); Liveblocks = collab adapter only |
| Editor coverage | Ports editor-agnostic; first product wire = email (`driver-email` / email host) |
| Pricing intent | Pay Liveblocks for presence + storage/collab minutes only; comments stay on our backend |

## Open (decide when picking up)

- **Auth + durable comments backend:** lean toward ports/adapters in editor-core + Liveblocks auth + comment API in openenvx-cloud (not decided). Demo-only stub is fine for a first spike.
- Undo/redo under multiplayer (per-client local stack vs shared).
- Presence payload (cursor, selection, viewport).
- Comment anchor model (node/block id + page-relative x/y; email vs canvas specifics).

## Package sketch

```text
packages/collab/              # ports + SceneStore bridge (provider-agnostic)
packages/collab-liveblocks/   # Liveblocks CollaborationPort adapter (optional dep)
openenvx-cloud (later)        # room auth endpoint + CommentPort HTTP/DB
host (email-demo → cloud)     # wire adapters; CollabPlugin UI
```

Mutation hub stays in core: remote updates must go through `SceneStore` (`apply` / controlled restore), not ad-hoc UI writes. Presence UI overlays live in the engine/shell that owns the surface (email pane / canvas) — not in `core`.

```text
Host
  → CollabPlugin (presence chrome, comment pins UI)
  → CollaborationPort + CommentPort
       ├── LiveblocksCollabAdapter   (rooms, presence, whole-scene storage)
       ├── HttpCommentAdapter        (own API — threads / pins / resolve)
       └── (future) OtherCollabAdapter
  → SceneStore
```

## Liveblocks usage (when built)

| Use                            | Liveblocks           |
| ------------------------------ | -------------------- |
| Presence (who's here, cursors) | Yes                  |
| Whole-scene Storage sync       | Yes                  |
| Comments                       | **No** — own backend |

Rough cost (sync only): Free hard-caps (e.g. 3k collab minutes); Pro ~$30/mo credits; collab minutes only when 2+ people share a room (`$0.002` / user-minute). See [liveblocks.io/pricing](https://liveblocks.io/pricing).

## Why not Liveblocks Comments

Product wants Figma-like pins that work async (offline other user, review/approval). Liveblocks Comments is room-live, metered at `$0.01`/comment, and couples UX/data to their model. Own comments keyed to `documentId` / version / node + position fit openenvx-cloud persistence and avoid that meter.

## Pickup checklist

1. Confirm cloud vs demo auth/comments backend.
2. Add `packages/collab` ports + whole-scene `SceneStore` bridge.
3. Add Liveblocks adapter package; wire `email-demo` (then cloud email host).
4. Ship CommentPort + pin UI (email first).
5. Reuse same ports for canvas / HTML hosts.
6. Update FEATURES.md status when shipping; consider CRDT upgrade path later without changing host APIs.
