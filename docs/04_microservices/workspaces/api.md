# Workspaces API

Status: implemented  
Owner Agent: api_contract_alignment  
Last Verified: 2026-05-27

| API Message | Type | Semantics | Status |
|---|---|---|---|
| `OpenWorkspace` | command | Create/open a workspace using a display name and storage ref. | implemented |
| `ImportWorkspaceSnapshot` | command | Persist an imported snapshot at the workspace boundary. | implemented |

## Related Code

- `backend/src/main/scala/services/workspaces/api/WorkspaceApi.scala`
- `docs/03_contracts/api_registry.md`
