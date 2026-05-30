# UI Reference Images

Status: reviewed  
Owner Agent: product_ux_interpreter  
Last Verified: 2026-05-27

## Current Reference

The migration used the old app itself as the UI reference:

- `project-old-structure/index.html`
- `project-old-structure/src/style.css`
- `project-old-structure/src/assets/omegalog-library-v2.png`
- `project-old-structure/src/assets/omegalog-focus-desk-v1.png`

## Preserved Layout Ideas

- Workspace header with open-folder action.
- Focus task panel.
- Search/filter/sort toolbar.
- Paginated task archive/list.
- Task composer.
- Archive completed action.
- Import warning and visible error feedback; transient toast feedback is removed.

## Intentional Change

The new frontend restores the old decorative library identity while keeping the migrated React/CSS structure modular. The background image, focus card, archive panel, and gold/dark control language should remain visually close to `project-old-structure` without reintroducing the old monolithic files.

## Open Questions

- No current open visual identity question. Future visual changes should preserve the restored old-app style unless the product direction changes explicitly.
