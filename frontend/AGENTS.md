# frontend/AGENTS.md — React/TypeScript 前端规则

前端不是“把页面画出来”，而是把核心数据、派生数据、页面身份、API 和外部世界同步组织清楚。

## 核心规则

- 页面 = 某一时刻数据的快照。
- 能算出来的数据不要存进 state/store。
- useEffect 只用于同步外部世界。
- 近距离数据用 props；远距离共享核心状态用 Zustand；页面身份/筛选条件/对象 id 用 URL。
- API 调用必须经过统一 API client。
- 前端 request shape 必须和 docs/03_contracts 对齐。
- 不使用 `any` 逃避类型；必须用时写理由。
- Tailwind/CSS 是布局和视觉规则，不要靠随机试错。

## 验证

修改前端后至少运行项目约定的 typecheck/build，例如：

```bash
npm run typecheck
npm run build
```

无法运行时说明原因。
