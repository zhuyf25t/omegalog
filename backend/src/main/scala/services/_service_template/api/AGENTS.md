# api/AGENTS.md

api 是 microservice 的门口。

规则：

- 每个 API 单独文件。
- API 名称按业务意图命名，例如 `BorrowBookAPIMessage`，不要 `DoSomethingAPIMessage`。
- 输入字段直接表达业务数据；输出类型明确。
- 如果前端传 `userToken`，router 负责换成可信 `userId`，业务 API 不信任前端 userId。
- 需要别的服务信息，只调用别的服务公开 API，不读内部表。
- 每个 API 都在 docs/03_contracts/api_registry.md 登记。

API 是 command 还是 query 必须写清楚。
