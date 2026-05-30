# docs/04_microservices/AGENTS.md

每个 microservice 是一个几乎自洽的小世界。

每个服务目录至少写：

- `service_contract.md`：这个服务是什么、拥有什么、对外提供什么。
- `objects.md`：本服务拥有的对象和共享输出对象。
- `api.md`：APIMessage 列表和语义。
- `tables.md`：本服务内部表。
- `forbidden_dependencies.md`：禁止依赖和跨服务规则。

跨服务只通过 API。不要让一个服务直接访问另一个服务的 tables、private helper 或内部实现。
