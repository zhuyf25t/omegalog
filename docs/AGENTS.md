# docs/AGENTS.md — 文档系统局部规则

docs 不是说明书，是系统骨架。任何新增对象、关系、API、状态机、数据库表、前端状态、基础设施流，都必须先在 docs 中有位置。

## 两层文档

1. 概念层：回答系统在数什么。
2. 同构层：按代码路径组织，让改代码的人知道每个文件在系统里的位置。

## 必须维护

- `00_index.md`：文档入口和当前状态。
- `01_product/`：愿景、用户旅程、产品图解释。
- `02_topos/`：对象、关系、状态机、不变量、冗余审查。
- `03_contracts/`：API registry、前后端对齐、serialization、DB 边界。
- `04_microservices/`：每个微服务的小世界。
- `05_frontend/`：页面、组件、状态源、store、API client。
- `06_flow_infra/`：IO、Queue、Redis、Kafka、MinIO、SSE/WebSocket。
- `07_checks/`：type safety registry、uncertainty list、trace matrix、检查报告。
- `mirror/`：与代码路径几乎同构的文档。

## 每个文档必须有

- Status: draft / reviewed / implemented / verified / uncertain / unsafe。
- Owner Agent。
- Last Verified。
- Related Code。
- Related API / DB / Frontend State。
- Open Questions。

不要把未确认的猜测写成事实。可以写 `uncertain`，并明确下一步怎么验证。
