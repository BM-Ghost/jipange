-- =======================================
-- Initialize Jia AI Assistant DB Schema
-- =======================================

-- Drop in reverse dependency order to avoid foreign key issues
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_context CASCADE;
DROP TABLE IF EXISTS email_verification_tokens CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS user_providers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =========================
-- 1. Create users table
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  image VARCHAR(500),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 2. Create conversations table
-- =========================
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  conversation_id VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =========================
-- 3. Create messages table
-- =========================
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
);

-- =========================
-- 4. Create user_context table
-- =========================
CREATE TABLE IF NOT EXISTS user_context (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  context_type VARCHAR(100) NOT NULL,
  context_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, context_type),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =========================
-- 5. Create auth token tables
-- =========================

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_providers (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =========================
-- 6. Create indexes
-- =========================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_context_user_id ON user_context(user_id);
CREATE INDEX IF NOT EXISTS idx_user_context_type ON user_context(context_type);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON email_verification_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_user_providers_user_id ON user_providers(user_id);

-- =========================
-- 7. Function: Generate unique user IDs
-- =========================
CREATE OR REPLACE FUNCTION generate_user_id() RETURNS VARCHAR(255) AS $$
DECLARE
    new_user_id VARCHAR(255);
BEGIN
    new_user_id := 'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' ||
                   SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);

    WHILE EXISTS (SELECT 1 FROM users WHERE user_id = new_user_id) LOOP
        new_user_id := 'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' ||
                       SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
    END LOOP;

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- 8. Insert sample data
-- =========================

-- Ensure the user 'user123' exists
INSERT INTO users (user_id, email, username, name)
VALUES ('user123', 'test@example.com', 'testuser', 'Test User')
ON CONFLICT (user_id) DO NOTHING;

-- Insert a sample conversation
INSERT INTO conversations (conversation_id, user_id, metadata) 
VALUES ('conv_user123_sample', 'user123', '{"source": "web_app", "initial_setup": true}')
ON CONFLICT (conversation_id) DO NOTHING;

-- Insert a sample message
INSERT INTO messages (conversation_id, role, content, metadata)
VALUES (
    'conv_user123_sample', 
    'assistant', 
    'Hi! I''m Jia, your AI productivity assistant. I can help you manage tasks, optimize your schedule, and boost your productivity. What would you like to work on today?',
    '{"message_type": "welcome", "features": ["task_management", "scheduling", "productivity"]}'
)
ON CONFLICT DO NOTHING;

-- Insert user context (UPSERT)
INSERT INTO user_context (user_id, context_type, context_data)
VALUES 
    ('user123', 'preferences', '{"timezone": "UTC", "work_hours": "9-17", "preferred_communication": "friendly"}'),
    ('user123', 'work_patterns', '{"peak_hours": "morning", "focus_duration": 120, "break_frequency": 90}')
ON CONFLICT (user_id, context_type) DO UPDATE SET
    context_data = EXCLUDED.context_data,
    updated_at = CURRENT_TIMESTAMP;

-- =========================
-- 9. Final success message
-- =========================
SELECT 'Jia AI schema created successfully!' AS status;
