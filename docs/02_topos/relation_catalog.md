# Relation Catalog

Status: implemented  
Owner Agent: topos_domain_architect  
Last Verified: 2026-05-30

| Relation | From | To | Cardinality | Owner | Status |
|---|---|---|---|---|---|
| contains | `WorkspaceSnapshot` | `TaskRecord` | one to many | `workspaces` | implemented |
| has warnings | `WorkspaceSnapshot` | `ImportWarning` | zero to many | `workspaces` | implemented |
| persists through | `TaskRecord` | `TaskFileRef` | one to one | `workspaces` | implemented |
| located at | `TaskRecord` | `TaskStorageLocation` | one to one | `workspaces` | implemented |
| describes | `TaskRecord` | `TaskLogEntry` | one to one | `tasklogs` | implemented |
| has tags | `TaskLogEntry` | `TaskTag` | zero to six | `tasklogs` | implemented |
| has status | `TaskLogEntry` | `TaskStatus` | exactly one, ADT-constrained with `completedAt` | `tasklogs` | implemented |
| queries | `TaskListQuery` | `TaskRecord` | zero to many | `tasklogs` | implemented |
| archives | `ArchiveBatch` | done `TaskRecord` ids | zero to many | `archives` | implemented |
| derives focus | `WorkspaceSnapshot` | active `TaskLogEntry` | zero or one | frontend selector | implemented |
| derives page | `TaskListQuery`/controls | `TaskRecord` | zero to page size | frontend selector | implemented |
| records mutation | `TaskChangeEvent` | `TaskEventSnapshot` | before/after optional | `taskhistory` | implemented |
| groups events | `TaskChangeEvent` | `SummaryDate` | many to one | `taskhistory` | draft |
| derives report | `DailySummary` | `TaskChangeEvent` | zero to many events | `daily_summaries` | draft |
| attempts generation | `SummaryRun` | `DailySummary` | zero or one output | `daily_summaries` | draft |
| belongs to | `DailySummary` | `WorkspaceSnapshot`/workspace folder | exactly one | `daily_summaries` | draft |
| summarizes | `DailySummary` | `SummaryDate` | exactly one | `daily_summaries` | implemented |
| uses provider metadata | `DailySummary` | `SummaryProviderMetadata` | exactly one metadata value | `daily_summaries` | implemented |
| uses provider metadata | `SummaryRun` | `SummaryProviderMetadata` | exactly one metadata value | `daily_summaries` | draft |
| targets | `SummaryRun` | `SummaryDate` | exactly one | `daily_summaries` | draft |
| reads source | `SummaryRun` | `TaskChangeEvent` source hash | zero to many events | `daily_summaries` | draft |

## Cross-Service Rule

`archives` may request task entries through `tasklogs` API messages, but must not import or mutate `tasklogs.tables` directly. `daily_summaries` consumes `taskhistory` API output, not current task snapshots or task table internals. `workspaces` owns file handles and storage references; `tasklogs` owns task meaning.
