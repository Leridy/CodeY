# Phase 5: Spec 生成（Spec Generation）

## 目标

生成完整的 Spec 文档，保存到指定目录。

## 流程

```
1. 生成 design.md
   - 功能概述
   - 架构设计
   - 数据模型
   - 技术选型
   - 实现细节

2. 生成 api.md
   - API 列表
   - 请求/响应格式
   - 错误码
   - 示例

3. 生成 test.md
   - 测试范围
   - 测试用例
   - 测试工具
   - 覆盖率目标

4. 保存到 docs/specs/YYYY-MM-DD-<feature>/
5. 提交用户审批
```

## 目录结构

```
docs/
└── specs/
    └── YYYY-MM-DD-<feature>/
        ├── design.md          # 设计文档：架构决策、数据模型、技术选型
        ├── api.md             # API 规范：接口定义、请求/响应格式、错误码
        └── test.md            # 测试规范：测试策略、用例清单、覆盖率目标
```

## 命名规范

- 目录名：`YYYY-MM-DD-<feature>`，如 `2026-07-05-user-auth`
- 文件名：固定为 `design.md`、`api.md`、`test.md`
- 特性名使用小写连字符：`user-auth`、`file-upload`、`agent-protocol`

## Spec 头部模板

```markdown
# <功能名称>

> 版本：v1.0.0
> 日期：YYYY-MM-DD
> 作者：<作者>
> 状态：[draft | review | approved]
```

## Spec 文档模板

### design.md

详见：[../templates/design-template.md](../templates/design-template.md)

```markdown
# 功能设计文档

> 版本：v1.0.0
> 日期：YYYY-MM-DD
> 作者：<作者>
> 状态：draft

## 概述

### 功能描述
- 这个功能做什么
- 解决什么问题
- 目标用户是谁

### 设计目标
- 目标 1
- 目标 2
- 目标 3

## 架构设计

### 整体架构
- 系统组件图
- 数据流图
- 依赖关系

### 组件设计
- 组件 1：职责、接口、依赖
- 组件 2：职责、接口、依赖

### 数据流
- 请求流程
- 响应流程
- 错误处理流程

## 数据模型

### 实体定义
- 实体 1：字段、类型、约束
- 实体 2：字段、类型、约束

### 关系
- 实体间关系
- 外键约束

## 技术选型

| 组件 | 技术选型 | 理由 |
|------|----------|------|
| 前端框架 | ... | ... |
| 状态管理 | ... | ... |
| 后端框架 | ... | ... |
| 数据库 | ... | ... |

## 实现细节

### 关键算法
- 算法描述
- 复杂度分析

### 注意事项
- 边界条件
- 异常处理
- 性能考量
```

### api.md

```markdown
# API 规范

> 版本：v1.0.0
> 日期：YYYY-MM-DD
> 作者：<作者>
> 状态：draft

## API 列表

### <API 名称 1>

**端点**：`METHOD /api/v1/<resource>`

**描述**：...

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ... | ... | ... | ... |

**请求体**：

```json
{
  "field1": "value1",
  "field2": "value2"
}
```

**响应格式**：

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

**错误码**：

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### <API 名称 2>
...

## 示例

### 请求示例
```bash
curl -X POST https://api.example.com/v1/<resource> \
  -H "Content-Type: application/json" \
  -d '{"field1": "value1"}'
```

### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "123",
    "field1": "value1"
  }
}
```
```

### test.md

```markdown
# 测试规范

> 版本：v1.0.0
> 日期：YYYY-MM-DD
> 作者：<作者>
> 状态：draft

## 测试范围

### 单元测试
- 测试对象：核心函数、工具类、组件
- 覆盖率目标：>= 80%
- 测试工具：Vitest

### 集成测试
- 测试对象：API 端点、模块交互
- 覆盖率目标：>= 70%
- 测试工具：Vitest + Supertest

### E2E 测试
- 测试对象：关键用户流程
- 覆盖率目标：100% 关键路径
- 测试工具：Playwright

## 测试用例

### <功能模块 1>

| 测试场景 | 输入 | 预期结果 | 测试类型 |
|----------|------|----------|----------|
| 正常场景 | ... | ... | 单元测试 |
| 边界条件 | ... | ... | 单元测试 |
| 异常输入 | ... | ... | 单元测试 |

### <功能模块 2>
...

## 测试工具

| 工具 | 用途 | 版本 |
|------|------|------|
| Vitest | 单元测试和集成测试 | latest |
| Testing Library | 组件测试 | latest |
| Playwright | E2E 测试 | latest |
| MSW | API Mock | latest |

## 测试数据

### Mock 数据
- 数据类型 1：描述
- 数据类型 2：描述

### 测试环境
- 环境变量
- 数据库配置
- API 配置
```

## Spec 审批流程

1. Agent 生成 Spec 文档
2. 提交用户审批
3. 用户 review 并提供反馈
4. Agent 根据反馈修改
5. 用户确认后标记为 `approved`
6. 进入开发流程

## 下一步

Spec 审批通过后，进入开发流程（codey-dev-workflow Phase 2-5）。

---

*阶段版本：v1.0.0*
*创建日期：2026-07-05*
