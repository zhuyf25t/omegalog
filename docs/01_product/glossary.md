# Glossary

Status: implemented  
Owner Agent: product_ux_interpreter  
Last Verified: 2026-05-27

## Terms

- Workspace: the user-selected local folder that contains top-level `.omegalog.json` files.
- Task Log Entry: one task record persisted as JSON.
- Active Task: a task with status `active`.
- Done Task: a task marked complete but not necessarily moved to `archive/`.
- Archived Task: a completed task moved from the workspace root into the `archive/` directory.
- Focus Task: the active task selected by highest weight, then earliest deadline.
- Weight: integer priority from 1 to 10.
- Deadline Adjustment: count incremented when a task deadline changes.
- Overdue Adjustment: count incremented when an overdue active task receives a changed deadline.
