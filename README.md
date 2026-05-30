# Type-Safe Codex Agents Pack

这是一个给 Codex 项目使用的多 Agent 工作流模板。它把《类型安全课》里的系统观整理成可放进项目根目录的规则文件、子 agent 配置和文档模板。

## 里面有什么

```text
AGENTS.md                         # 仓库根宪法：主 agent 的工作流与总原则
.codex/config.toml                # Codex 子 agent 并发配置示例
.codex/agents/*.toml              # 可被 Codex spawn 的项目级 custom agents
agent_constitutions/*/AGENTS.md   # 每个 agent 的详细宪法
docs/**/AGENTS.md                 # 文档目录的局部规则
backend/**/AGENTS.md              # Scala/Cats/microservice 局部规则
frontend/**/AGENTS.md             # React/TS/Zustand/CSS 局部规则
templates/*.md                    # 从零或迁移项目时可复制的文档模板
USAGE.md                          # 使用方式与推荐 prompt
```

## 安装方式

把本目录内容复制到你的项目根目录。项目根目录应该能看到：

```text
your-project/
  AGENTS.md
  .codex/
  agent_constitutions/
  docs/
  backend/      # 如果项目有后端
  frontend/     # 如果项目有前端
```

然后在项目根目录启动 Codex。若你已有自己的 `AGENTS.md`，不要直接覆盖；先合并根规则，保留你的项目特有命令。

## 推荐对话方式

从零开始：

> 请按 Type-Safe workflow 从零开始帮我设计这个项目。先不要写代码，先采访我、解析产品图、建立 docs、对象关系、API contract 和 type safety registry。

半成品迁移：

> 请按 Type-Safe migration workflow 扫描当前项目。先只读，不改代码。请生成同构 docs/mirror，标记 safe / uncertain / unsafe，然后给出小步重构计划。

新功能：

> 请按 Type-Safe vertical slice workflow 加这个功能。先更新 docs 和 API registry，再实现，再运行检查 agent。

## 重要提醒

- `.codex/agents/*.toml` 是 Codex custom agents 配置；`agent_constitutions/*/AGENTS.md` 是详细角色宪法。
- Codex 通常只在你明确要求时 spawn subagents。根 `AGENTS.md` 已经说明：用户说“使用 workflow / 使用 agents / 从零构建 / 迁移为类型安全”时，可视为允许启用必要子 agent。
- 这些文件不会替你保证项目正确；它们的作用是让 Codex 每次工作都先回到同一套结构化规则。
