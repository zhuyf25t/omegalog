# Local File Flow

Status: implemented  
Owner Agent: flow_infra  
Last Verified: 2026-05-27

## Flow

```text
user action
  -> React component
  -> Zustand action
  -> TaskLogApi port
  -> LocalFolderTaskApi
  -> File System Access API
  -> decode/encode boundary
  -> WorkspaceSnapshot
  -> React render
```

## Resource Rules

- File write uses create-writable, write, close.
- Folder permission is requested before write commands.
- Archive write/delete operations happen record by record and reload the folder after completion.
- UI uses pending ids to avoid duplicate writes for the same task.

## Backpressure / Concurrency

Current workload is local and user-driven. No queue is required yet. If bulk import/archive grows, introduce a bounded queue and batch progress state rather than firing unbounded concurrent writes.
