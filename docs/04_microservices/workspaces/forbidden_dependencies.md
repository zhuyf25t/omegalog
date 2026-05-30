# Workspaces Forbidden Dependencies

Status: implemented  
Owner Agent: boundary_checker  
Last Verified: 2026-05-27

- Must not decide task lifecycle transitions.
- Must not import `tasklogs.tables`.
- Must not expose browser `FileSystemDirectoryHandle` outside the frontend local adapter.
- Must not treat archive location as a task status.
