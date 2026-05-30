# 使用说明

## 1. 第一次放入项目

把 zip 解压后的内容复制到项目根目录。如果你的项目已有 `backend/`、`frontend/`、`docs/`，可以直接合并目录；如果还没有，它们会作为模板目录存在。

启动 Codex 后先运行一个轻量验证：

```bash
codex --ask-for-approval never "Summarize the active project instructions."
```

你希望看到 Codex 提到：declarative、type safe、modular、docs first、microservice boundary、API alignment、FP/IO edge、React core state 等关键词。

## 2. 从零开始项目的推荐 prompt

```text
请按这个仓库的 Type-Safe Codex workflow 从零开始构建项目。
先不要写代码。请作为主 agent 采访我，必要时调用 product_ux_interpreter、topos_domain_architect、docs_creator、docs_critic、api_contract_alignment 等子 agent。
第一阶段输出：vision、user journeys、object catalog、relation catalog、state machines、API registry 草案、type_safety_registry 草案。
```

## 3. 半成品项目迁移的推荐 prompt

```text
请按 Type-Safe migration workflow 扫描当前项目。
第一轮只读，不改代码。
请调用 migration_mapper 生成现状地图，再调用 docs_creator 生成同构 docs/mirror，然后调用 type_safety_checker、boundary_checker、api_alignment_checker 标记 safe / uncertain / unsafe。
最后给出小步重构计划，不要一次性大改。
```

## 4. 新功能的推荐 prompt

```text
请按 Type-Safe vertical slice workflow 加入这个功能：<功能描述>。
先更新 docs/02_topos 和 docs/03_contracts，再实现后端 API、前端 API client、页面状态和数据库表，最后运行 checker 并更新 docs/07_checks。
```

## 5. 代码审查的推荐 prompt

```text
请使用 verification_safety_lead 组织审查。让 docs_sync_checker、type_safety_checker、boundary_checker、api_alignment_checker、frontend_state_checker、concurrency_checker、test_checker 分别检查当前改动，最后合并成 red/yellow/green 报告。
```

## 6. 你应该期待 Codex 怎样回答

好的回答应该包含：

- 当前阶段。
- 要调用哪些 agent，为什么。
- 要读哪些 docs / 代码路径。
- 结构性风险。
- 修改计划。
- 验证命令。
- 仍然 uncertain 的项目。

如果 Codex 一上来就写大量代码，可以提醒它：回到 root `AGENTS.md` 的 docs-first workflow。
