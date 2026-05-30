# Object / Relation Optimizer Agent Report

Status: reviewed  
Owner Agent: object_relation_optimizer  
Review Date: 2026-05-27

## Post-Fix Owner Note

Status: verified  
Last Verified: 2026-05-27

The red findings below were produced before the object model repair pass. `TaskRecord`, `TaskDraft`, `TaskDeadline`, `DeadlineAdjustmentStats`, `TaskStorageLocation`, and `TaskListQuery` are now documented; frontend and backend task lifecycle types now prevent illegal status/completedAt pairs through normal constructors.

## Scope

本轮只审查 OMEGALOG 对象/关系建模，不改业务代码。证据来源：

- `AGENTS.md`
- `docs/02_topos/object_catalog.md`
- `docs/02_topos/relation_catalog.md`
- `docs/02_topos/state_machines.md`
- `docs/02_topos/invariants.md`
- `docs/02_topos/forbidden_relations.md`
- `docs/02_topos/redundancy_review.md`
- `project-old-structure/src/main.ts`

核心审查问题：对象是事实、关系还是视图？它有没有独立生命周期？

## Findings

- [red] `TaskRecord` 是已被关系模型使用的事实/关系对象，但没有进入 `object_catalog`。  
  Evidence: `relation_catalog.md:9-11` 和 `relation_catalog.md:14` 使用 `TaskRecord`；`redundancy_review.md:16` 声明 `TaskRecord` 是“storage reference plus entry”；旧代码 `LogRecord` 明确包含 `fileName`、`FileSystemFileHandle`、`entry` 三个维度（`project-old-structure/src/main.ts:21-25`）。  
  Impact: 当前 object catalog 无法完整解释 `WorkspaceSnapshot -> TaskRecord -> TaskLogEntry` 这条核心链路，后续实现容易退回到 `fileName + handle + entry` 的散装组合。  
  Recommendation: 补 `TaskRecord`，定位为 workspaces 拥有的存储记录/关系对象，字段为 `TaskFileRef` + `TaskLogEntry`，生命周期为 imported/written/moved-out-of-root。

- [yellow] `TaskLogEntry` 的生命周期混入了 `archived file`，这是存储位置状态，不是任务业务状态。  
  Evidence: `object_catalog.md:12` 把 `active/done/archived file` 写进 `TaskLogEntry` 生命周期；但 `TaskStatus` 只有 `active`/`done`（`object_catalog.md:15`），状态机也把归档表示为 `done -> archiveCompletedEntries -> archived file`（`state_machines.md:17-21`）；redundancy review 明确说 done 和 archived file 要分开（`redundancy_review.md:20-22`）。旧代码归档是移动文件到 `archive` 目录并删除原文件（`project-old-structure/src/main.ts:728-733`）。  
  Impact: 容易产生非法连接：把 `archived` 当作第三种 `TaskStatus`，或让 tasklogs 直接拥有文件位置。  
  Recommendation: 把 `archived file` 移到 `TaskRecord` / `TaskFileRef` / `TaskStorageLocation` 的生命周期；`TaskLogEntry` 只表达 active/done 业务状态。

- [red] `TaskStatus` 与 `completedAt` 的强关系仍主要靠不变量描述，没有提升为类型结构。  
  Evidence: 文档声明 active 必须 `completedAt = null`、done 必须有合法 `completedAt`（`state_machines.md:26-27`，`invariants.md:14-15`）；旧类型却是并列字段 `status: LogStatus` 与 `completedAt: string | null`（`project-old-structure/src/main.ts:13`、`project-old-structure/src/main.ts:18`），旧 decoder 只检查 `completedAt` 格式，不检查 active/done 与 completedAt 的对应关系（`project-old-structure/src/main.ts:1267-1303`）。  
  Impact: 可以构造 `done + completedAt = null` 或 `active + completedAt != null` 这类非法对象。  
  Recommendation: 建模为 `TaskLifecycle` discriminated union，或引入 `TaskCompletion` 关系对象：`ActiveTask` 无 completion，`DoneTask` 必有 completion instant。

