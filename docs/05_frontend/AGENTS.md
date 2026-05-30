# docs/05_frontend/AGENTS.md

前端文档要回答：页面是什么、核心状态是什么、派生状态是什么、URL 负责什么、Zustand 负责什么、API client 怎么对齐。

维护：

- `pages.md`
- `components.md`
- `state_sources.md`
- `zustand_store_rules.md`
- `api_client.md`

判断状态归属：近距离 props，远距离共享核心状态 Zustand，页面身份/对象 id/筛选条件 URL，派生数据直接计算。
