# ESLint 配置规范

## 配置文件

使用扁平配置格式 `eslint.config.js`：

```javascript
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      
      // React 规则
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // 通用规则
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.js'],
  }
)
```

## 核心规则说明

### TypeScript 规则

| 规则 | 级别 | 说明 |
|------|------|------|
| `no-unused-vars` | error | 未使用的变量，允许 `_` 前缀 |
| `explicit-function-return-type` | warn | 函数需要显式返回类型 |
| `no-explicit-any` | error | 禁止使用 any |
| `consistent-type-imports` | error | 使用 `import type` 导入类型 |

### React 规则

| 规则 | 级别 | 说明 |
|------|------|------|
| `react-in-jsx-scope` | off | React 18+ 不需要导入 React |
| `prop-types` | off | 使用 TypeScript 替代 PropTypes |
| `rules-of-hooks` | error | Hook 调用规则 |
| `exhaustive-deps` | warn | useEffect 依赖完整性 |

### 通用规则

| 规则 | 级别 | 说明 |
|------|------|------|
| `no-console` | warn | 限制 console 使用 |
| `prefer-const` | error | 优先使用 const |
| `no-var` | error | 禁止使用 var |

## 忽略文件

创建 `.eslintignore`：

```
dist/
build/
node_modules/
*.config.js
*.config.ts
```

## VS Code 集成

在 `.vscode/settings.json` 中：

```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

## 常用命令

```bash
# 检查所有文件
npx eslint .

# 自动修复
npx eslint . --fix

# 检查特定文件
npx eslint src/components/Button.tsx
```