- [yellow] `TaskDeadline` 缺失，deadline 现在是带规则的裸时间字符串。  
  Evidence: object catalog 只把 deadline 列为 `TaskLogEntry` 字段（`object_catalog.md:12`）；invariants 声明 invalid deadline 会变成 next midnight（`invariants.md:16`）；旧代码用 `deadline: string`（`project-old-structure/src/main.ts:14`），并由 `buildDefaultDeadline` / `parseDeadlineInput` 维护规则（`project-old-structure/src/main.ts:1319-1345`）。  
  Impact: deadline 既有解析、默认值、过期判断，又参与 focus/tension，但类型层没有阻止无效字符串进入核心对象。  
  Recommendation: 提升为 `TaskDeadline` value object，统一 decode、default、compare、overdue 判断。

- [yellow] deadline 调整次数是有规则的事实，但目前只是两个松散数字字段。  
  Evidence: 旧类型有 `deadlineAdjustCount` 和 `overdueAdjustCount`（`project-old-structure/src/main.ts:15-16`），更新时按 deadline 是否变化、是否已逾期来增加（`project-old-structure/src/main.ts:257-272`），tension 计算继续依赖这两个数字（`project-old-structure/src/main.ts:972-982`），并通过 `normalizeCount` 限制范围（`project-old-structure/src/main.ts:1378-1383`）。  
  Impact: 这不是任意 number，而是任务压力/调整历史的压缩事实；继续裸放会让非法 count 或不对称更新变容易。  
  Recommendation: 引入 `DeadlineAdjustmentStats` 或 `TaskPressureStats` value object；如未来需要审计，再拆成 `DeadlineAdjustmentEvent`。

- [yellow] `ArchiveBatch` 更像 command result，不像有独立生命周期的领域对象。  
  Evidence: object catalog 将其 identity 写成 command result（`object_catalog.md:17`）；旧代码归档后只展示本次移动数量，没有持久化 archive batch（`project-old-structure/src/main.ts:709-741`）。  
  Impact: 若把它当实体，archives 服务会被诱导保存“批次事实”；当前产品规则只需要返回结果 DTO。  
  Recommendation: 保留为 API response/result type；只有需要归档审计、撤销、批次历史时才升级为领域对象。

- [yellow] `ImportWarning` 已在 object catalog 出现，但 relation catalog 没有显式表达 `WorkspaceSnapshot has warnings`。  
  Evidence: `WorkspaceSnapshot` 字段包含 warnings（`object_catalog.md:10`），`ImportWarning` 是 import result（`object_catalog.md:18`）；旧代码对坏文件只是 `console.warn` 后跳过（`project-old-structure/src/main.ts:1231-1243`）。  
  Impact: 文档说 UI/core state 可持有 warnings，但关系模型没有说明 warnings 属于哪个 snapshot、是否按文件去重、是否随 reload 消失。  
  Recommendation: 增加关系 `WorkspaceSnapshot has ImportWarning zero to many`，并声明 warning 是 load result/view fact，不是长期领域事实。

- [yellow] `TaskFileRef` 被 object catalog 声明，但 relation catalog 的 persists 关系绕过了它。  
  Evidence: `TaskFileRef` 是对象（`object_catalog.md:16`），但 persists 直接写成 `TaskRecord -> .omegalog.json file`（`relation_catalog.md:10`）；旧代码创建文件名时把日期与 id 拼入 `.omegalog.json` 文件名（`project-old-structure/src/main.ts:277-293`）。  
  Impact: 文件名、handle、storage pointer 的规则没有形成类型链，`TaskId` 与 file name 的关系仍容易被字符串拼接污染。  
  Recommendation: 显式建模 `TaskRecord has TaskFileRef exactly one`，`TaskFileRef points to .omegalog.json file exactly one`，`TaskFileRef embeds TaskId exactly one`。

- [yellow] list/filter/sort/page 是视图查询关系，不该进领域对象，但应在前端状态文档或关系文档中命名。  
  Evidence: 旧代码有 `SortMode`、`StatusFilter`（`project-old-structure/src/main.ts:4-5`）和 `currentSortMode`、`statusFilter`、`currentPage`、`archiveQuery`（`project-old-structure/src/main.ts:109-117`）；`getVisibleRecords` 与 `getSortedRecords` 派生列表（`project-old-structure/src/main.ts:1014-1048`）；redundancy review 已声明 selectors 派生 filtered/page records（`redundancy_review.md:18`）。  
  Impact: 如果不命名为 view query，后续 Zustand/store 容易把派生结果存成核心状态。  
  Recommendation: 引入 frontend-only `TaskListQuery` / `TaskListViewState`，只保存 query controls，不保存 visible records。

