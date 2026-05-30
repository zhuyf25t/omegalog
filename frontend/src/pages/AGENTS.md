# frontend/src/pages/AGENTS.md

pages 是整页和路由边界。

- 页面身份、对象 id、筛选条件优先放 URL。
- 页面负责组织 API、store、组件，但不要变成巨型组件。
- 页面级 useEffect 只能用于请求/订阅/外部世界同步。
- 每个页面应在 docs/05_frontend/pages.md 中登记。
