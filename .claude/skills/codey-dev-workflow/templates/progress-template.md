# CodeY 进度跟踪

> 最后更新：YYYY-MM-DD HH:MM
> 当前阶段：开发实现

## 当前迭代

### 功能：<功能名称>
> Spec：docs/specs/YYYY-MM-DD-<feature>/
> 开始时间：YYYY-MM-DD HH:MM

- [x] 创建 Spec 文档 (YYYY-MM-DD HH:MM)
- [x] 实现核心模块 (YYYY-MM-DD HH:MM)
- [~] 编写单元测试
- [ ] 代码审查
- [ ] 集成测试

## 已完成迭代

### 功能：<已完成功能名称>
> 完成时间：YYYY-MM-DD HH:MM
> 提交：<commit hash>

- [x] 任务 A (YYYY-MM-DD HH:MM)
- [x] 任务 B (YYYY-MM-DD HH:MM)
- [x] 任务 C (YYYY-MM-DD HH:MM)

## 待办池

- [ ] 功能 X - 待 Spec 编写
- [ ] 功能 Y - 待优先级确认

---

## 使用说明

### 任务状态标记

| 状态 | 标记 | 说明 |
|------|------|------|
| pending | `- [ ]` | 待办，未开始 |
| in_progress | `- [~]` | 进行中 |
| completed | `- [x]` | 已完成 |
| blocked | `- [!]` | 阻塞，需要人工介入 |

### 更新规则

1. 每个任务完成后必须立即更新进度文件
2. 进度更新与代码提交绑定（同一 commit 或紧随其后）
3. 主 Agent 负责验收和更新进度状态
4. 子 Agent 只读取进度，不直接修改

### 时间格式

- 日期时间：`YYYY-MM-DD HH:MM`
- 示例：`2026-07-05 14:30`
