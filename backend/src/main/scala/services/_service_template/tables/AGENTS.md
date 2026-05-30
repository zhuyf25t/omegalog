# tables/AGENTS.md

tables 是服务内部数据库边界。

规则：

- 方法使用包级可见性，例如 `private[serviceName]`。
- 表操作返回 typed object 或 IO typed object。
- 写入和读取规则必须对称。
- 事务边界要写清楚，特别是库存、余额、状态转换、并发修改。
- 不把业务规则全部塞进 SQL 字符串；核心规则应在 API/domain 层可读。
- 不把别的服务的事实复制成自己的真实来源。
