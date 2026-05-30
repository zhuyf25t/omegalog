# Forbidden Relations

Status: implemented  
Owner Agent: boundary_checker  
Last Verified: 2026-05-27

| Forbidden relation | Why | Status |
|---|---|---|
| UI component reads `FileSystemFileHandle` directly. | File IO is a boundary effect and must stay in API adapter. | implemented |
| `archives` imports `tasklogs.tables`. | Cross-service table access breaks microservice ownership. | implemented |
| Parsed JSON reaches UI before decode/normalization. | Unsafe shape can break rendering and invariants. | implemented |
| Backend business API trusts frontend `userId`. | Future auth must convert token to trusted id in router. | reviewed |
| Derived values stored as core Zustand state. | Search results/focus/stats can be recomputed from records. | implemented |
| `objects/` generates ids, reads files, or calls services. | Objects must stay pure. | implemented |
