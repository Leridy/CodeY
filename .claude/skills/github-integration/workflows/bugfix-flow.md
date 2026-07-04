# Bug Fix 工作流

从 Issue 到修复的完整工作流，确保 Bug 被正确识别、修复和验证。

---

## 流程概览

```
Issue 分析 → 根因定位 → 修复实现 → 测试验证 → PR 创建 → 代码审查 → 合并关闭
```

---

## 前置条件

- Issue 已标记为 `bug`
- 已有复现步骤或错误日志
- 开发环境已配置

---

## 执行步骤

### Phase 1: Issue 分析

**目标**：理解问题本质，评估修复难度

```bash
# 获取 Issue 详情
/github-integration view issue <number>
```

**分析要点**：

1. **问题描述**
   - 用户遇到了什么问题？
   - 错误信息是什么？
   - 何时开始出现？

2. **影响范围**
   - 影响多少用户？
   - 是否有 workaround？
   - 是否阻断核心功能？

3. **复现条件**
   - 必要的环境条件
   - 触发步骤
   - 是否可稳定复现

**输出**：

```markdown
## Issue 分析报告

**Issue**: #123 - 登录页面500错误
**严重程度**: High
**影响范围**: 所有用户
**复现率**: 100%

### 问题描述
用户在登录页面输入正确密码后，点击登录按钮返回500错误。

### 根因假设
1. 密码哈希比较逻辑错误
2. 数据库连接超时
3. 第三方认证服务异常

### 验证计划
- 检查密码哈希算法
- 查看数据库日志
- 测试认证服务连通性
```

---

### Phase 2: 根因定位

**目标**：找到问题的根本原因

```bash
# 创建修复分支
git checkout -b fix/123-login-error

# 查看相关代码
# ...
```

**定位方法**：

1. **日志分析**
   ```bash
   # 查看服务器日志
   tail -f logs/app.log | grep ERROR

   # 查看数据库日志
   tail -f logs/database.log
   ```

2. **代码追踪**
   - 从错误点开始
   - 逐层追溯调用链
   - 检查数据流

3. **断点调试**
   ```bash
   # Rust 调试
   cargo test -- --nocapture

   # 前端调试
   # 使用浏览器开发者工具
   ```

4. **二分查找**
   ```bash
   # 使用 git bisect 定位问题提交
   git bisect start
   git bisect bad HEAD
   git bisect good <last-good-commit>
   ```

**输出**：

```markdown
## 根因分析

**根本原因**: 密码哈希比较时使用了错误的编码格式

**调用链**:
1. `auth/login` 接收请求
2. `user_service::verify_password` 验证密码
3. `password::compare` 比较哈希值
4. ❌ 使用了 UTF-8 编码而非 Base64

**问题代码**:
```rust
// src/services/password.rs:45
let decoded = String::from_utf8(hash.as_bytes().to_vec())?;  // ❌ 错误
// 应该是
let decoded = base64::decode(hash)?;     // ✅ 正确
```

**影响**: 所有密码验证都会失败
```

---

### Phase 3: 修复实现

**目标**：编写最小化、安全的修复代码

**原则**：

1. **最小变更**
   - 只修改必要的代码
   - 避免重构其他逻辑
   - 保持向后兼容

2. **安全第一**
   - 不引入新漏洞
   - 验证所有输入
   - 处理边界情况

3. **可测试性**
   - 修复可被测试验证
   - 添加回归测试
   - 确保测试独立

**示例修复**：

```rust
// 修复前
fn compare_password(hash: &str, password: &str) -> Result<bool, Error> {
    let decoded = String::from_utf8(hash.as_bytes().to_vec())?;
    Ok(decoded == password)
}

// 修复后
fn compare_password(hash: &str, password: &str) -> Result<bool, Error> {
    let decoded = base64::decode(hash)?;
    let password_hash = hash_password(password)?;
    Ok(decoded == password_hash)
}
```

---

### Phase 4: 测试验证

**目标**：确保修复有效且不引入新问题

**测试类型**：

1. **单元测试**
   ```rust
   #[test]
   fn test_password_comparison() {
       let hash = hash_password("correct_password").unwrap();
       assert!(compare_password(&hash, "correct_password").unwrap());
       assert!(!compare_password(&hash, "wrong_password").unwrap());
   }
   ```

