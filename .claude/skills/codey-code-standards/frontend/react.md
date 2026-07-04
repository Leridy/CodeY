# React 规范

## 组件定义

### 使用函数组件

```typescript
// 推荐：函数组件 + TypeScript
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export function Button({ 
  label, 
  onClick, 
  variant = 'primary', 
  disabled = false 
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  )
}
```

### Props 解构

```typescript
// 推荐：解构 props，设置默认值
export function UserCard({ name, email, avatar }: UserCardProps) {
  return (
    <div className="user-card">
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  )
}
```

## Hooks 使用

### 自定义 Hook

```typescript
// 自定义 Hook 以 use 开头
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [userId])

  return { user, isLoading, error }
}
```

### Hook 依赖

```typescript
// 错误：缺少依赖
useEffect(() => {
  fetchData(userId)
}, [])  // userId 未在依赖中

// 正确：完整依赖
useEffect(() => {
  fetchData(userId)
}, [userId])
```

## 状态管理

### 本地状态

```typescript
// 简单状态
const [count, setCount] = useState(0)

// 对象状态：不可变更新
const [user, setUser] = useState<User>({ name: '', email: '' })
setUser(prev => ({ ...prev, name: 'New Name' }))
```

### 复杂状态使用 useReducer

```typescript
type Action = 
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'RESET' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 }
    case 'DECREMENT':
      return { ...state, count: state.count - 1 }
    case 'RESET':
      return { ...state, count: 0 }
  }
}
```

## 条件渲染

```typescript
// 推荐：简洁的条件渲染
function UserPage({ user }: { user: User | null }) {
  if (!user) return <LoadingSpinner />
  
  return (
    <div>
      <h1>{user.name}</h1>
      {user.bio && <p>{user.bio}</p>}
    </div>
  )
}
```

## 列表渲染

```typescript
// 推荐：使用稳定且唯一的 key
function UserList({ users }: { users: User[] }) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>  {/* 使用 id，避免使用 index */}
          {user.name}
        </li>
      ))}
    </ul>
  )
}
```

## 性能优化

### memo 和 useMemo

```typescript
// 避免不必要的重渲染
const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  const processed = useMemo(() => processData(data), [data])
  return <div>{processed}</div>
})
```

### useCallback

```typescript
// 稳定的回调引用
function Parent() {
  const handleClick = useCallback((id: string) => {
    console.log(id)
  }, [])

  return <Child onClick={handleClick} />
}
```

## 文件组织

```
components/
  Button/
    Button.tsx        # 组件实现
    Button.test.tsx   # 测试文件
    Button.stories.tsx # Storybook 故事
    index.ts          # 导出
```
