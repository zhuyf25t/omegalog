# backend/AGENTS.md — Scala 后端规则

后端默认是 Type-safe / FP / Cats Effect 风格。

## 目录直觉

推荐结构：

```text
backend/src/main/scala/
  system/        # 通用基础设施：router、DB session、config、serialization helpers
  services/
    user/
      objects/
      api/
      tables/
      routes/   # 如项目需要
    books/
      objects/
      api/
      tables/
```

## 核心规则

- 业务对象进入类型，不要裸 `String` / `Int` 到处传。
- API 是服务门口。跨服务只调用 APIMessage / public API。
- tables 是服务内部实现，使用包级可见性保护。
- `objects/` 是纯数据与 serialization，不放 DB/随机数/业务流程/跨服务调用。
- 业务流程返回 `IO[...]` 或项目统一 effect。
- 副作用推到 API / table / boundary，核心计算保持纯。
- 大改动前先更新 docs 和 API registry。

## 验证

修改 Scala 后至少运行：

```bash
sbt compile
```

如有测试脚本，运行对应测试。无法运行时，说明原因，不要假装通过。
