# Vision

Status: implemented  
Owner Agent: product_ux_interpreter  
Last Verified: 2026-05-27

## Problem

The old OMEGALOG app works as a useful local todolist, but one `main.ts` owns DOM wiring, file-system access, JSON decoding, task lifecycle rules, filtering, sorting, countdowns, archive movement, and transient UI flags. This makes future extensions risky because a new feature can accidentally break storage, state, or rendering.

## Target Users

| Role | What they want | What they can do | What they must not do |
|---|---|---|---|
| Local task owner | Keep task records as durable files and operate them quickly. | Open a folder, import JSON tasks, add/update/complete/reactivate/archive. | Bypass decoding or hand-edit invalid fields without reimport warnings. |
| Future sync user | Use the same task model with safer storage and search. | Move to a backend adapter with the same API contract. | Treat browser file handles as backend objects. |

## Product Promise

OMEGALOG keeps task records as durable, inspectable JSON files while presenting a focused task workspace. The user can add a task, adjust it, complete it, reactivate it, search/filter/sort the archive, and move completed items into an archive folder.

## Migration Goal

The new architecture separates domain objects and invariants, public service APIs, local file IO adapters, frontend state and derived selectors, and future backend persistence boundaries.

## Non-goals

- No account/auth system in this slice.
- No cloud sync in this slice.
- No direct database dependency until the DB boundary is chosen.

## Related Code

- Old implementation: `project-old-structure/src/main.ts`
- New frontend target: `frontend/src/`
- New backend target: `backend/src/main/scala/services/`

## Open Questions

- `uncertain`: whether the next storage target should stay browser folder based, move to SQLite, or support both through the same API.
- `uncertain`: whether archives should remain files in `archive/` or become a searchable logical status in a database.
