# 前端文件结构

## 目录结构

```
src/
├── app/                    # Next.js App Router 或入口
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/             # 共享组件
│   ├── ui/                 # 基础 UI 组件
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── layout/             # 布局组件
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   └── features/           # 功能组件
│       ├── auth/
│       │   ├── LoginForm.tsx
│       │   └── RegisterForm.tsx
│       └── user/
│           ├── UserProfile.tsx
│           └── UserList.tsx
├── hooks/                  # 自定义 Hooks
│   ├── useAuth.ts
│   ├── useLocalStorage.ts
│   └── index.ts
├── lib/                    # 工具库
│   ├── api/                # API 客户端
│   │   ├── client.ts
│   │   ├── endpoints.ts
│   │   └── types.ts
│   ├── utils/              # 工具函数
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   └── validations/        # 验证逻辑
│       ├── schemas.ts
│       └── rules.ts
├── stores/                 # 状态管理
│   ├── auth.ts
│   └── ui.ts
├── types/                  # 类型定义
│   ├── api.ts
│   ├── models.ts
│   └── index.ts
├── styles/                 # 样式文件
│   ├── globals.css
│   ├── variables.css
│   └── components/
└── config/                 # 配置文件
    ├── routes.ts
    ├── constants.ts
    └── env.ts
```

## 目录说明

### app/

Next.js App Router 目录，包含页面和布局。

```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
```

### components/

共享组件目录，按功能分类。

#### ui/

基础 UI 组件，如按钮、输入框、模态框等。

```typescript
// components/ui/Button/index.ts
export { Button } from './Button'
export type { ButtonProps } from './Button'
```

#### layout/

布局组件，如头部、底部、侧边栏等。

#### features/

功能组件，按业务功能组织。

### hooks/

自定义 Hooks 目录。

```typescript
// hooks/useAuth.ts
export function useAuth() {
  // 认证逻辑
}
```

### lib/

工具库目录，包含 API 客户端和工具函数。

#### api/

API 客户端和端点定义。

```typescript
// lib/api/client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})
```

#### utils/

工具函数目录。

```typescript
// lib/utils/format.ts
export function formatDate(date: Date): string { ... }
export function formatCurrency(amount: number): string { ... }
```

### stores/

状态管理目录，使用 Zustand 或 Redux。

### types/

类型定义目录，集中管理 TypeScript 类型。

### styles/

样式文件目录，包含全局样式和变量。

### config/

配置文件目录，包含路由、常量和环境变量。

## 文件命名规范

### 组件文件

```
// 推荐：PascalCase
UserProfile.tsx
NavigationBar.tsx
ButtonGroup.tsx
```

### 工具文件

```
// 推荐：camelCase
formatDate.ts
useLocalStorage.ts
calculateTotal.ts
```

### 测试文件

```
// 推荐：与源文件同名 + .test
UserProfile.test.tsx
formatDate.test.ts
```

## 导入顺序

```typescript
// 1. 第三方库
import React from 'react'
import { useRouter } from 'next/navigation'

// 2. 内部组件
import { Button } from '@/components/ui/Button'
import { Header } from '@/components/layout/Header'

// 3. Hooks
import { useAuth } from '@/hooks/useAuth'

// 4. 工具函数
import { formatDate } from '@/lib/utils/format'

// 5. 类型
import type { User } from '@/types/models'

// 6. 样式
import './styles.css'
```

## 最佳实践

### 1. 保持目录扁平

避免过深的目录嵌套，一般不超过 3 层。

```
// 推荐
components/
  Button/
    Button.tsx

// 避免
components/
  ui/
    forms/
      buttons/
        primary/
          Button.tsx
```

### 2. 使用 index.ts 导出

每个目录使用 `index.ts` 统一导出。

```typescript
// components/ui/Button/index.ts
export { Button } from './Button'
export type { ButtonProps } from './Button'
```

### 3. 按功能组织

将相关文件放在同一目录。

```
// 推荐
features/
  auth/
    LoginForm.tsx
    useAuth.ts
    authApi.ts

// 避免
components/
  LoginForm.tsx
hooks/
  useAuth.ts
api/
  authApi.ts
```

### 4. 分离关注点

将不同类型的代码放在不同目录。

```
components/  # UI 组件
hooks/       # 业务逻辑
lib/         # 工具函数
types/       # 类型定义
```
