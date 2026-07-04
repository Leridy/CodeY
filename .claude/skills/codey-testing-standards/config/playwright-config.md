# Playwright 配置指南

## 概述

Playwright 是 Microsoft 开发的端到端测试框架，支持 Chromium、Firefox、WebKit 多浏览器。

## 基础配置

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 测试目录
  testDir: './e2e',

  // 并行运行
  fullyParallel: true,

  // CI 环境下重试
  retries: process.env.CI ? 2 : 0,

  // 并行 worker 数量
  workers: process.env.CI ? 1 : undefined,

  // 报告器
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
  ],

  // 全局设置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',

    // 追踪配置
    trace: 'on-first-retry',

    // 截图配置
    screenshot: 'only-on-failure',

    // 视频配置
    video: 'retain-on-failure',

    // 超时设置
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 浏览器项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Web 服务器配置
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

## 浏览器配置

### 桌面浏览器

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ['--disable-gpu'],
        },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});
```

### 移动浏览器

```typescript
export default defineConfig({
  projects: [
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad (gen 7)'],
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
```

## 环境变量配置

### .env 文件

```bash
# .env.test
BASE_URL=http://localhost:3000
API_URL=http://localhost:3001
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123
```

### 使用环境变量

```typescript
// playwright.config.ts
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
});
```

## Fixtures 配置

### 自定义 Fixtures

```typescript
// e2e/fixtures/base.fixture.ts
import { test as base, expect } from '@playwright/test';

// 定义自定义 fixtures
export const test = base.extend({
  // 认证页面
  authenticatedPage: async ({ page }, use) => {
    // 登录
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard');

    await use(page);
  },

  // API 请求上下文
  apiContext: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({
      baseURL: process.env.API_URL,
      extraHTTPHeaders: {
        'Authorization': `Bearer ${process.env.API_TOKEN}`,
      },
    });

    await use(apiContext);
    await apiContext.dispose();
  },

  // 测试数据
  testData: async ({}, use) => {
    const data = {
      users: [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' },
      ],
    };
    await use(data);
  },
});

export { expect };
```

### 使用 Fixtures

```typescript
// e2e/tests/dashboard.spec.ts
import { test, expect } from '../fixtures/base.fixture';

test('should display user dashboard', async ({ authenticatedPage, testData }) => {
  await expect(authenticatedPage.getByText('Dashboard')).toBeVisible();
  await expect(authenticatedPage.getByText(testData.users[0].name)).toBeVisible();
});
```

## Page Object 配置

### Page Object 基类

```typescript
// e2e/page-objects/BasePage.ts
import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly url: string;

  constructor(page: Page, url: string = '/') {
    this.page = page;
    this.url = url;
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async expectTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }

  async expectUrl(url: string | RegExp) {
    await expect(this.page).toHaveURL(url);
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }
}
```

### 具体 Page Object

```typescript
// e2e/page-objects/LoginPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page, '/login');
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByRole('alert');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}
```

## 测试数据管理

### API 测试数据

```typescript
// e2e/helpers/test-data.ts
import { APIRequestContext } from '@playwright/test';

export async function seedTestData(apiContext: APIRequestContext) {
  // 创建测试用户
  await apiContext.post('/api/test/users', {
    data: {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    },
  });

  // 创建测试数据
  await apiContext.post('/api/test/orders', {
    data: [
      { userId: 1, product: 'Product A', amount: 100 },
      { userId: 1, product: 'Product B', amount: 200 },
    ],
  });
}

export async function cleanupTestData(apiContext: APIRequestContext) {
  await apiContext.post('/api/test/cleanup');
}
```

### 在测试中使用

```typescript
// e2e/tests/orders.spec.ts
import { test, expect } from '@playwright/test';
import { seedTestData, cleanupTestData } from '../helpers/test-data';

test.describe('Orders', () => {
  test.beforeEach(async ({ apiContext }) => {
    await seedTestData(apiContext);
  });

  test.afterEach(async ({ apiContext }) => {
    await cleanupTestData(apiContext);
  });

  test('should display user orders', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/orders');
    await expect(authenticatedPage.getByText('Product A')).toBeVisible();
    await expect(authenticatedPage.getByText('Product B')).toBeVisible();
  });
});
```

## CI/CD 配置

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test
        env:
          CI: true

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload test screenshots
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-screenshots
          path: test-results/
          retention-days: 7
```

## 调试配置

### VSCode 调试

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "pwa-chrome",
      "request": "launch",
      "name": "Debug Playwright",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/src/*"
      }
    }
  ]
}
```

### Playwright Inspector

```bash
# 打开 Playwright Inspector
npx playwright test --debug

# 调试特定测试
npx playwright test --debug tests/auth/login.spec.ts

# 使用 trace
npx playwright test --trace on
npx playwright show-trace trace.zip
```

## 性能优化

### 并行配置

```typescript
// playwright.config.ts
export default defineConfig({
  // 并行运行测试
  fullyParallel: true,

  // Worker 数量
  workers: process.env.CI ? 1 : 4,

  // 测试分片
  shard: process.env.SHARD ? { current: Number(process.env.SHARD), total: 4 } : undefined,
});
```

### 测试过滤

```typescript
// playwright.config.ts
export default defineConfig({
  // 只运行特定标签的测试
  grep: /@smoke/,

  // 排除特定测试
  grepInvert: /@slow/,
});
```

## 完整配置示例

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: process.env.BASE_URL || 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

## 检查清单

- [ ] 配置测试目录和并行运行
- [ ] 设置浏览器项目 (桌面 + 移动)
- [ ] 配置 baseURL 和环境变量
- [ ] 设置追踪、截图、视频配置
- [ ] 创建自定义 Fixtures
- [ ] 实现 Page Object Model
- [ ] 配置测试数据管理
- [ ] 设置 CI/CD 流水线
- [ ] 配置调试工具
- [ ] 优化性能 (并行、分片)
