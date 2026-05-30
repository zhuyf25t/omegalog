# frontend/src/api/AGENTS.md

所有后端调用走统一 API client。

规则：

- 不在页面组件里手写散乱 fetch。
- API 函数名与 docs/03_contracts/api_registry.md 对齐。
- 前端 request 可以包含 `userToken`，但不能伪造可信 `userId`。
- response mapper 要 typed，不要返回 `any`。
- 每次后端 API 改动，同步这里和 docs。
