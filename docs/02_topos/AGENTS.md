# docs/02_topos/AGENTS.md

这里是系统的小世界地图。

必须维护：

- `object_catalog.md`：对象不是字段列表，而是系统里有身份、有规则、有生命周期的东西。
- `relation_catalog.md`：关系不是备注字段；有状态/字段/生命周期的关系要提升为对象。
- `state_machines.md`：有限状态用 enum/ADT 表达，写清合法转换。
- `invariants.md`：系统一直必须满足的条件。
- `forbidden_relations.md`：不允许的箭头，例如前端不能伪造 userId，服务不能读别人的 tables。
- `redundancy_review.md`：冗余对象/关系审查。

先找对象和关系，再写 API 和表。
