# CodeY Testing Standards Skill

CodeY 项目的统一测试标准。定义前端 (Vitest + Testing Library + Playwright) 和后端 (cargo test) 的测试规范，确保 80%+ 覆盖率和一致的测试质量。

## When to Use

- 编写新功能的测试时
- 需要了解项目测试配置和覆盖率要求时
- 调试测试失败或配置问题时
- Code Review 检查测试质量时

## Quick Start

```typescript
// Frontend: Vitest unit test example
import { describe, it, expect } from 'vitest';
import { formatToken } from '../utils/format';

describe('formatToken', () => {
  it('should format token amount correctly', () => {
    expect(formatToken(1000000)).toBe('1,000,000');
  });

  it('should handle zero', () => {
    expect(formatToken(0)).toBe('0');
  });
});
```

```rust
// Backend: cargo test unit test example
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

## Full Documentation

- [详细测试标准 README](./README.md)
- [前端单元测试](./frontend/unit-tests.md)
- [前端组件测试](./frontend/component-tests.md)
- [前端 E2E 测试](./frontend/e2e-tests.md)
- [后端单元测试](./backend/unit-tests.md)
- [后端集成测试](./backend/integration-tests.md)
- [Vitest 配置](./config/vitest-config.md)
- [Playwright 配置](./config/playwright-config.md)
