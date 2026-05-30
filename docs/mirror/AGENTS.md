# docs/mirror/AGENTS.md

mirror 文档按代码路径近似同构。

例：

```text
backend/src/main/scala/services/books/api/BorrowBookAPIMessage.scala
```

对应：

```text
docs/mirror/backend/src/main/scala/services/books/api/BorrowBookAPIMessage.md
```

mirror 文档不复制代码，只回答：

- 这个文件是什么。
- 它属于哪个 service / page / store。
- 依赖谁，谁依赖它。
- 不能越过哪些边界。
- 对应哪些 docs、API、tests。
- 类型安全状态和最后一次验证。
