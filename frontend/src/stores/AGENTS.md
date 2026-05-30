# frontend/src/stores/AGENTS.md

Zustand 是公共白板，不是垃圾桶。

适合放：

- 当前用户。
- 全局主题。
- 跨页面共享的当前选中对象。
- API 缓存或系统级状态。

不适合放：

- 组件局部展开/收起。
- 小表单临时输入。
- 可由 props 或 URL 推导的数据。
- 派生数据。

Store 内部结构尽量 private by convention，只暴露 selector/action。
