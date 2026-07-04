# TypeScript 规范

## 类型定义

### 优先使用 interface

```typescript
// 推荐：interface 定义对象类型
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

// 联合类型使用 type
type Status = 'pending' | 'active' | 'inactive'

// 函数签名使用 type
type FetchUser = (id: string) => Promise<User>
```

### 避免 any

```typescript
// 错误：使用 any 会失去类型安全
function process(data: any) { ... }

// 正确：使用 unknown 并进行类型检查
function process(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase()
  }
}
```

## 函数规范

### 单一职责

```typescript
// 错误：函数做太多事情
function handleUser(id: string) {
  const user = fetchUser(id)
  sendEmail(user.email)
  updateAnalytics(user.id)
}

// 正确：拆分为多个小函数
function getUser(id: string): Promise<User> {
  return fetchUser(id)
}

function notifyUser(user: User): void {
  sendEmail(user.email)
}
```

### 明确返回类型

```typescript
// 推荐：显式返回类型
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// 复杂返回类型使用 interface
interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

function fetchData<T>(url: string): Promise<ApiResponse<T>> { ... }
```

## 错误处理

### 使用 Result 模式

```typescript
// 定义 Result 类型
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

// 使用示例
async function safeFetch(url: string): Promise<Result<Response>> {
  try {
    const response = await fetch(url)
    return { success: true, data: response }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}
```

### 自定义错误类型

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message)
    this.name = 'AppError'
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404)
  }
}
```

## 泛型约束

```typescript
// 使用 extends 约束泛型
interface HasId {
  id: string
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id)
}

// 条件类型
type IsString<T> = T extends string ? true : false
```

## 模块导出

```typescript
// 推荐：具名导出
export function UserService() { ... }
export interface UserConfig { ... }

// 避免：默认导出（不利于重构和 tree-shaking）
export default function UserService() { ... }
```

## 配置参考

`tsconfig.json` 关键配置：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```
