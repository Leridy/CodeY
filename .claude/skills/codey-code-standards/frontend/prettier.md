# Prettier 配置规范

## 配置文件

创建 `.prettierrc`：

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "jsxSingleQuote": true,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## 配置说明

| 选项 | 值 | 说明 |
|------|-----|------|
| `semi` | false | 不使用分号 |
| `singleQuote` | true | 使用单引号 |
| `tabWidth` | 2 | 缩进 2 空格 |
| `trailingComma` | all | 尾逗号 |
| `printWidth` | 80 | 行宽 80 字符 |
| `bracketSpacing` | true | 对象括号空格 |
| `arrowParens` | avoid | 箭头函数单参数省略括号 |
| `endOfLine` | lf | 换行符 LF |
| `jsxSingleQuote` | true | JSX 使用单引号 |

## 忽略文件

创建 `.prettierignore`：

```
dist/
build/
node_modules/
*.min.js
*.min.css
package-lock.json
pnpm-lock.yaml
```

## VS Code 集成

在 `.vscode/settings.json` 中：

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## 格式化效果示例

```typescript
// 格式化前
const user={name:'John',age:30,city:'New York'}

// 格式化后
const user = { name: 'John', age: 30, city: 'New York' }

// 箭头函数
const items = [1, 2, 3].map((item) => item * 2)

// 函数定义
function greet(name: string) {
  return `Hello, ${name}!`
}
```

## 常用命令

```bash
# 格式化所有文件
npx prettier --write .

# 检查格式（不修改）
npx prettier --check .

# 格式化特定文件
npx prettier --write src/components/Button.tsx
```

## 与 ESLint 配合

使用 `eslint-config-prettier` 避免冲突：

```javascript
// eslint.config.js
import prettier from 'eslint-config-prettier'

export default [
  // ... 其他配置
  prettier,  // 放在最后，关闭与 Prettier 冲突的规则
]
```
