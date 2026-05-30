# Tasklogs Forbidden Dependencies

Status: implemented  
Owner Agent: boundary_checker  
Last Verified: 2026-05-27

- Must not read browser file handles.
- Must not write archive files directly.
- Must not import `archives.tables`.
- Must not expose constructors that allow active tasks with `completedAt` or done tasks without `completedAt`.
