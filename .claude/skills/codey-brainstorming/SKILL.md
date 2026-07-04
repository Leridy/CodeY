# codey-brainstorming

定义 CodeY 项目的头脑风暴流程，用于需求收集、研究调研和 Spec 生成。通过渐进式问答将模糊想法转化为可执行的技术方案。

## 使用场景

当需要：
- 收到新的功能需求，需要澄清和细化
- 用户有一个模糊的想法，需要转化为可执行方案
- 在多种技术方案之间做出选择
- 生成 Spec 文档（design.md, api.md, test.md）
- 在动手写代码之前进行充分的调研和规划

## 快速开始

```
用户：我想给 CodeY 添加用户认证功能

Agent：好的，让我通过头脑风暴帮你细化这个需求。
       首先，你倾向于哪种认证方式？
       - 方案 A: JWT Token（无状态，适合分布式）
       - 方案 B: Session + Cookie（有状态，传统方式）
       - 方案 C: OAuth 2.0（第三方登录）

用户：JWT Token

Agent：接下来我来研究最佳实践和参考实现...
       [研究完成后]
       基于研究结果，我推荐 JWT + Refresh Token 方案。
       确认后我会生成 Spec 文档。
```

## 流程概览

```
Phase 1: 需求收集 → Phase 2: 研究调研 → Phase 3: 方案生成 → Phase 4: 细节确认 → Phase 5: Spec 生成
```

## 详细文档

- [README.md](./README.md) - 完整文档：流程说明、问题类型、研究整合、Spec 生成
- [flow/](./flow/) - 各阶段详细流程
  - [requirements.md](./flow/requirements.md) - 需求收集阶段
  - [research.md](./flow/research.md) - 研究调研阶段
  - [options.md](./flow/options.md) - 方案生成阶段
  - [confirmation.md](./flow/confirmation.md) - 细节确认阶段
  - [spec-generation.md](./flow/spec-generation.md) - Spec 生成阶段
- [questions/](./questions/) - 问题类型详解
  - [clarifying.md](./questions/clarifying.md) - 澄清问题
  - [technical.md](./questions/technical.md) - 技术问题
  - [tradeoff.md](./questions/tradeoff.md) - 权衡问题
- [templates/](./templates/) - Spec 文档模板
  - [spec-template.md](./templates/spec-template.md) - Spec 文档模板
  - [design-template.md](./templates/design-template.md) - 设计文档模板

## 核心原则

| 原则 | 说明 |
|------|------|
| 先理解后实现 | 充分理解需求后再动手 |
| 先提问后假设 | 有疑问就提问，不做假设 |
| 先 Spec 后代码 | Spec 确认后才开始写代码 |
| 多方案对比 | 每个决策点提供 2-3 个方案 |
| 用户决策 | Agent 提供分析，用户做出选择 |

## 研究工具优先级

```
1. GitHub 代码搜索   → 查找类似实现、参考项目、代码模式
2. Context7 文档查询  → 查询库/框架的官方文档和示例
3. Exa 网络搜索      → 更广泛的网络研究、最佳实践、技术文章
```

---

*Skill 版本：v1.0.0*
*创建日期：2026-07-05*
