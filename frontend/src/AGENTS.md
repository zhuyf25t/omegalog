# frontend/src/AGENTS.md

src 下按功能组织，不按技术后缀切碎。

推荐：

```text
pages/
components/
stores/
api/
styles/
utils/
```

组件要有明确输入输出。页面容器负责组合数据和布局；组件尽量薄；纯计算抽成普通函数。