2. **集成测试**
   ```bash
   # 运行完整测试套件
   cargo test

   # 运行特定测试
   cargo test test_password_comparison
   ```

3. **手动测试**
   ```bash
   # 启动服务
   cargo run

   # 使用 curl 测试
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"correct_password"}'
   ```

4. **回归测试**
   - 确保原有功能正常
   - 检查相关模块
   - 运行完整测试套件

**测试检查清单**：

- [ ] 修复了原始问题
- [ ] 未引入新问题
- [ ] 边界条件已测试
- [ ] 错误处理正确
- [ ] 性能无明显下降

---

### Phase 5: PR 创建

**目标**：创建清晰、可审查的 Pull Request

```bash
# 提交修复
git add .
git commit -m "fix(auth): 修复密码哈希比较逻辑 (#123)

- 修正 Base64 编码解码
- 添加密码比较单元测试
- 更新错误处理

Fixes #123"

# 推送分支
git push origin fix/123-login-error

# 创建 PR
/github-integration create pr \
  --title "fix(auth): 修复密码哈希比较逻辑 (#123)" \
  --body "修复密码验证时的编码错误" \
  --reviewers "security-team"
```

**PR 描述模板**：

```markdown
## 描述

修复登录时密码验证失败的问题。

## 根本原因

密码哈希比较时使用了错误的编码格式（UTF-8而非Base64）。

## 修复方案

- 修正 `compare_password` 函数的解码逻辑
- 添加密码比较的单元测试
- 改进错误处理

## 测试

- [x] 添加了新的单元测试
- [x] 所有现有测试通过
- [x] 手动测试验证修复

## 相关 Issue

Fixes #123

## 截图（如适用）

[登录成功的截图]

## 检查清单

- [x] 代码遵循项目规范
- [x] 已运行 linter
- [x] 已运行 formatter
- [x] 无合并冲突
- [x] 安全审查通过
```

---

### Phase 6: 代码审查

**目标**：确保代码质量和安全性

**审查要点**：

1. **正确性**
   - 修复是否正确
   - 是否有副作用
   - 边界条件处理

2. **安全性**
   - 无新漏洞
   - 输入验证
   - 错误处理

3. **可维护性**
   - 代码清晰
   - 注释适当
   - 测试完整

4. **性能**
   - 无性能退化
   - 资源使用合理

**响应审查**：

```bash
# 根据审查意见修改
git add .
git commit -m "fix: 根据审查意见改进错误处理"

# 推送更新
git push origin fix/123-login-error
```

---

### Phase 7: 合并关闭

**目标**：完成修复并关闭 Issue

```bash
# 审查通过后合并
/github-integration merge pr <number> --method squash --delete-branch

# 验证 Issue 已关闭
/github-integration view issue 123
```

**合并后验证**：

1. 确认 Issue 已自动关闭
2. 验证主分支测试通过
3. 监控生产环境日志

---

## 时间估算

| 阶段 | 预计时间 | 说明 |
|------|---------|------|
| Issue 分析 | 15-30分钟 | 理解问题 |
| 根因定位 | 30-2小时 | 取决于复杂度 |
| 修复实现 | 30分钟-2小时 | 取决于修复范围 |
| 测试验证 | 30-60分钟 | 包括手动测试 |
| PR 创建 | 15-30分钟 | 填写描述 |
| 代码审查 | 1-24小时 | 取决于审查者 |
| 合并关闭 | 5-15分钟 | 最终验证 |

**总计**: 2-8小时（简单到中等复杂度）

---

## 常见问题

### Q: 无法复现问题怎么办？

1. 请求更多信息
   ```bash
   gh issue comment 123 --body "请提供：\n- 操作系统和浏览器版本\n- 详细的复现步骤\n- 错误截图或日志"
   ```

2. 添加标签
   ```bash
   gh issue edit 123 --add-label "needs-reproduction"
   ```

3. 等待用户反馈

### Q: 修复会影响其他功能吗？

1. 运行完整测试套件
2. 检查相关模块
3. 在测试环境验证
4. 监控合并后日志

### Q: 修复太复杂怎么办？

1. 拆分为多个小 PR
2. 先实现临时 workaround
3. 创建技术债务 Issue
4. 寻求团队帮助

---

## 相关文档

- [Issue 分类工作流](./issue-triage.md)
- [Feature 工作流](./feature-flow.md)
- [PR 创建工作流](./pr-creation.md)
