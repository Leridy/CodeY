# CodeY 测试标准详细文档

## 测试金字塔

```
        /\
       /  \        E2E Tests (Playwright)
      /    \       - 关键用户流程
     /------\      - 跨浏览器验证
    /        \
   /          \    Component Tests (Testing Library)
  /            \   - UI 组件行为
 /--------------\  - 用户交互模拟
/                \
/                  \ Unit Tests (Vitest / cargo test)
/--------------------\ - 函数、工具、业务逻辑
                       - 快速、隔离、确定性
```

### 比例分配

| 测试类型 | 占比 | 执行时间 | 维护成本 |
|---------|------|---------|---------|
| Unit | 70% | < 1s | 低 |
| Component | 20% | 1-5s | 中 |
| E2E | 10% | 5-30s | 高 |

## 覆盖率目标

### 总体目标

| 指标 | 最低要求 | 目标 |
|------|---------|------|
| Line Coverage | 80% | 90% |
| Branch Coverage | 75% | 85% |
| Function Coverage | 80% | 90% |

### 按模块要求

| 模块类型 | 覆盖率要求 | 说明 |
|---------|-----------|------|
| 核心业务逻辑 | 95% | 必须全覆盖 |
| API 路由/处理器 | 90% | 包含错误路径 |
| 工具函数 | 90% | 纯函数，易于测试 |
| UI 组件 | 80% | 重点测试交互 |
| 配置/初始化 | 70% | 基本覆盖即可 |

## 测试配置概览

### Frontend (Vitest)

```typescript
// vitest.config.ts 核心配置
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

详细配置参考: [Vitest 配置](./config/vitest-config.md)

### E2E (Playwright)

```typescript
// playwright.config.ts 核心配置
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
});
```

详细配置参考: [Playwright 配置](./config/playwright-config.md)

### Backend (cargo test)

```toml
# Cargo.toml
[dev-dependencies]
tokio = { version = "1", features = ["full", "test-util"] }
mockall = "0.11"
```

## 最佳实践

### 1. 测试命名规范

```typescript
// Frontend: describe + it 模式
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when found', async () => {});
    it('should throw NotFoundError when user does not exist', async () => {});
    it('should handle database connection error', async () => {});
  });
});
```

```rust
// Backend: snake_case 函数名
#[test]
fn test_get_user_by_id_returns_user_when_found() {}

#[test]
fn test_get_user_by_id_returns_error_when_not_found() {}
```

### 2. AAA 模式 (Arrange-Act-Assert)

```typescript
it('should calculate total price with tax', () => {
  // Arrange
  const items = [{ price: 100 }, { price: 200 }];
  const taxRate = 0.1;

  // Act
  const total = calculateTotal(items, taxRate);

  // Assert
  expect(total).toBe(330);
});
```

### 3. Mock 策略

```typescript
// 使用 vi.mock 替换模块
vi.mock('../api/userApi', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'Test User' }),
}));

// 使用 mock 函数验证调用
const mockSave = vi.fn();
render(<UserForm onSave={mockSave} />);
// ... 触发保存
expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test' }));
```

```rust
// 使用 mockall crate
#[automock]
trait UserRepository {
    fn find_by_id(&self, id: i64) -> Result<User, Error>;
}

#[test]
fn test_user_service() {
    let mut mock_repo = MockUserRepository::new();
    mock_repo.expect_find_by_id()
        .returning(|_| Ok(User { id: 1, name: "Test".into() }));
}
```

### 4. 测试数据管理

```typescript
// 使用 factory 模式创建测试数据
const createUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
});

// 使用
const user = createUser({ name: 'Custom Name' });
```

### 5. 异步测试

```typescript
// 使用 async/await
it('should fetch data asynchronously', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

// 使用 fake timers
it('should debounce search', async () => {
  vi.useFakeTimers();
  const search = vi.fn();
  const debouncedSearch = debounce(search, 300);

  debouncedSearch('test');
  expect(search).not.toHaveBeenCalled();

  vi.advanceTimersByTime(300);
  expect(search).toHaveBeenCalledWith('test');
});
```

### 6. 测试隔离

- 每个测试独立运行，不依赖其他测试
- 使用 `beforeEach` 重置状态
- 避免共享可变状态
- 使用 `afterEach` 清理副作用

```typescript
describe('Counter', () => {
  let counter: Counter;

  beforeEach(() => {
    counter = new Counter();
  });

  it('should start at 0', () => {
    expect(counter.value).toBe(0);
  });

  it('should increment', () => {
    counter.increment();
    expect(counter.value).toBe(1);
  });
});
```

## 测试检查清单

### 提交前检查

- [ ] 所有测试通过
- [ ] 覆盖率达标 (80%+)
- [ ] 新功能有对应测试
- [ ] 测试命名清晰描述意图
- [ ] Mock 使用合理，不过度 mock
- [ ] 测试独立，不依赖执行顺序
- [ ] 异步测试正确处理

### Code Review 检查

- [ ] 测试覆盖正常路径和错误路径
- [ ] 边界条件已测试
- [ ] 测试数据合理，不硬编码敏感信息
- [ ] 无重复测试逻辑
- [ ] 测试可读性好，易于维护

## 相关文档

- [前端单元测试标准](./frontend/unit-tests.md)
- [前端组件测试标准](./frontend/component-tests.md)
- [前端 E2E 测试标准](./frontend/e2e-tests.md)
- [后端单元测试标准](./backend/unit-tests.md)
- [后端集成测试标准](./backend/integration-tests.md)
- [Vitest 配置](./config/vitest-config.md)
- [Playwright 配置](./config/playwright-config.md)
