# docs/03_contracts/AGENTS.md

这里是前后端、微服务、serialization、DB 边界的合同层。

每个 API 必须登记：

- API name / path。
- Query or command。
- Frontend request shape。
- Router transformation，例如 `userToken -> trusted userId`。
- Backend APIMessage shape。
- Response shape。
- Failure semantics。
- Permission semantics。
- Serialization / decoder rules。
- Frontend API client path。
- Backend API path。
- Tests / verification status。

不允许前端和后端拥有两个不同的字段宇宙。
