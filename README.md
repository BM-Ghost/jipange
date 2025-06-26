# 🚀 Jipange - AI-Powered Productivity Platform

Jipange is a futuristic AI-powered productivity platform that combines the best features of AI superpowers and collaborative scheduling.

## 🌟 Features

### 🧠 AI Assistant "Jia"
- Powered by OpenAI GPT-4o
- Smart task prioritization and scheduling
- Context-aware conversations with memory
- Voice-to-task conversion using Whisper

### 📋 Task Management
- Kanban boards, List views, and Gantt charts
- AI-powered task dependencies and auto-prioritization
- Recurring tasks with smart scheduling
- Mood-aware task reordering

### 📅 Smart Calendar
- 2-way Google Calendar sync
- AI-optimized time blocking
- Automatic rescheduling based on priorities
- Meeting conflict detection

### 🔔 Real-time Notifications
- WebSocket-powered live updates
- Email alerts for deadlines
- Browser notifications
- Slack integration

### 🧩 Chrome Extension
- Quick task creation from any webpage
- Voice input for hands-free task creation
- Pop-up calendar and day summary
- Context-aware task suggestions

## 🏗️ Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js 14    │    │   FastAPI       │    │   Chrome Ext    │
│   Frontend      │◄──►│   Backend       │◄──►│   Manifest V3   │
│                 │    │                 │    │                 │
│ • React         │    │ • OpenAI GPT-4o │    │ • React         │
│ • Tailwind CSS  │    │ • LangChain     │    │ • Voice Input   │
│ • shadcn/ui     │    │ • Pinecone      │    │ • Quick Actions │
│ • AI SDK        │    │ • WebSockets    │    │ • Context Menu  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend directory:**
   \`\`\`bash
   cd backend
   \`\`\`

2. **Run setup script:**
   \`\`\`bash
   chmod +x setup.sh
   ./setup.sh
   \`\`\`

3. **Update environment variables:**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your API keys
   \`\`\`

4. **Start the server:**
   \`\`\`bash
   python run.py
   \`\`\`

   The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies:**
   \`\`\`bash
   pnpm install
   \`\`\`

2. **Start development server:**
   \`\`\`bash
   pnpm dev
   \`\`\`

   The frontend will be available at `http://localhost:3000`

### Chrome Extension Setup

1. **Navigate to extension directory:**
   \`\`\`bash
   cd extension
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Build extension:**
   \`\`\`bash
   npm run build
   \`\`\`

4. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension/dist` folder

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

\`\`\`env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment

# Google Calendar API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Slack Integration
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_SIGNING_SECRET=your_slack_signing_secret
\`\`\`

## 📡 API Endpoints

### AI Endpoints
- `POST /api/ai/ask` - Chat with Jia AI assistant
- `POST /api/ai/schedule` - Get AI-optimized schedule suggestions
- `POST /api/ai/voice-to-task` - Convert voice input to tasks

### Task Management
- `GET /api/tasks/{user_id}` - Get user tasks
- `POST /api/tasks/` - Create new task
- `PUT /api/tasks/{task_id}` - Update task
- `DELETE /api/tasks/{task_id}` - Delete task

### Integrations
- `POST /api/integrations/google/webhook` - Google Calendar webhook
- `GET /api/integrations/google/calendar/{user_id}` - Fetch calendar events
- `POST /api/integrations/slack/events` - Slack events handler

## 🎯 Usage

### Creating Tasks

**Via Web App:**
1. Click "Add Task" in the dashboard
2. Fill in task details
3. Use AI suggestions for optimization

**Via Chrome Extension:**
1. Click the floating action button on any webpage
2. Use the popup interface
3. Try voice input with the microphone button

**Via Voice:**
1. Click the voice input button
2. Speak your task naturally
3. AI will extract and structure the task

### AI Assistant

**Chat with Jia:**
\`\`\`
"What should I work on next?"
"Reschedule my meetings for tomorrow"
"Find time for a 2-hour focus session"
"What are my productivity patterns?"
\`\`\`

### Keyboard Shortcuts

- `Ctrl/Cmd + Shift + J` - Quick add task (on any webpage)
- `Ctrl/Cmd + K` - Open command palette (in web app)

## 🔮 Advanced Features

### Mood-Aware Scheduling
Jia analyzes your work patterns and energy levels to:
- Suggest optimal times for different types of tasks
- Detect when you're in flow state
- Recommend breaks and context switching

### Smart Integrations
- **Google Calendar**: 2-way sync with intelligent conflict resolution
- **Slack**: Extract tasks from messages and update status via reactions
- **Email**: Parse action items from emails (coming soon)

## 🛠️ Development

### Project Structure
\`\`\`
jipange/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application
│   ├── routers/            # API route handlers
│   ├── requirements.txt    # Python dependencies
│   └── .env.example       # Environment template
├── extension/              # Chrome extension
│   ├── manifest.json      # Extension manifest
│   ├── popup.js           # Popup interface
│   ├── background.js      # Service worker
│   └── content.js         # Content script
├── components/            # React components
├── app/                   # Next.js app directory
└── README.md             # This file
\`\`\`

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Support

- 📧 Email: support@jipange.com
- 💬 Discord: [Join our community](https://discord.gg/jipange)
- 📖 Documentation: [docs.jipange.com](https://docs.jipange.com)

---

Built with ❤️ by the Jipange team
