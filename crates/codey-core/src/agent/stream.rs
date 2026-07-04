//! 流式响应管理器
//!
//! 管理 SSE 流式响应，支持内容增量和工具调用事件的实时推送

use anyhow::Result;
use tokio::sync::mpsc;

use crate::llm::ToolCall;

/// 流式数据块类型
#[derive(Debug, Clone, PartialEq)]
pub enum StreamChunkType {
    /// 内容增量
    ContentDelta,

    /// 工具调用开始
    ToolCallStart,

    /// 工具调用参数增量
    ToolCallDelta,

    /// 流结束
    Done,

    /// 错误
    Error,
}

/// 流式数据块
///
/// 表示流式响应中的一个数据单元
#[derive(Debug, Clone)]
pub struct AgentStreamChunk {
    /// 数据块类型
    pub chunk_type: StreamChunkType,

    /// 内容文本（ContentDelta 时使用）
    pub content: Option<String>,

    /// 工具调用信息（ToolCallStart / ToolCallDelta 时使用）
    pub tool_call: Option<ToolCall>,

    /// 错误信息（Error 时使用）
    pub error: Option<String>,
}

impl AgentStreamChunk {
    /// 创建内容增量数据块
    pub fn content_delta(content: impl Into<String>) -> Self {
        Self {
            chunk_type: StreamChunkType::ContentDelta,
            content: Some(content.into()),
            tool_call: None,
            error: None,
        }
    }

    /// 创建工具调用开始数据块
    pub fn tool_call_start(tool_call: ToolCall) -> Self {
        Self {
            chunk_type: StreamChunkType::ToolCallStart,
            content: None,
            tool_call: Some(tool_call),
            error: None,
        }
    }

    /// 创建流结束数据块
    pub fn done() -> Self {
        Self {
            chunk_type: StreamChunkType::Done,
            content: None,
            tool_call: None,
            error: None,
        }
    }

    /// 创建错误数据块
    pub fn error(message: impl Into<String>) -> Self {
        Self {
            chunk_type: StreamChunkType::Error,
            content: None,
            tool_call: None,
            error: Some(message.into()),
        }
    }
}

/// 流式管理器
///
/// 管理流式响应的生命周期，提供发送和接收数据块的能力
pub struct StreamManager {
    /// 发送端（可能为 None 表示流未启动）
    sender: Option<mpsc::Sender<AgentStreamChunk>>,
}

impl StreamManager {
    /// 创建新的流式管理器
    pub fn new() -> Self {
        Self { sender: None }
    }

    /// 启动流式传输，返回接收端
    ///
    /// # Arguments
    /// * `buffer_size` - 通道缓冲区大小
    ///
    /// # Returns
    /// 接收端，用于消费流式数据块
    pub fn start_stream(&mut self, buffer_size: usize) -> mpsc::Receiver<AgentStreamChunk> {
        let (tx, rx) = mpsc::channel(buffer_size);
        self.sender = Some(tx);
        rx
    }

    /// 发送数据块
    ///
    /// # Arguments
    /// * `chunk` - 要发送的数据块
    ///
    /// # Errors
    /// 如果流未启动或接收端已关闭，返回错误
    pub async fn send_chunk(&self, chunk: AgentStreamChunk) -> Result<()> {
        match &self.sender {
            Some(tx) => tx
                .send(chunk)
                .await
                .map_err(|_| anyhow::anyhow!("流接收端已关闭")),
            None => Err(anyhow::anyhow!("流未启动，请先调用 start_stream")),
        }
    }

    /// 结束流式传输
    ///
    /// 发送 Done 数据块后关闭发送端
    pub async fn end_stream(&mut self) -> Result<()> {
        if let Some(tx) = self.sender.take() {
            tx.send(AgentStreamChunk::done())
                .await
                .map_err(|_| anyhow::anyhow!("发送结束数据块失败"))?;
        }
        Ok(())
    }

    /// 检查流是否已启动
    pub fn is_streaming(&self) -> bool {
        self.sender.is_some()
    }
}

