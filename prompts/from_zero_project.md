# Prompt: 从零项目

请按这个仓库的 Type-Safe Codex workflow 从零开始构建项目。

第一轮不要写代码。请作为主 agent：

1. 采访我，澄清用户角色、核心流程、产品图含义。
2. 调用 product_ux_interpreter 解析页面和交互。
3. 调用 topos_domain_architect 建对象、关系、状态机、不变量。
4. 调用 docs_creator 创建 docs 树。
5. 调用 docs_critic 和 object_relation_optimizer 挑刺优化。
6. 调用 api_contract_alignment 起草 API registry。
7. 最后输出阶段报告和下一步可实现的 vertical slice。