- [yellow] `TaskTag` 与 UI display tag 仍需分离。  
  Evidence: 文档把 `TaskTag` 定义为 normalized user label（`object_catalog.md:13`）；旧代码 `deriveTags` 会把 priority/status 派生为显示 tag，再混入 entry.tags（`project-old-structure/src/main.ts:1119-1137`），`parseTagsInput` 又过滤某些 display tag（`project-old-structure/src/main.ts:1348-1354`）。  
  Impact: 用户业务标签和 UI 生成标签可能互相污染，导致真实 tag 被 presentation rule 吃掉。  
  Recommendation: 明确 `TaskTag` 是用户输入事实；`DisplayTag` 是 selector/view 输出，不能回写到 `TaskLogEntry.tags`。

- [green] `ArchivePolicy` 当前不必新增。  
  Evidence: object catalog 已把它列为 review 对象，说明只有需要 date/tag/status-specific archive rules 才引入（`object_catalog.md:34-35`）；旧归档逻辑就是移动所有 done records（`project-old-structure/src/main.ts:714-733`）。  
  Recommendation: 在需求仍是“归档全部 completed”时，不新增 `ArchivePolicy`。

- [green] `CountdownState` / focus / tension 属于视图或 selector 输出，不应升级为领域对象。  
  Evidence: 旧代码 `CountdownState` 只有 `text` 和 `isOverdue`（`project-old-structure/src/main.ts:41-44`），focus 由 active records 按 weight/deadline 派生（`project-old-structure/src/main.ts:1002-1011`），tension 由 counts/deadline 派生（`project-old-structure/src/main.ts:972-982`）；relation catalog 已把 derives focus 标为 frontend selector（`relation_catalog.md:15`）。  
  Recommendation: 保持 selector/view output，不写入核心对象。

## Redundant Objects

- `ArchiveBatch`: 当前是 command result DTO；未见独立生命周期。除非要审计归档批次，否则不要当领域实体。
- `WorkspaceId`: 对本地浏览器文件夹应用来说暂为 uncertain。旧代码只有 `activeDirectory` / folder name（`project-old-structure/src/main.ts:104`），没有稳定持久 workspace identity。可保留为未来 sync/auth/storage adapter 的 opaque identity，但不要让 tasklogs 依赖它。
- `ImportWarning`: 不是长期领域实体；应是 `WorkspaceSnapshot` 的 load result item。
- `CountdownState`, focus result, filtered records, page records, tension level: 都是视图/selector 输出，不是领域事实。

## Missing Objects

- `TaskRecord`: 必须补进 object catalog；它是 `TaskFileRef` 与 `TaskLogEntry` 的显式关系对象。
- `TaskDeadline`: deadline 有 decode/default/compare/overdue 规则，应是 value object。
- `TaskLifecycle` 或 `TaskCompletion`: 用类型表达 active/done 与 completedAt 的强约束。
- `DeadlineAdjustmentStats` / `TaskPressureStats`: 把 deadline adjust count 与 overdue adjust count 从裸 number 收束为 value object。
- `TaskStorageLocation` / `TaskFilePlacement`: 表达 root workspace file 与 archive folder file 的存储位置，避免污染 `TaskStatus`。
- `WorkspaceLoadState` / `WorkspaceSession`: state machine 已存在，但 object catalog 没有对应状态对象；建议放在 frontend/workspaces 边界。
- frontend-only `TaskListQuery`: 表达 sort/filter/search/page 控制项；不要保存派生列表。
- `DisplayTag`: 如 UI 继续展示 priority/status/tag 混合标签，应与用户输入 `TaskTag` 分开。

## Implicit Relations

- `WorkspaceSnapshot contains TaskRecord`: 已登记，但缺少 `TaskRecord` 对象本身。
- `TaskRecord has TaskFileRef exactly one`: 目前隐含在 `LogRecord.fileName/handle` 与 `TaskFileRef` 文档中。
- `TaskFileRef embeds TaskId exactly one`: invariants 写了 task id used in file names，但 relation catalog 未登记。
- `TaskLogEntry lifecycle determines completedAt`: 不变量已写，类型关系未建。
- `WorkspaceSnapshot has ImportWarning zero to many`: object catalog 字段已有，relation catalog 未登记。
- `WorkspaceSession has BrowserPermission`: state machine 有 permissionDenied，旧代码有 permission query/request，但关系未命名。
- `TaskListQuery derives visible/page records from WorkspaceSnapshot`: redundancy review 说 selectors 派生，但 relation catalog 只登记了 focus。
- `TaskWeight + TaskDeadline derives FocusTask`: relation catalog 已有 focus，但建议把排序规则写清楚，旧代码规则是 weight desc，再 deadline asc。

