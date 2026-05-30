# backend/src/main/scala/system/AGENTS.md

system 是基础设施层，不是业务垃圾桶。

允许放：

- 启动配置。
- DB session / connection pool。
- 通用 API router / dispatcher。
- 通用 serialization helpers。
- 日志、trace、error response。

禁止放：

- 具体业务对象。
- 具体微服务表逻辑。
- 用户/图书/订单等业务规则。
- 因为“方便”而绕过 microservice boundary 的 helper。

system 如果需要某个服务能力，优先通过函数注入或明确接口，而不是直接 import 具体服务内部实现。
