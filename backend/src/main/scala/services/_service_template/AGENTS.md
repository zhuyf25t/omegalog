# backend/src/main/scala/services/_service_template/AGENTS.md

这是新建服务时复制用的模板。

把 `_service_template` 改成真实服务名，例如 `user`、`books`、`payment`。

## 服务内部规则

- `objects/`：只放 ID、case class、enum、ADT、codec、serializer。
- `api/`：每个 API 单独文件，业务入口在这里。
- `tables/`：只给本服务包内访问，严禁别的服务 import。
- `routes/`：如果使用统一 APIMessage router，可为空或不存在。

## 必备 docs

创建或更新：

```text
docs/04_microservices/<service>/service_contract.md
docs/04_microservices/<service>/objects.md
docs/04_microservices/<service>/api.md
docs/04_microservices/<service>/tables.md
docs/04_microservices/<service>/forbidden_dependencies.md
```

## 检查

新增服务必须通过 boundary_checker 和 api_alignment_checker。
