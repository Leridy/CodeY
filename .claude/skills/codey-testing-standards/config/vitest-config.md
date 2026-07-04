# Vitest 配置指南

## 概述

Vitest 是 Vite 原生的测试框架，提供快速的单元测试和组件测试支持。

## 基础配置

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // 全局 API
    globals: true,
    environment: 'jsdom',

    // 设置文件
    setupFiles: ['./src/test/setup.ts'],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },

    // 测试文件匹配
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],

    // 超时设置
    testTimeout: 10000,
    hookTimeout: 10000,

    // 并发设置
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
      },
    },
  },
});
```

## 环境配置

### 多环境支持

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom', // 默认环境
    environmentMatchGlobs: [
      ['src/components/**', 'jsdom'],
      ['src/utils/**', 'node'],
      ['src/server/**', 'node'],
    ],
  },
});
```

### 环境变量

```typescript
// src/test/setup.ts
import { vi } from 'vitest';

// Mock 环境变量
vi.stubEnv('VITE_API_URL', 'http://localhost:3001');
vi.stubEnv('VITE_APP_ENV', 'test');
```

## Setup 文件

### src/test/setup.ts

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// MSW 服务器
export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

// Mock 浏览器 API
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('sessionStorage', sessionStorageMock);
```

## MSW Handlers

### src/test/handlers.ts

```typescript
import { rest } from 'msw';

export const handlers = [
  // 用户 API
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
      ])
    );
  }),

  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.json({
        id: Number(id),
        name: 'Test User',
        email: 'test@example.com',
      })
    );
  }),

  rest.post('/api/users', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(201),
      ctx.json({ id: 3, ...body })
    );
  }),
];
```

## 路径别名

```typescript
// vitest.config.ts
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@utils': resolve(__dirname, './src/utils'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@services': resolve(__dirname, './src/services'),
    },
  },
  test: {
    // Vitest 会自动使用 Vite 的别名配置
  },
});
```

## 自定义匹配器

```typescript
// src/test/matchers.ts
import { expect } from 'vitest';

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// 声明类型
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinRange(floor: number, ceiling: number): T;
  }
}
```

## 性能优化

### 排除慢测试

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    exclude: [
      'node_modules',
      'dist',
      'e2e',
      '**/*.slow.test.ts',  // 排除慢测试
    ],
  },
});
```

### 并行测试配置

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'forks',  // 使用进程隔离
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 4,
        minForks: 1,
      },
    },
    sequence: {
      shuffle: true,  // 随机顺序运行
    },
  },
});
```

## 调试配置

### VSCode 调试

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current Test File",
      "autoAttachChildProcesses": true,
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
      "program": "${workspaceRoot}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${relativeFile}"],
      "smartStep": true,
      "console": "integratedTerminal"
    }
  ]
}
```

### 命令行调试

```bash
# 调试特定测试
npx vitest run --inspect-brk src/utils/format.test.ts

# 使用 Node.js inspect
node --inspect-brk ./node_modules/.bin/vitest run src/utils/format.test.ts
```

## CI/CD 配置

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## 常见问题

### 1. 模块解析错误

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    deps: {
      inline: ['@mui/material'],  // 内联特定依赖
    },
  },
});
```

### 2. CSS 模块 Mock

```typescript
// src/test/setup.ts
vi.mock('*.module.css', () => ({
  default: new Proxy({}, {
    get: (_, key) => key,
  }),
}));
```

### 3. 图片 Mock

```typescript
// src/test/setup.ts
vi.mock('*.png', () => ({
  default: 'test-file-stub',
}));

vi.mock('*.svg', () => ({
  default: 'svg-stub',
  ReactComponent: () => 'SvgComponent',
}));
```

## 完整配置示例

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],
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
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
      },
    },
  },
});
```

## 检查清单

- [ ] 配置 globals 和 environment
- [ ] 设置 setupFiles 加载测试工具
- [ ] 配置覆盖率阈值 (80%+)
- [ ] 设置路径别名
- [ ] 配置 MSW handlers
- [ ] Mock 浏览器 API (matchMedia, localStorage)
- [ ] 配置 CI/CD 流水线
- [ ] 设置调试配置
