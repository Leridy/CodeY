# codey-dev-workflow

CodeY 项目的标准化多 Agent 协作开发工作流。从头脑风暴到代码提交，确保开发流程一致性、进度可追踪、质量有保障。

## 何时使用

- 启动新功能开发时
- 多 Agent 环境下需要协调开发任务时
- 需要规范化 Spec-Driven Development 流程时
- 追踪项目进度、规范化提交和版本管理时

## 快速开始

```
用户请求 → 主 Agent 头脑风暴 → 生成 Spec → 开发子 Agent 实现 → 测试子 Agent 验证 → 审查子 Agent 审查 → 主 Agent 验收提交
```

**示例**：用户说 "实现文件上传功能" → 主 Agent 澄清需求并生成 Spec → 开发 Agent 按 Spec 实现 → 测试 Agent 编写测试 → 审查 Agent 检查代码 → 主 Agent 提交并更新进度。

## 详细文档

- [README.md](./README.md) - 完整工作流文档、Agent 角色、配置说明
- [workflow/](./workflow/) - 各阶段详细流程
- [agents/](./agents/) - Agent 角色职责定义
- [templates/](./templates/) - 进度文件和提交信息模板

## 核心原则

1. **Spec 先行**：没有 Spec 不写代码
2. **进度透明**：progress.md 是唯一任务真相来源
3. **原子提交**：每次提交代表一个可工作的状态
4. **独立审查**：审查 Agent 独立于开发 Agent
