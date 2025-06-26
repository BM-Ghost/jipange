-- Initialize Jia AI Assistant Database Schema

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
);

-- Create user_context table for personalization
CREATE TABLE IF NOT EXISTS user_context (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    context_type VARCHAR(100) NOT NULL,
    context_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, context_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_context_user_id ON user_context(user_id);
CREATE INDEX IF NOT EXISTS idx_user_context_type ON user_context(context_type);

-- Insert sample conversation for testing
INSERT INTO conversations (conversation_id, user_id, metadata) 
VALUES ('conv_user123_sample', 'user123', '{"source": "web_app", "initial_setup": true}')
ON CONFLICT (conversation_id) DO NOTHING;

-- Insert welcome message
INSERT INTO messages (conversation_id, role, content, metadata)
VALUES (
    'conv_user123_sample', 
    'assistant', 
    'Hi! I''m Jia, your AI productivity assistant. I can help you manage tasks, optimize your schedule, and boost your productivity. What would you like to work on today?',
    '{"message_type": "welcome", "features": ["task_management", "scheduling", "productivity"]}'
)
ON CONFLICT DO NOTHING;

-- Insert sample user context
INSERT INTO user_context (user_id, context_type, context_data)
VALUES (
    'user123',
    'preferences',
    '{"timezone": "UTC", "work_hours": "9-17", "preferred_communication": "friendly"}'
),
(
    'user123',
    'work_patterns',
    '{"peak_hours": "morning", "focus_duration": 120, "break_frequency": 90}'
)
ON CONFLICT (user_id, context_type) DO UPDATE SET
    context_data = EXCLUDED.context_data,
    updated_at = CURRENT_TIMESTAMP;