impl Default for StreamManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // -------------------------------------------------------
    // AgentStreamChunk
    // -------------------------------------------------------

    #[test]
    fn test_content_delta_chunk() {
        let chunk = AgentStreamChunk::content_delta("Hello");
        assert_eq!(chunk.chunk_type, StreamChunkType::ContentDelta);
        assert_eq!(chunk.content.as_deref(), Some("Hello"));
        assert!(chunk.tool_call.is_none());
        assert!(chunk.error.is_none());
    }

    #[test]
    fn test_tool_call_start_chunk() {
        let tool_call = ToolCall {
            id: "call_1".to_string(),
            name: "file/read".to_string(),
            arguments: json!({"path": "/tmp/test.txt"}),
        };
        let chunk = AgentStreamChunk::tool_call_start(tool_call.clone());
        assert_eq!(chunk.chunk_type, StreamChunkType::ToolCallStart);
        assert!(chunk.content.is_none());
        assert!(chunk.tool_call.is_some());
        assert_eq!(chunk.tool_call.as_ref().unwrap().id, "call_1");
    }

    #[test]
    fn test_done_chunk() {
        let chunk = AgentStreamChunk::done();
        assert_eq!(chunk.chunk_type, StreamChunkType::Done);
        assert!(chunk.content.is_none());
        assert!(chunk.tool_call.is_none());
        assert!(chunk.error.is_none());
    }

    #[test]
    fn test_error_chunk() {
        let chunk = AgentStreamChunk::error("something went wrong");
        assert_eq!(chunk.chunk_type, StreamChunkType::Error);
        assert_eq!(
            chunk.error.as_deref(),
            Some("something went wrong")
        );
    }

    // -------------------------------------------------------
    // StreamChunkType
    // -------------------------------------------------------

    #[test]
    fn test_stream_chunk_type_equality() {
        assert_eq!(StreamChunkType::ContentDelta, StreamChunkType::ContentDelta);
        assert_ne!(StreamChunkType::ContentDelta, StreamChunkType::Done);
        assert_ne!(StreamChunkType::ToolCallStart, StreamChunkType::ToolCallDelta);
    }

    // -------------------------------------------------------
    // StreamManager
    // -------------------------------------------------------

    #[test]
    fn test_stream_manager_new() {
        let manager = StreamManager::new();
        assert!(!manager.is_streaming());
    }

    #[test]
    fn test_stream_manager_default() {
        let manager = StreamManager::default();
        assert!(!manager.is_streaming());
    }

    #[tokio::test]
    async fn test_stream_lifecycle() {
        let mut manager = StreamManager::new();
        assert!(!manager.is_streaming());

        let mut rx = manager.start_stream(16);
        assert!(manager.is_streaming());

        // 发送内容增量
        manager
            .send_chunk(AgentStreamChunk::content_delta("Hello"))
            .await
            .unwrap();

        manager
            .send_chunk(AgentStreamChunk::content_delta(" World"))
            .await
            .unwrap();

        // 结束流
        manager.end_stream().await.unwrap();
        assert!(!manager.is_streaming());

        // 接收数据
        let mut chunks = Vec::new();
        while let Some(chunk) = rx.recv().await {
            chunks.push(chunk);
        }

        assert_eq!(chunks.len(), 3); // Hello, World, Done
        assert_eq!(chunks[0].chunk_type, StreamChunkType::ContentDelta);
        assert_eq!(chunks[0].content.as_deref(), Some("Hello"));
        assert_eq!(chunks[1].content.as_deref(), Some(" World"));
        assert_eq!(chunks[2].chunk_type, StreamChunkType::Done);
    }

    #[tokio::test]
    async fn test_send_chunk_without_start() {
        let manager = StreamManager::new();
        let result = manager
            .send_chunk(AgentStreamChunk::content_delta("test"))
            .await;

        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("流未启动")
        );
    }

    #[tokio::test]
    async fn test_send_content_delta() {
        let mut manager = StreamManager::new();
        let mut rx = manager.start_stream(16);

        manager
            .send_chunk(AgentStreamChunk::content_delta("partial"))
            .await
            .unwrap();

        let chunk = rx.recv().await.unwrap();
        assert_eq!(chunk.chunk_type, StreamChunkType::ContentDelta);
        assert_eq!(chunk.content.as_deref(), Some("partial"));
    }

    #[tokio::test]
    async fn test_send_tool_call_event() {
        let mut manager = StreamManager::new();
        let mut rx = manager.start_stream(16);

        let tool_call = ToolCall {
            id: "call_1".to_string(),
            name: "file/read".to_string(),
            arguments: json!({"path": "/tmp/test.txt"}),
        };

        manager
            .send_chunk(AgentStreamChunk::tool_call_start(tool_call))
            .await
            .unwrap();

        let chunk = rx.recv().await.unwrap();
        assert_eq!(chunk.chunk_type, StreamChunkType::ToolCallStart);
        assert_eq!(chunk.tool_call.as_ref().unwrap().name, "file/read");
    }

    #[tokio::test]
    async fn test_end_stream_sends_done() {
        let mut manager = StreamManager::new();
        let mut rx = manager.start_stream(16);

        manager.end_stream().await.unwrap();

        let chunk = rx.recv().await.unwrap();
        assert_eq!(chunk.chunk_type, StreamChunkType::Done);
    }

    #[tokio::test]
    async fn test_end_stream_without_start() {
        let mut manager = StreamManager::new();
        // 结束未启动的流应该成功（空操作）
        let result = manager.end_stream().await;
        assert!(result.is_ok());
    }
}
