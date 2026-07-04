//! Agent 模块
//!
//! 提供 Agent 核心循环、上下文管理、流式响应和类型定义

pub mod r#loop;
pub mod context;
pub mod types;
pub mod stream;

pub use r#loop::AgentLoop;
pub use context::Context;
pub use types::{AgentLoopConfig, AgentResponse, ExecutedToolCall, ToolExecutionResult};
pub use stream::{AgentStreamChunk, StreamChunkType, StreamManager};
