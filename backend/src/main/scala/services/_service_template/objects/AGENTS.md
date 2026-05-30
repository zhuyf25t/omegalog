# objects/AGENTS.md

objects 是领域数据层。

允许：

- `case class UserId(value: String)`。
- `enum Status`。
- companion 里的 `toString(value)` / `fromString(s)`。
- Circe Encoder/Decoder / codec / time codecs。

禁止：

- `random()` / UUID 生成。
- DB 读写。
- 网络调用。
- 调用别的 microservice。
- 复杂业务流程。
- 可变全局状态。

objects 应该像“业务世界的名词和形状”，不要变成服务层。
