# 前端命名规范

## 文件命名

### 组件文件

```
// 推荐：PascalCase
UserProfile.tsx
NavigationBar.tsx
ButtonGroup.tsx

// 避免
user-profile.tsx
userprofile.tsx
```

### 工具文件

```
// 推荐：camelCase
formatDate.ts
useLocalStorage.ts
calculateTotal.ts

// 避免
format-date.ts
FormatDate.ts
```

### 类型文件

```
// 推荐：camelCase + Types 后缀
userTypes.ts
apiTypes.ts

// 或 PascalCase
User.ts
Api.ts
```

### 测试文件

```
// 推荐：与源文件同名 + .test
UserProfile.test.tsx
formatDate.test.ts

// 或 .spec
UserProfile.spec.tsx
```

## 变量命名

### 基本变量

```typescript
// 推荐：camelCase
const userName = 'John'
const itemCount = 10
const isActive = true

// 避免
const user_name = 'John'
const item_count = 10
const IS_ACTIVE = true
```

### 常量

```typescript
// 推荐：UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com'
const MAX_RETRY_COUNT = 3
const DEFAULT_TIMEOUT = 5000

// 或 camelCase（非全局常量）
const apiUrl = 'https://api.example.com'
```

### 布尔变量

```typescript
// 推荐：is/has/can/should 前缀
const isLoading = true
const hasPermission = false
const canEdit = true
const shouldUpdate = false

// 避免
const loading = true
const permission = false
```

### 数组和集合

```typescript
// 推荐：复数形式
const users: User[] = []
const items = new Map<string, Item>()
const activeIds = new Set<string>()

// 避免
const userList: User[] = []
const itemArray = []
```

### 事件处理函数

```typescript
// 推荐：handle 前缀
function handleClick() { ... }
function handleSubmit() { ... }
function handleChange() { ... }

// 或 on 前缀（Props）
interface ButtonProps {
  onClick: () => void
  onSubmit: () => void
  onChange: () => void
}
```

## 函数命名

### 普通函数

```typescript
// 推荐：动词开头
function getUser(id: string) { ... }
function calculateTotal(items: Item[]) { ... }
function formatDate(date: Date) { ... }

// 避免
function user(id: string) { ... }
function total(items: Item[]) { ... }
```

### 自定义 Hook

```typescript
// 推荐：use 前缀
function useUser(id: string) { ... }
function useLocalStorage(key: string) { ... }
function useDebounce<T>(value: T, delay: number) { ... }

// 避免
function getUser(id: string) { ... }
function localStorage(key: string) { ... }
```

### 工厂函数

```typescript
// 推荐：create 前缀
function createUser(data: CreateUser) { ... }
function createApi(config: ApiConfig) { ... }

// 或 make 前缀
function makeRequest(url: string) { ... }
```

## 类型命名

### 接口

```typescript
// 推荐：PascalCase，无 I 前缀
interface User {
  id: string
  name: string
}

interface ApiResponse<T> {
  data: T
  status: number
}

// 避免
interface IUser { ... }
interface API_Response { ... }
```

### 类型别名

```typescript
// 推荐：PascalCase
type Status = 'pending' | 'active' | 'inactive'
type EventHandler = (event: Event) => void

// 避免
type status = 'pending' | 'active' | 'inactive'
type eventHandler = (event: Event) => void
```

### 枚举

```typescript
// 推荐：PascalCase
enum UserRole {
  Admin = 'ADMIN',
  User = 'USER',
  Guest = 'GUEST',
}

// 避免
enum userRole { ... }
enum USER_ROLE { ... }
```

## 组件命名

### React 组件

```typescript
// 推荐：PascalCase
export function UserProfile({ user }: Props) { ... }
export function NavigationBar() { ... }

// 避免
export function userProfile({ user }: Props) { ... }
export function navigationBar() { ... }
```

### 高阶组件

```typescript
// 推荐：with 前缀
function withAuth(WrappedComponent: ComponentType) { ... }
function withLoading(WrappedComponent: ComponentType) { ... }

// 避免
function auth(WrappedComponent: ComponentType) { ... }
```

## CSS 类名

### BEM 命名

```css
/* 推荐：BEM 命名 */
.user-profile { }
.user-profile__avatar { }
.user-profile__name { }
.user-profile--active { }

/* 避免 */
.userProfile { }
.user-profile-avatar { }
.active-user { }
```

### Tailwind CSS

```typescript
// 使用 Tailwind 时，类名由框架提供
<div className="flex items-center gap-2 p-4">
  <span className="text-lg font-bold">Title</span>
</div>
```

## 命名检查清单

- [ ] 文件名：组件 PascalCase，工具 camelCase
- [ ] 变量：camelCase，布尔 is/has/can/should 前缀
- [ ] 常量：UPPER_SNAKE_CASE
- [ ] 函数：动词开头，Hook use 前缀
- [ ] 类型：PascalCase，无 I 前缀
- [ ] 组件：PascalCase
- [ ] CSS 类名：BEM 或 Tailwind
