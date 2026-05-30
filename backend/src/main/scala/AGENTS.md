# backend/src/main/scala/AGENTS.md

Scala 源码层规则：

- 包路径要表达架构，不要随便放文件。
- 公共 system 层不能反向依赖具体业务服务，除非通过函数注入或接口抽象。
- 服务内部可以强耦合；服务外部必须弱耦合。
- 不要为了方便引入全局可变状态。
- 任何新增 public API 都要登记到 docs/03_contracts。