## Illegal Connections

- 把 `archived` 当作 `TaskStatus` 第三值。文档应保持 `TaskStatus = active | done`，归档属于 file placement。
- 让 tasklogs 直接持有 `FileSystemFileHandle`。旧 `LogRecord` 证明这是历史耦合点；新边界必须让 workspaces/storage adapter 持有 handle。
- 用 file name/title 代替 `TaskId`。object catalog 已禁止裸 `string taskId`，但需要通过 `TaskFileRef embeds TaskId` 强化。
- 让 parsed JSON 未 decode 就到 UI。当前 forbidden relation 已覆盖；decoder 还应补 status/completedAt 联合校验。
- 把 `DisplayTag` 回写为 `TaskTag`。UI 生成的 priority/status 标签不能污染用户标签事实。
- 把 derived visible records/focus/tension 存进核心状态。只能存 query controls 与 source records。

## Microservice Boundary Advice

- `workspaces` owns: `WorkspaceSession`, `WorkspaceSnapshot`, `TaskRecord`, `TaskFileRef`, `TaskStorageLocation`, file handles, folder permission, import warnings.
- `tasklogs` owns: `TaskId`, `TaskLogEntry`, `TaskTag`, `TaskWeight`, `TaskStatus`, `TaskDeadline`, `TaskLifecycle`, pure transition/decoder rules.
- `archives` owns: archive command orchestration and archive result DTO. It should request done records through public APIs and ask workspaces/storage to move files; it should not own `TaskLogEntry` internals or file handles.
- `frontend` owns: `TaskListQuery`, selected/editing UI state, countdown display, focus/tension/list selectors. It should not own raw filesystem handles or normalized JSON decode rules.

## Required Changes

1. Add `TaskRecord` to object catalog or explicitly merge it with `TaskFileRef`; do not leave it referenced only in relation/redundancy docs.
2. Move `archived file` out of `TaskLogEntry` lifecycle and into `TaskRecord` / `TaskStorageLocation`.
3. Promote `TaskStatus + completedAt` to a typed lifecycle model or `TaskCompletion` relation.
4. Add missing relations for `TaskFileRef`, `ImportWarning`, and `TaskListQuery`.

## Suggested Changes

1. Add `TaskDeadline` and `DeadlineAdjustmentStats` as value objects.
2. Clarify `WorkspaceId` as adapter/session identity for now; do not make it a cross-service domain dependency until sync/auth exists.
3. Keep `ArchiveBatch` as result DTO until archive audit/history is required.
4. Split `DisplayTag` from `TaskTag` if UI continues to render status/priority as tag-like chips.

## Next Refactor Order

1. Documentation repair: object catalog + relation catalog + state machines align on `TaskRecord`, `TaskFileRef`, `TaskStorageLocation`, `TaskStatus`.
2. Type repair: replace loose `status + completedAt` with lifecycle union; add decoder tests for illegal combinations.
3. Value object pass: introduce `TaskDeadline`, then `DeadlineAdjustmentStats`.
4. Boundary pass: make `workspaces` the only owner of file handles and file placement; keep tasklogs pure.
5. Frontend view pass: name `TaskListQuery`, `DisplayTag`, focus/tension as selectors/view outputs, not core records.
6. Checker pass: rerun type safety, boundary, docs sync, and API alignment checks after the model changes.

## Uncertain

- Current non-old implementation was not inspected in this review; findings are based on the requested docs plus `project-old-structure/src/main.ts`.
- Whether `WorkspaceId` should be stable/persistent depends on future sync/auth/storage requirements.
- Whether archive needs a real `ArchiveBatch` entity depends on future audit, undo, or archive history requirements.

## Handoff

- `topos_domain_architect`: update object/relation/state documents.
- `type_safety_checker`: verify lifecycle union and value objects remove illegal states.
- `boundary_checker`: verify file handles and archive movement stay in workspaces/storage edge.
- `frontend_state_checker`: verify query/view outputs are not stored as core state.
