# User Journeys

Status: implemented  
Owner Agent: product_ux_interpreter  
Last Verified: 2026-05-27

## Open a Workspace

1. User opens the app.
2. User selects a local folder.
3. App asks for read/write permission.
4. App reads top-level `*.omegalog.json` files.
5. Invalid JSON files are skipped and reported as import warnings.
6. Valid entries become the active workspace state.

Related API: `Workspace.openLocalFolder`, `TaskLog.importFolderEntries`

## Create or Adjust a Task

1. User opens the composer.
2. User enters title, optional note, tags, weight, and deadline.
3. App validates the draft and normalizes tags/weight/deadline.
4. App creates a new JSON file or rewrites the existing file.
5. Workspace reloads from the storage boundary.

Related API: `TaskLog.createEntry`, `TaskLog.updateEntry`

## Finish Work

1. User marks an active task complete.
2. App writes status `done` and `completedAt`.
3. App keeps the task visible in the archive table until the user chooses archive.
4. User can reactivate a completed task; if its deadline is stale, a fresh default deadline is assigned.

Related API: `TaskLog.completeEntry`, `TaskLog.reactivateEntry`

## Archive Completed Tasks

1. User clicks archive completed.
2. App writes completed entries to `archive/`.
3. App removes the original top-level files.
4. App reloads the workspace from top-level records.

Related API: `Archive.archiveCompletedEntries`

## Related Code

- Old source: `project-old-structure/src/main.ts`
- New frontend page: `frontend/src/pages/OmegaLogApp.tsx`
- New local file adapter: `frontend/src/api/localFolderTaskApi.ts`
