# backend/src/main/scala/services/AGENTS.md

services 下每个目录是一个 microservice 小世界。

每个服务应该拥有：

```text
objects/  # 本服务领域对象与必要 serialization
api/      # 对外 APIMessage / request instance / response
routes/   # 若项目保留 service-level routes
tables/   # 本服务内部数据库表访问
```

规则：

- 服务 A 不能直接访问服务 B 的 `tables/`。
- 服务 A 不能调用服务 B 的 private helper。
- 跨服务只能通过 B 的公开 API。
- 服务自己的 tables 用 `private[serviceName]` 保护。
- 服务对象应该在 docs/04_microservices/<service>/ 里有对应文档。
