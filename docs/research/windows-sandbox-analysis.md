# Windows 平台沙箱方案技术分析报告

> 生成日期：2026-07-05
> 研究目的：为 CodeY 项目 Windows 平台沙箱支持提供技术决策依据

---

## 目录

1. [Windows 原生沙箱机制](#1-windows-原生沙箱机制)
2. [第三方沙箱方案](#2-第三方沙箱方案)
3. [跨平台对比分析](#3-跨平台对比分析)
4. [CodeY 适配建议](#4-codey-适配建议)
5. [参考资料](#5-参考资料)

---

## 1. Windows 原生沙箱机制

### 1.1 Windows Sandbox

**概述**：Windows 10 Pro (v1903+) / Enterprise 内置的轻量级一次性桌面环境。

**技术架构**：
- 基于 **Hyper-V 虚拟化**技术
- 使用 **Windows Container** 技术子集
- 动态生成干净的宿主 OS 副本（约 100MB）
- 通过 **RDP（远程桌面协议）** 实现无缝窗口集成
- 使用 **VSMB（虚拟 SMB）** 实现文件夹共享
- 使用 **Plan9 协议** 实现文件系统共享

**配置方式**：
```xml
<!-- .wsb 配置文件示例 -->
<Configuration>
  <Networking>Enable</Networking>
  <MappedFolders>
    <MappedFolder>
      <HostFolder>C:\Users\User\Projects</HostFolder>
      <ReadOnly>true</ReadOnly>
    </MappedFolder>
  </MappedFolders>
  <LogonCommand>
    <Command>cd C:\Projects && npm start</Command>
  </LogonCommand>
</Configuration>
```

**系统要求**：
| 资源 | 最低要求 | 推荐配置 |
|------|---------|---------|
| RAM | 2 GB | 4 GB |
| 磁盘 | 1 GB 可用空间 | - |
| CPU | 2 核心 | 4 核心（支持 SMT） |
| 虚拟化 | AMD-V 或 Intel VT-x | - |

**优势**：
- 零配置开箱即用
- 完全一次性（关闭即销毁）
- 与宿主 OS 深度集成
- 安全隔离级别高（Hyper-V 级别）

**劣势**：
- 仅支持 Windows 10 Pro/Enterprise（不支持 Home 版）
- 启动延迟较高（秒级）
- 内存开销大（100MB+ 基线）
- 不适合 CLI 工具的轻量级隔离需求

---

### 1.2 AppContainer（UWP 隔离）

**概述**：Windows 8 引入的应用隔离机制，用于 UWP 应用和 Microsoft Edge。

**技术架构**：
- **受限令牌（Restricted Token）**：应用以低权限令牌运行
- **能力声明（Capability Declaration）**：通过应用清单声明所需权限
- **完整性级别（Integrity Level）**：进程运行在 **Low Integrity Level**
- **命名对象访问控制**：基于 AppContainer SID 限制内核对象访问

**隔离维度**：
| 隔离维度 | 默认行为 | 可配置 |
|---------|---------|--------|
| 文件系统 | 仅访问包目录 | 通过能力声明扩展 |
| 网络 | 仅本地回环 | 通过 `internetClient` 能力启用 |
| 注册表 | 仅包注册表 | 不可扩展 |
| 进程 | 隔离 | 不可跨容器访问 |
| IPC | 受限 | 通过 AppService 扩展 |

**API 使用**：
```cpp
// 创建 AppContainer
PSID appContainerSid;
HRESULT hr = CreateAppContainerProfile(
    L"MyAppContainer",      // 容器名称
    L"My App Container",    // 显示名称
    L"Description",         // 描述
    nullptr,                // 能力 SID 数组
    0,                      // 能力数量
    &appContainerSid        // 输出 SID
);

// 启动进程
STARTUPINFOEX si = { sizeof(si) };
PROC_THREAD_ATTRIBUTE_LIST *attrList;
// ... 配置属性列表
CreateProcessAsUser(
    token,
    L"app.exe",
    nullptr,
    nullptr,
    nullptr,
    FALSE,
    EXTENDED_STARTUPINFO_PRESENT,
    nullptr,
    nullptr,
    &si.StartupInfo,
    &processInfo
);
```

**优势**：
- 轻量级（<1-2% 性能开销）
- 细粒度权限控制
- 适合 CLI 工具隔离
- 无需虚拟化支持

**劣势**：
- 配置复杂
- 某些系统调用可能受限
- 需要 Windows 8+ 系统

---

### 1.3 Job Objects

**概述**：Windows 内核机制，用于将进程分组并施加集体约束。

**技术架构**：
- **资源限制**：CPU 时间、内存使用、进程数量
- **安全限制**：SID 过滤、UI 桌面限制
- **进程控制**：防止子进程逃逸、限制断开处理

**关键 API**：
```cpp
// 创建 Job Object
HANDLE hJob = CreateJobObject(nullptr, L"MyJob");

// 配置限制
JOBOBJECT_EXTENDED_LIMIT_INFORMATION limits = {0};
limits.BasicLimitInformation.LimitFlags =
    JOB_OBJECT_LIMIT_ACTIVE_PROCESS |
    JOB_OBJECT_LIMIT_PROCESS_MEMORY |
    JOB_OBJECT_LIMIT_JOB_MEMORY;
limits.BasicLimitInformation.ActiveProcessLimit = 1;
limits.ProcessMemoryLimit = 100 * 1024 * 1024;  // 100MB
limits.JobMemoryLimit = 200 * 1024 * 1024;       // 200MB

SetInformationJobObject(
    hJob,
    JobObjectExtendedLimitInformation,
    &limits,
    sizeof(limits)
);

// 分配进程到 Job
AssignProcessToJobObject(hJob, hProcess);
```

**Chromium 使用案例**：
- 渲染进程放入 Job Objects
- 限制 `JOB_OBJECT_LIMIT_ACTIVE_PROCESS`（防止进程爆炸）
- 限制 `JOB_OBJECT_LIMIT_DIE_ON_UNHANDLED_EXCEPTION`
- 桌面/WinSta 限制

**优势**：
- 极低开销（<1%）
- 简单易用
- 适合资源限制场景

**劣势**：
- 隔离强度较低（非安全边界）
- 主要用于资源管理而非安全隔离
- 不适合防御恶意代码

---

### 1.4 Restricted Tokens

**概述**：通过 `CreateRestrictedToken()` API 创建受限令牌，限制进程权限。

**技术架构**：
- **特权移除**：移除特定权限（如 `SeDebugPrivilege`）
- **限制 SID**：在限制 SID 列表中添加 SID，即使 DACL 授权也会被拒绝
- **写限制**：创建写限制令牌，防止写入未明确允许的资源

**完整性级别（MIC）**：
| 级别 | SID | 用途 |
|------|-----|------|
| Untrusted | S-1-16-0 | 最低权限 |
| Low | S-1-16-4096 | Protected Mode IE |
| Medium | S-1-16-8192 | 标准用户进程 |
| High | S-1-16-12288 | 提升权限进程 |
| System | S-1-16-16384 | 系统级服务 |

**Chromium 实现**：
```cpp
// 创建受限令牌
HANDLE restrictedToken;
CreateRestrictedToken(
    currentToken,
    DISABLE_MAX_PRIVILEGE,           // 禁用所有特权
    sizeof(restrictingSids)/sizeof(SID_AND_ATTRIBUTES),
    restrictingSids,                 // 限制 SID 列表
    0,
    nullptr,
    0,
    nullptr,
    &restrictedToken
);

// 设置完整性级别
TOKEN_MANDATORY_LABEL integrityLabel = {0};
integrityLabel.Label.Attributes = SE_GROUP_INTEGRITY;
integrityLabel.Label.Sid = lowIntegritySid;
SetTokenInformation(
    restrictedToken,
    TokenIntegrityLevel,
    &integrityLabel,
    sizeof(integrityLabel)
);
```

**优势**：
- 细粒度权限控制
- 与现有 Windows 安全模型集成
- 适合最小权限原则

**劣势**：
- 配置复杂
- 需要深入理解 Windows 安全模型
- 可能被高级攻击绕过

---

### 1.5 Mandatory Integrity Control (MIC)

**概述**：Windows Vista 引入的强制完整性控制机制。

**核心原则**：
- 每个进程和可安全对象都有完整性级别
- 进程**不能写入**高于其完整性级别的对象
- 默认 DACL 通过完整性级别强制执行写访问控制

**实现机制**：
- 完整性级别嵌入进程访问令牌
- 系统调用时检查完整性级别
- 与 DACL 配合实现多层防护

---

## 2. 第三方沙箱方案

### 2.1 Docker + WSL2

**技术架构**：
- WSL2 运行真实 Linux 内核（轻量级 Hyper-V VM）
- Docker Desktop 使用 WSL2 后端（2021 年后默认）
- 支持 GPU 直通（ML/AI 工作负载）
- 内存动态分配

**性能表现**：
| 指标 | WSL2 文件系统 | /mnt/c 文件系统 |
|------|-------------|----------------|
| 文件 I/O | 近原生性能 | 较慢（跨文件系统） |
| 网络 | 原生 | 原生 |
| 启动时间 | 秒级 | 秒级 |
| 内存开销 | 动态（基线约 1GB） | 同左 |

**使用示例**：
```bash
# WSL2 中运行 Docker
wsl -d Ubuntu
docker run -it --rm -v /mnt/c/Projects:/workspace ubuntu:22.04

# 或直接在 Windows 中使用
docker run -it --rm -v C:\Projects:/workspace ubuntu:22.04
```

**优势**：
- 完整 Linux 环境
- 生态成熟（Docker Hub）
- 适合开发/CI/CD 场景
- 支持 GPU 直通

**劣势**：
- 启动延迟较高（秒级）
- 内存开销较大
- 文件系统性能（/mnt/c）较差
- 需要 Windows 10 版本 1903+ 或 Windows 11

---

### 2.2 Sandboxie

**技术架构**：
- **内核驱动（SbieDrv.sys）**：拦截和重定向系统调用
- **用户模式 DLL（SbieDll.dll）**：注入沙箱进程，拦截 Win32 API
- **服务（SbieSvc.exe）**：协调沙箱操作

**核心机制**：
- **文件系统重定向**：更改重定向到虚拟化/沙箱目录
- **注册表虚拟化**：注册表写入被重定向
- **令牌操作**：调整安全令牌以实现进程隔离
- **句柄/名称过滤**：过滤对命名对象（互斥体、事件等）的访问

**技术特点**：
- 不使用虚拟化（基于系统调用拦截）
- 开源（2020 年后 GPL v3）
- 比基于 VM 的方案更轻量

**优势**：
- 无需虚拟化支持
- 轻量级（比 Hyper-V 方案）
- 开源免费
- 适合应用级隔离

**劣势**：
- 需要内核驱动（安全风险）
- 可能被高级攻击绕过
- 配置复杂
- 不适合 CLI 工具集成

---

### 2.3 Firejail（Windows 版）

**概述**：Firejail 是 Linux 上的轻量级沙箱工具，Windows 版本有限支持。

**技术特点**：
- 基于 Linux namespaces 和 seccomp-bpf
- Windows 版本主要通过 WSL2 或 Cygwin 运行
- 不是原生 Windows 解决方案

**适用场景**：
- 已有 WSL2 环境的用户
- 需要 Linux 沙箱配置兼容性

---

## 3. 跨平台对比分析

### 3.1 与 macOS Seatbelt 对比

| 特性 | macOS Seatbelt | Windows AppContainer | Windows Sandbox |
|------|---------------|---------------------|-----------------|
| **隔离级别** | 每进程系统调用过滤 | 进程级能力控制 | 完整 VM 隔离 |
| **粒度** | 细粒度（文件、网络、IPC） | 中等（能力声明） | 粗粒度（VM 级别） |
| **配置语言** | Scheme-like `.sb` 文件 | 应用清单 XML | XML `.wsb` 文件 |
| **持久性** | 持久配置文件 | 持久容器 | 一次性（关闭即销毁） |
| **性能开销** | 极低（<1%） | 低（<2%） | 中等（5-15%） |
| **使用场景** | 应用/系统进程隔离 | UWP 应用隔离 | 运行不受信任应用 |

**Seatbelt 配置示例**：
```scheme
; 允许读取用户目录
(allow file-read*
  (subpath (param "_USER_HOME_DIR")))

; 拒绝写入系统目录
(deny file-write*
  (subpath "/usr")
  (subpath "/System"))

; 允许网络访问
(allow network*)
```

**AppContainer 等效**：
```xml
<!-- 应用清单 -->
<Package>
  <Capabilities>
    <Capability Name="internetClient"/>
    <Capability Name="documentsLibrary"/>
  </Capabilities>
</Package>
```

---

### 3.2 与 Linux seccomp-bpf 对比

| 特性 | Linux seccomp-bpf | Windows Job Objects | Windows AppContainer |
|------|------------------|--------------------|---------------------|
| **主要目的** | 系统调用过滤 | 资源/进程分组 | 能力控制 |
| **粒度** | 每系统调用（非常细） | 每资源类型（较粗） | 每能力（中等） |
| **开销** | 可忽略 | 可忽略 | 低（<2%） |
| **哲学** | 白名单（默认拒绝） | 资源上限 | 能力声明 |
| **使用案例** | Chrome, Docker, Android | IIS, 应用池 | UWP, Edge |

**seccomp-bpf 配置示例**：
```c
// 只允许必要的系统调用
scmp_filter_ctx ctx;
ctx = seccomp_init(SCMP_ACT_KILL);  // 默认拒绝

// 允许基本系统调用
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(read), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(write), 0);
seccomp_rule_add(ctx, SCMP_ACT_ALLOW, SCMP_SYS(exit), 0);

// 加载过滤器
seccomp_load(ctx);
```

**Job Objects 等效**：
```cpp
// 限制进程资源
JOBOBJECT_EXTENDED_LIMIT_INFORMATION limits = {0};
limits.BasicLimitInformation.LimitFlags =
    JOB_OBJECT_LIMIT_ACTIVE_PROCESS |
    JOB_OBJECT_LIMIT_PROCESS_MEMORY;
limits.BasicLimitInformation.ActiveProcessLimit = 1;
limits.ProcessMemoryLimit = 50 * 1024 * 1024;  // 50MB
```

---

### 3.3 性能开销对比

| 方案 | 启动延迟 | 内存开销 | CPU 开销 | 隔离强度 |
|------|---------|---------|---------|---------|
| **macOS Seatbelt** | 极低 | 极低 | <1% | 中 |
| **Linux seccomp-bpf** | 极低 | 极低 | <1% | 高 |
| **Windows AppContainer** | 低 | 低 | <2% | 中 |
| **Windows Job Objects** | 可忽略 | 可忽略 | <1% | 低 |
| **Windows Sandbox** | 高（秒级） | 高（100MB+） | 5-15% | 非常高 |
| **Docker + WSL2** | 高（秒级） | 高（1GB+） | 5-10% | 非常高 |
| **Sandboxie** | 低 | 低 | 2-5% | 中 |

---

### 3.4 易用性对比

| 方案 | 配置复杂度 | API 可用性 | 生态成熟度 | 学习曲线 |
|------|-----------|-----------|-----------|---------|
| **macOS Seatbelt** | 中等 | 良好 | 成熟 | 中等 |
| **Linux seccomp-bpf** | 高 | 优秀 | 成熟 | 高 |
| **Windows AppContainer** | 高 | 良好 | 中等 | 高 |
| **Windows Job Objects** | 低 | 优秀 | 成熟 | 低 |
| **Windows Sandbox** | 低 | 有限 | 中等 | 低 |
| **Docker + WSL2** | 中等 | 优秀 | 非常成熟 | 中等 |
| **Sandboxie** | 高 | 有限 | 成熟 | 高 |

---

## 4. CodeY 适配建议

### 4.1 MVP 阶段建议

**推荐方案：不支持原生 Windows，仅支持 WSL2**

**理由**：
1. **开发成本**：原生 Windows 沙箱实现复杂，需要处理多种 API
2. **维护负担**：需要同时维护 macOS、Linux、Windows 三套代码
3. **用户覆盖**：大部分 Windows 开发者已使用 WSL2
4. **一致性**：WSL2 提供与 macOS/Linux 一致的开发体验

**实现方式**：
```typescript
// 检测 Windows 环境
if (process.platform === 'win32') {
  // 检查是否在 WSL2 中
  const isWSL = await checkWSLEnvironment();
  if (!isWSL) {
    throw new Error(
      'Windows 原生环境暂不支持，请使用 WSL2。\n' +
      '安装指南：https://docs.microsoft.com/windows/wsl/install'
    );
  }
}
```

**WSL2 环境检查**：
```bash
# 检查是否在 WSL 中
if grep -qi microsoft /proc/version; then
  echo "Running in WSL2"
else
  echo "Not in WSL2"
fi
```

---

### 4.2 长期支持策略

**Phase 1：WSL2 支持（MVP）**
- 仅支持 WSL2 环境
- 复用现有 Linux 沙箱实现
- 提供 WSL2 安装指南

**Phase 2：Windows 原生支持（v2.0）**
- 使用 **AppContainer + Job Objects** 组合
- 参考 Chromium 沙箱实现
- 提供降级方案（无沙箱模式）

**Phase 3：完整 Windows 支持（v3.0）**
- 支持 Windows Sandbox（可选）
- 支持 Docker Desktop（可选）
- 提供多种隔离级别选择

---

### 4.3 技术实现建议

**推荐架构（Phase 2）**：
```typescript
// Windows 沙箱实现
class WindowsSandbox implements Sandbox {
  private jobObject: HANDLE;
  private appContainer: AppContainerProfile;

  async initialize(): Promise<void> {
    // 1. 创建 Job Object
    this.jobObject = CreateJobObject();

    // 2. 配置资源限制
    SetInformationJobObject(this.jobObject, {
      activeProcessLimit: 1,
      processMemoryLimit: 100 * 1024 * 1024,
      jobMemoryLimit: 200 * 1024 * 1024,
    });

    // 3. 创建 AppContainer
    this.appContainer = await CreateAppContainerProfile({
      name: 'codey-sandbox',
      capabilities: ['internetClient'],
    });
  }

  async execute(command: string): Promise<ExecutionResult> {
    // 4. 在 AppContainer 中启动进程
    const process = await CreateProcessInAppContainer(
      command,
      this.appContainer
    );

    // 5. 分配到 Job Object
    AssignProcessToJobObject(this.jobObject, process);

    // 6. 等待完成
    return await WaitForProcess(process);
  }
}
```

**降级方案**：
```typescript
// 沙箱降级策略
async function getSandbox(): Promise<Sandbox> {
  // 优先使用原生沙箱
  if (await isWindowsSandboxSupported()) {
    return new WindowsSandbox();
  }

  // 降级到 Job Objects
  if (await isJobObjectsSupported()) {
    return new JobObjectsSandbox();
  }

  // 最后降级到无沙箱模式
  console.warn('沙箱不可用，以受限模式运行');
  return new NoSandbox();
}
```

---

### 4.4 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Windows 版本碎片化 | 高 | 最低支持 Windows 10 1903 |
| API 兼容性问题 | 中 | 使用特性检测和降级方案 |
| 性能问题 | 中 | 提供无沙箱模式选项 |
| 安全漏洞 | 高 | 定期安全审计，参考 Chromium 实现 |
| 维护成本 | 中 | 优先 WSL2，原生支持作为可选 |

---

## 5. 参考资料

### 官方文档
- [Windows Sandbox Overview - Microsoft Learn](https://learn.microsoft.com/en-us/windows/security/threat-protection/windows-sandbox/windows-sandbox-overview)
- [Job Objects - Win32 Apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)
- [AppContainer - Windows UWP - Microsoft Learn](https://learn.microsoft.com/en-us/windows/uwp/launch-resume/app-tiles-and-notifications-app-container)
- [CreateRestrictedToken - Win32 Apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-createrestrictedtoken)

### Chromium 参考
- [Chromium Windows Sandboxing Design Doc](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/design/sandbox_win.md)
- [Chromium Sandbox Win README](https://chromium.googlesource.com/chromium/src/+/HEAD/sandbox/win/README.md)

### 第三方资源
- [Sandboxie GitHub Repository](https://github.com/sandboxie-plus/Sandboxie)
- [WSL2 Documentation - Microsoft Learn](https://learn.microsoft.com/en-us/windows/wsl/)
- [Docker Desktop WSL2 Backend](https://docs.docker.com/desktop/wsl/)

### 学术研究
- James Forshaw (Google Project Zero) - Windows Sandbox 逃逸研究
- Alex Ionescu - Windows 安全内部机制
- USENIX Security 会议论文 - 沙箱性能评估

---

## 附录：快速决策矩阵

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| MVP 阶段 | WSL2 | 开发成本低，用户覆盖广 |
| CLI 工具隔离 | AppContainer + Job Objects | 轻量级，适合进程隔离 |
| 不受信任代码执行 | Windows Sandbox | 隔离强度最高 |
| 开发/测试环境 | Docker + WSL2 | 生态成熟，易于管理 |
| 生产环境 | AppContainer | 性能开销低，安全性好 |

---

**报告生成者**：CodeY 技术研究子 Agent
**最后更新**：2026-07-05
