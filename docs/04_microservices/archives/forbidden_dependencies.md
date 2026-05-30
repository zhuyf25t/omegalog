# Archives Forbidden Dependencies

Status: implemented  
Owner Agent: boundary_checker  
Last Verified: 2026-05-27

- Must not archive active tasks.
- Must not import `tasklogs.tables`.
- Must request completed task ids through `TaskLogApi`.
- Must not introduce an `archived` task status.
