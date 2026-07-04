//! CodeY Core - Core logic for CodeY agent

pub mod agent;
pub mod tools;
pub mod permission;
pub mod llm;
pub mod protocol;

/// Re-export commonly used types
pub use agent::AgentLoop;
pub use tools::ToolRegistry;
pub use permission::PermissionEngine;
pub use protocol::{Request, Response, Notification};
