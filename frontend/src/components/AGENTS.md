# frontend/src/components/AGENTS.md

组件是可复用小盒子。

- 子组件需要什么就用 props 声明什么。
- 不要为了少传两个 props 就偷读全局 store。
- 组件不应该知道过多后端细节。
- 组件内部只保留真正局部、用户可改的核心状态。
- 派生值直接计算。
