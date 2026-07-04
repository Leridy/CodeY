---
name: codey-testing-standards
description: 在编写新功能测试、了解测试配置、调试测试失败或代码审查检查测试质量时使用此 skill。定义前端 (Vitest + Playwright) 和后端 (cargo test) 的测试规范。触发关键词："测试"、"test"、"覆盖率"、"Vitest"、"Playwright"、"cargo test"、"单元测试"、"E2E"。
---

# 测试标准 Skill

CodeY 项目的统一测试标准，确保 80%+ 覆盖率和一致的测试质量。

## 何时激活

- 编写新功能的测试时
- 需要了解项目测试配置和覆盖率要求时
- 调试测试失败或配置问题时
- 代码审查检查测试质量时

## 测试金字塔

```
        /\
       /  \        E2E Tests (Playwright) - 10%
      /    \
     /------\      Component Tests (Testing Library) - 20%
    /        \
   /          \    Unit Tests (Vitest / cargo test) - 70%
  /            \
 /──────────────\
```

## 覆盖率目标

| 指标 | 最低要求 | 目标 |
|------|---------|------|
| Line Coverage | 80% | 90% |
| Branch Coverage | 75% | 85% |
| Function Coverage | 80% | 90% |

## 前端测试（Vitest）

```typescript
import { describe, it, expect } from 'vitest';

describe('formatToken', () => {
  it('should format token amount correctly', () => {
    expect(formatToken(1000000)).toBe('1,000,000');
  });
});
```

## 后端测试（cargo test）

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_fee() {
        let result = calculate_fee(100, 0.01);
        assert_eq!(result, 1);
    }
}
```

## 测试最佳实践

**命名规范**：`describe` + `it` 模式，清晰描述意图

**AAA 模式**：Arrange（准备）→ Act（执行）→ Assert（断言）

**测试隔离**：每个测试独立，使用 `beforeEach` 重置状态

## 测试检查清单

- [ ] 所有测试通过
- [ ] 覆盖率达标 (80%+)
- [ ] 新功能有对应测试
- [ ] 测试命名清晰
- [ ] Mock 使用合理
- [ ] 测试独立不依赖顺序

## 内置资源

- `frontend/` - 前端测试规范
- `backend/` - 后端测试规范
- `config/` - Vitest 和 Playwright 配置

完整文档见 `README.md`。
