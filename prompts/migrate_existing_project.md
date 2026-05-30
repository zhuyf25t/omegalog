# Prompt: 半成品项目迁移

请按 Type-Safe migration workflow 扫描当前项目。

第一轮只读，不改代码。

请完成：

1. migration_mapper 生成当前代码地图。
2. docs_creator 生成 docs/mirror 初版。
3. type_safety_checker 标记裸 ID、any、enum/string、失败处理、IO 边界问题。
4. boundary_checker 标记微服务、tables、objects、router、API client 越界。
5. api_alignment_checker 标记前后端 API 不一致。
6. verification_safety_lead 汇总 red/yellow/green 报告。

最后给出小步重构计划，不要一次性大改。
