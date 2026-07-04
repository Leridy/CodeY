use serde::{Deserialize, Serialize};

/// Context for an agent conversation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Context {
    pub conversation_id: String,
    pub messages: Vec<Message>,
    pub working_directory: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: String,
    pub content: String,
}

impl Context {
    pub fn new(conversation_id: &str, working_directory: &str) -> Self {
        Self {
            conversation_id: conversation_id.to_string(),
            messages: Vec::new(),
            working_directory: working_directory.to_string(),
        }
    }

    pub fn add_message(&mut self, role: &str, content: &str) {
        self.messages.push(Message {
            role: role.to_string(),
            content: content.to_string(),
        });
    }
}
