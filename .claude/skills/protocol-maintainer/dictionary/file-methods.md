# File 方法定义

File 方法用于文件系统操作。

---

## file/read

读取文件内容。

| 方向 | 类型 | 说明 |
|------|------|------|
| Request | Request | 客户端/Agent -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | string | 是 | 文件绝对路径 |
| offset | number | 否 | 起始行号（0-based） |
| limit | number | 否 | 读取行数 |
| encoding | string | 否 | 编码格式（默认 `utf-8`） |

### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| content | string | 文件内容 |
| total_lines | number | 文件总行数 |
| truncated | boolean | 是否被截断 |

### 示例

```json
// Request
{ "jsonrpc": "2.0", "method": "file/read", "params": { "path": "/src/main.rs", "offset": 0, "limit": 50 }, "id": "10" }
// Response
{ "jsonrpc": "2.0", "result": { "content": "fn main() {\n    println!(\"Hello, world!\");\n}", "total_lines": 3, "truncated": false }, "id": "10" }
```

---

## file/write

写入文件（创建或覆盖）。

| 方向 | 类型 | 说明 |
|------|------|------|
| Request | Request | 客户端/Agent -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | string | 是 | 文件绝对路径 |
| content | string | 是 | 文件内容 |
| create_dirs | boolean | 否 | 是否自动创建父目录（默认 false） |
| encoding | string | 否 | 编码格式（默认 `utf-8`） |

### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| path | string | 写入的文件路径 |
| bytes_written | number | 写入字节数 |

### 示例

```json
// Request
{ "jsonrpc": "2.0", "method": "file/write", "params": { "path": "/src/config.json", "content": "{\"debug\": true}", "create_dirs": true }, "id": "11" }
// Response
{ "jsonrpc": "2.0", "result": { "path": "/src/config.json", "bytes_written": 15 }, "id": "11" }
```

---

## file/edit

编辑文件（局部替换）。

| 方向 | 类型 | 说明 |
|------|------|------|
| Request | Request | 客户端/Agent -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | string | 是 | 文件绝对路径 |
| old_string | string | 是 | 要替换的原始文本 |
| new_string | string | 是 | 替换后的文本 |
| replace_all | boolean | 否 | 是否替换所有匹配项（默认 false） |

### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| path | string | 编辑的文件路径 |
| replacements | number | 替换次数 |

### 示例

```json
// Request
{ "jsonrpc": "2.0", "method": "file/edit", "params": { "path": "/src/main.rs", "old_string": "println!(\"Hello\")", "new_string": "println!(\"Hello, world!\")" }, "id": "12" }
// Response
{ "jsonrpc": "2.0", "result": { "path": "/src/main.rs", "replacements": 1 }, "id": "12" }
```

---

## file/search

搜索文件内容。

| 方向 | 类型 | 说明 |
|------|------|------|
| Request | Request | 客户端/Agent -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pattern | string | 是 | 搜索模式（正则表达式） |
| path | string | 否 | 搜索目录（默认当前目录） |
| file_pattern | string | 否 | 文件名过滤（如 `*.rs`） |
| max_results | number | 否 | 最大结果数（默认 100） |

### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| matches | object[] | 匹配结果列表，每项包含 `file`、`line`、`column`、`text` |
| total | number | 总匹配数 |

### 示例

```json
// Request
{ "jsonrpc": "2.0", "method": "file/search", "params": { "pattern": "fn\\s+main", "path": "/src", "file_pattern": "*.rs" }, "id": "13" }
// Response
{ "jsonrpc": "2.0", "result": { "matches": [{ "file": "/src/main.rs", "line": 1, "column": 0, "text": "fn main() {" }], "total": 1 }, "id": "13" }
```

---

## file/list

列出目录内容。

| 方向 | 类型 | 说明 |
|------|------|------|
| Request | Request | 客户端/Agent -> 服务端 |

### Params

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| path | string | 是 | 目录路径 |
| recursive | boolean | 否 | 是否递归（默认 false） |
| pattern | string | 否 | 文件名过滤模式 |
| ignore | string[] | 否 | 忽略的目录/文件模式 |

### Result

| 字段 | 类型 | 说明 |
|------|------|------|
| entries | object[] | 目录项列表，每项包含 `name`、`path`、`type`（file/dir）、`size` |
| total | number | 总数 |

### 示例

```json
// Request
{ "jsonrpc": "2.0", "method": "file/list", "params": { "path": "/src", "recursive": false }, "id": "14" }
// Response
{ "jsonrpc": "2.0", "result": { "entries": [{ "name": "main.rs", "path": "/src/main.rs", "type": "file", "size": 1024 }, { "name": "lib", "path": "/src/lib", "type": "dir", "size": 0 }], "total": 2 }, "id": "14" }
```
