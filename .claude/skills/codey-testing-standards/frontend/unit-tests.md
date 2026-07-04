# 前端单元测试标准 (Vitest)

## 概述

使用 Vitest 作为前端单元测试框架，测试纯函数、工具函数、业务逻辑等独立模块。

## 文件组织

```
src/
├── utils/
│   ├── format.ts
│   └── format.test.ts      # 与源文件同目录
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts
└── services/
    ├── api.ts
    └── __tests__/
        └── api.test.ts     # 或使用 __tests__ 目录
```

### 命名规范

- 测试文件: `{filename}.test.ts` 或 `{filename}.spec.ts`
- 推荐使用 `.test.ts` 保持一致性

## 测试结构

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatCurrency, parseCurrency } from '../format';

describe('Currency Utils', () => {
  describe('formatCurrency', () => {
    it('should format number with default locale', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format with custom currency', () => {
      expect(formatCurrency(100, 'EUR')).toBe('€100.00');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-50)).toBe('-$50.00');
    });
  });

  describe('parseCurrency', () => {
    it('should parse formatted string to number', () => {
      expect(parseCurrency('$1,234.56')).toBe(1234.56);
    });

    it('should return NaN for invalid input', () => {
      expect(parseCurrency('invalid')).toBeNaN();
    });
  });
});
```

## 测试覆盖要求

### 必须测试的场景

1. **正常路径** - 预期输入产生预期输出
2. **边界条件** - 空值、零值、最大值、最小值
3. **错误处理** - 无效输入、异常情况
4. **类型转换** - 不同类型输入的处理

### 示例: 边界条件测试

```typescript
describe('clamp', () => {
  it('should return value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('should return min when value is below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('should return max when value is above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should handle when min equals max', () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });
});
```

## Mock 使用指南

### Mock 函数

```typescript
// 创建 mock 函数
const mockFn = vi.fn();

// 带返回值
const mockFn = vi.fn().mockReturnValue(42);

// 异步返回值
const mockFn = vi.fn().mockResolvedValue({ data: 'test' });

// 验证调用
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(2);
```

### Mock 模块

```typescript
// 完整替换模块
vi.mock('../api/client', () => ({
  get: vi.fn().mockResolvedValue({ data: {} }),
  post: vi.fn().mockResolvedValue({ data: {} }),
}));

// 部分替换
vi.mock('../utils/logger', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    log: vi.fn(),  // 只替换 log 函数
  };
});
```

### Mock 环境变量

```typescript
// 使用 vi.stubEnv
vi.stubEnv('VITE_API_URL', 'http://test.api.com');

// 恢复
vi.unstubAllEnvs();
```

## 测试 Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../hooks/useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should accept initial value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });
});
```

## 异步测试

### Promise / async-await

```typescript
it('should fetch user data', async () => {
  const user = await fetchUser(1);
  expect(user).toEqual({ id: 1, name: 'Test User' });
});

it('should handle fetch error', async () => {
  await expect(fetchUser(999)).rejects.toThrow('User not found');
});
```

### Timer Mock

```typescript
it('should debounce function calls', () => {
  vi.useFakeTimers();
  const callback = vi.fn();
  const debounced = debounce(callback, 300);

  debounced();
  debounced();
  debounced();

  expect(callback).not.toHaveBeenCalled();

  vi.advanceTimersByTime(300);
  expect(callback).toHaveBeenCalledTimes(1);

  vi.useRealTimers();
});
```

## 常见错误

### 错误: 测试依赖外部状态

```typescript
// 错误 - 依赖全局状态
let counter = 0;

it('should increment', () => {
  counter++;
  expect(counter).toBe(1);
});

// 正确 - 每次测试重置
describe('Counter', () => {
  let counter: number;

  beforeEach(() => {
    counter = 0;
  });

  it('should increment', () => {
    counter++;
    expect(counter).toBe(1);
  });
});
```

### 错误: 测试实现细节

```typescript
// 错误 - 测试内部实现
it('should call setState', () => {
  const spy = vi.spyOn(component, 'setState');
  component.handleClick();
  expect(spy).toHaveBeenCalled();
});

// 正确 - 测试行为和输出
it('should update display when clicked', async () => {
  render(<Button />);
  await userEvent.click(screen.getByRole('button'));
  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

## 覆盖率配置

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

## 运行命令

```bash
# 运行所有单元测试
npx vitest run

# 运行特定文件
npx vitest run src/utils/format.test.ts

# 带覆盖率
npx vitest run --coverage

# 监听模式
npx vitest watch

# UI 模式
npx vitest --ui
```

## 检查清单

- [ ] 测试文件与源文件在同一目录或 `__tests__` 目录
- [ ] 使用 `describe` 分组，`it` 描述具体行为
- [ ] 覆盖正常路径、边界条件、错误处理
- [ ] Mock 使用合理，不过度 mock
- [ ] 测试独立，不依赖执行顺序
- [ ] 异步测试正确使用 `async/await`
- [ ] 覆盖率达到 80%+
