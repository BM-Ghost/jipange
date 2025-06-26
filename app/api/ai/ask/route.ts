import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { type NextRequest, NextResponse } from "next/server"

// Simple in-memory conversation storage (replace with database in production)
const conversations = new Map<string, Array<{ role: string; content: string; timestamp: string }>>()
const projectPlans = new Map<string, any>() // Store generated project plans

interface ChatRequest {
  message: string
  user_id: string
  context?: string
  conversation_id?: string
}

interface ChatResponse {
  response: string
  conversation_id: string
  timestamp: string
  context_used: boolean
  suggestions: string[]
  actions: Array<{ type: string; label: string }>
  project_plan?: any
  plan_id?: string
  requires_timeline?: boolean
  next_steps?: string[]
}

// Supported Groq models in order of preference
const GROQ_MODELS = [
  "llama-3.1-8b-instant", // Fast and reliable
  "mixtral-8x7b-32768", // Good performance with larger context
  "gemma-7b-it", // Google's model
]

async function generateAIResponse(systemPrompt: string, message: string): Promise<string> {
  for (const modelName of GROQ_MODELS) {
    try {
      const { text } = await generateText({
        model: groq(modelName),
        system: systemPrompt,
        prompt: message,
        maxTokens: 500,
        temperature: 0.7,
      })
      return text
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error)
      // Continue to next model
    }
  }

  // If all models fail, throw the last error
  throw new Error("All Groq models failed. Please check model availability.")
}

async function detectProjectPlanningIntent(message: string): Promise<boolean> {
  const projectKeywords = [
    "project",
    "plan",
    "schedule",
    "timeline",
    "roadmap",
    "phases",
    "development",
    "build",
    "create",
    "launch",
    "mvp",
    "platform",
    "months",
    "weeks",
    "deadline",
    "deliverables",
    "milestones",
    "axumint",
    "trading",
    "social",
    "community",
    "modules",
    "features",
  ]

  const messageWords = message.toLowerCase().split(/\s+/)
  const keywordMatches = projectKeywords.filter((keyword) => messageWords.some((word) => word.includes(keyword))).length

  // If message is long (>50 words) and has project keywords, likely a project plan
  return messageWords.length > 50 && keywordMatches >= 3
}

async function generateProjectPlan(message: string, timeline?: string): Promise<any> {
  const planningPrompt = `You are an expert project manager. Analyze this project description and create a comprehensive project plan.

PROJECT DESCRIPTION: "${message}"
${timeline ? `TIMELINE: ${timeline}` : ""}

Create a detailed project plan with the following structure:
1. Extract project name, description, and key objectives
2. Identify main modules/features mentioned
3. Break down into phases with specific tasks
4. Estimate durations and dependencies
5. Create timeline with milestones

Return ONLY valid JSON in this exact format:
{
  "project_name": "string",
  "description": "string", 
  "total_duration_weeks": number,
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "modules": ["module1", "module2"],
  "phases": [
    {
      "id": 1,
      "name": "Phase Name",
      "description": "Phase description",
      "start_week": 1,
      "duration_weeks": 4,
      "tasks": [
        {
          "id": "task_1",
          "title": "Task Title",
          "description": "Task description",
          "estimated_hours": 40,
          "priority": "high|medium|low",
          "dependencies": ["task_id"],
          "assignee": "TBD",
          "status": "backlog"
        }
      ],
      "milestones": [
        {
          "name": "Milestone Name",
          "description": "Milestone description",
          "due_week": 4
        }
      ]
    }
  ],
  "risks": ["risk1", "risk2"],
  "success_criteria": ["criteria1", "criteria2"]
}`

  try {
    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      system: "You are an expert project manager who creates detailed, realistic project plans.",
      prompt: planningPrompt,
      maxTokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    })

    return JSON.parse(text)
  } catch (error) {
    console.error("Project plan generation failed:", error)
    return createFallbackPlan(message)
  }
}

function createFallbackPlan(message: string): any {
  const projectName = extractProjectName(message) || "New Project"
  const today = new Date()
  const endDate = new Date(today)
  endDate.setMonth(endDate.getMonth() + 3) // Default 3 months

  return {
    project_name: projectName,
    description: message.substring(0, 200) + "...",
    total_duration_weeks: 12,
    start_date: today.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
    modules: ["Core Features", "User Interface", "Testing"],
    phases: [
      {
        id: 1,
        name: "Planning & Setup",
        description: "Initial project setup and planning",
        start_week: 1,
        duration_weeks: 2,
        tasks: [
          {
            id: "task_1",
            title: "Project Requirements Analysis",
            description: "Define detailed project requirements",
            estimated_hours: 20,
            priority: "high",
            dependencies: [],
            assignee: "TBD",
            status: "backlog",
          },
        ],
        milestones: [
          {
            name: "Project Kickoff",
            description: "Project officially started",
            due_week: 1,
          },
        ],
      },
    ],
    risks: ["Timeline constraints", "Resource availability"],
    success_criteria: ["Project delivered on time", "All features implemented"],
  }
}

function extractProjectName(message: string): string | null {
  // Look for patterns like "AxuMint:", "Project:", etc.
  const namePatterns = [
    /([A-Z][a-zA-Z0-9]*)\s*:/,
    /(?:project|platform|app|system)\s+(?:called|named)\s+([A-Z][a-zA-Z0-9]*)/i,
    /([A-Z][a-zA-Z0-9]*)\s+(?:platform|project|app|system)/i,
  ]

  for (const pattern of namePatterns) {
    const match = message.match(pattern)
    if (match) return match[1]
  }

  return null
}

function parseTimelineFromMessage(message: string): string | null {
  const timelinePatterns = [
    /starting\s+([A-Za-z]+\s+\d+).*?(?:finishing|ending|completing).*?([A-Za-z]+)/i,
    /(\d+)\s+months?\s+starting\s+([A-Za-z]+\s+\d+)/i,
    /by\s+([A-Za-z]+\s+\d*)/i,
    /(\d+)\s+months?/i,
    /Q(\d)\s+(\d{4})/i,
  ]

  for (const pattern of timelinePatterns) {
    const match = message.match(pattern)
    if (match) return match[0]
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { message, user_id, context, conversation_id } = body

    if (!message || !user_id) {
      return NextResponse.json({ error: "Message and user_id are required" }, { status: 400 })
    }

    // Create or get conversation ID
    const convId = conversation_id || `conv_${user_id}_${Date.now()}`

    // Get conversation history
    const history = conversations.get(convId) || []

    // Build context-aware system prompt
    const currentTime = new Date().toISOString()
    const conversationContext =
      history.length > 0
        ? `\n\nCONVERSATION HISTORY:\n${history
            .slice(-5)
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join("\n")}`
        : ""

    // Check if this is a project planning request
    const isProjectPlan = await detectProjectPlanningIntent(message)
    const timeline = parseTimelineFromMessage(message)

    let systemPrompt = ""
    let aiResponse = ""
    let projectPlan = null
    let planId = null
    let requiresTimeline = false
    let nextSteps: string[] = []

    if (isProjectPlan) {
      systemPrompt = `You are Jia, an expert AI project manager and productivity assistant. You help users create comprehensive project plans from their ideas.

CURRENT CONTEXT:
- Current time: ${currentTime}
- User context: ${context || "Project planning request"}
- Conversation: ${history.length > 0 ? "Continuing conversation" : "New conversation"}${conversationContext}

PROJECT PLANNING CAPABILITIES:
- Break down complex projects into manageable phases
- Create realistic timelines with proper dependencies
- Identify key milestones and deliverables
- Suggest resource requirements and potential risks
- Provide actionable next steps

RESPONSE GUIDELINES:
1. If timeline is not specified, ask for duration and dates
2. Create detailed phase breakdowns with specific tasks
3. Identify dependencies and potential blockers
4. Suggest realistic time estimates
5. Provide clear next steps for implementation

The user has described a project. Help them create a comprehensive plan.`

      // Check if we have enough information to generate a plan
      if (timeline || message.toLowerCase().includes("month") || message.toLowerCase().includes("week")) {
        // Generate the project plan
        projectPlan = await generateProjectPlan(message, timeline || undefined)
        planId = `plan_${Date.now()}`
        projectPlans.set(planId, projectPlan)

        aiResponse = `I've analyzed your project description and created a comprehensive plan for **${projectPlan.project_name}**!

## 📋 Project Overview
**Duration:** ${projectPlan.total_duration_weeks} weeks (${projectPlan.start_date} to ${projectPlan.end_date})
**Modules:** ${projectPlan.modules.join(", ")}

## 🎯 Key Phases
${projectPlan.phases
  .map(
    (phase: any) =>
      `**${phase.name}** (Week ${phase.start_week}-${phase.start_week + phase.duration_weeks - 1})\n${phase.description}\n• ${phase.tasks.length} tasks planned\n• ${phase.milestones.length} milestone(s)`,
  )
  .join("\n\n")}

## ⚠️ Identified Risks
${projectPlan.risks.map((risk: string) => `• ${risk}`).join("\n")}

## ✅ Success Criteria
${projectPlan.success_criteria.map((criteria: string) => `• ${criteria}`).join("\n")}

Your project plan is now available in **Kanban**, **Gantt**, and **List** views. Would you like to review the detailed breakdown and confirm the schedule?`

        nextSteps = [
          "Review the detailed task breakdown in each view",
          "Confirm timeline and resource allocation",
          "Assign team members to specific tasks",
          "Set up calendar integration for milestones",
          "Begin with Phase 1 planning and kickoff",
        ]
      } else {
        // Ask for timeline clarification
        requiresTimeline = true
        aiResponse = `I can help you create a comprehensive project plan for this exciting project! 

To create the most accurate timeline and task breakdown, I need to know:

**📅 Timeline Information:**
- How long do you want this project to take? (e.g., "3 months", "6 weeks")
- Do you have a specific start date? (e.g., "June 25th", "next month")
- Any hard deadlines I should know about?

**🎯 Additional Context:**
- Team size (solo, small team, large team)?
- Budget constraints?
- Any specific technologies you prefer?

Once you provide the timeline, I'll create a detailed project plan with:
- ✅ Phase-by-phase breakdown
- ✅ Task prioritization and dependencies  
- ✅ Milestone tracking
- ✅ Resource allocation
- ✅ Risk assessment

Please share your preferred timeline and I'll get started!`
      }
    } else {
      systemPrompt = `You are Jia, an advanced AI productivity assistant. You are helpful, intelligent, and personable.

CORE CAPABILITIES:
- Task management and prioritization
- Schedule optimization and time blocking
- Productivity insights and recommendations
- Goal tracking and progress analysis
- Meeting and deadline management
- Work-life balance guidance

PERSONALITY TRAITS:
- Friendly and approachable
- Proactive in offering help
- Detail-oriented but not overwhelming
- Encouraging and motivational
- Adaptable to user preferences

CURRENT CONTEXT:
- Current time: ${currentTime}
- User context: ${context || "General productivity assistance"}
- Conversation: ${history.length > 0 ? "Continuing conversation" : "New conversation"}${conversationContext}

RESPONSE GUIDELINES:
1. Always acknowledge the user's specific question or request
2. Provide actionable, specific advice
3. Ask clarifying questions when needed
4. Reference previous conversations when relevant
5. Offer concrete next steps
6. Be concise but thorough

Remember: You have access to conversation history. Use this information to provide personalized, contextual responses.`

      aiResponse = await generateAIResponse(systemPrompt, message)
    }

    // Generate contextual suggestions and actions
    const { suggestions, actions } = generateSuggestionsAndActions(message, aiResponse, isProjectPlan)

    // Save conversation history
    const userMessage = { role: "user", content: message, timestamp: currentTime }
    const assistantMessage = { role: "assistant", content: aiResponse, timestamp: new Date().toISOString() }

    const updatedHistory = [...history, userMessage, assistantMessage]
    conversations.set(convId, updatedHistory.slice(-20)) // Keep last 20 messages

    const response: ChatResponse = {
      response: aiResponse,
      conversation_id: convId,
      timestamp: new Date().toISOString(),
      context_used: history.length > 0 || !!context,
      suggestions,
      actions,
      project_plan: projectPlan,
      plan_id: planId,
      requires_timeline: requiresTimeline,
      next_steps: nextSteps.length > 0 ? nextSteps : undefined,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("AI API Error:", error)

    // Enhanced fallback response with error context
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const isModelError = errorMessage.includes("decommissioned") || errorMessage.includes("model")

    const fallbackResponse: ChatResponse = {
      response: generateEnhancedFallbackResponse(isModelError),
      conversation_id: `fallback_${Date.now()}`,
      timestamp: new Date().toISOString(),
      context_used: false,
      suggestions: [
        "What can I help you with today?",
        "Tell me about your project idea",
        "How can I improve your productivity?",
        "Help me plan my schedule",
      ],
      actions: [
        { type: "help", label: "Get Help" },
        { type: "create_plan", label: "Create Project Plan" },
        { type: "productivity_tips", label: "Get Tips" },
      ],
    }

    return NextResponse.json(fallbackResponse)
  }
}

function generateEnhancedFallbackResponse(isModelError: boolean): string {
  if (isModelError) {
    return `Hi! I'm Jia, your AI productivity assistant. I'm currently updating my AI models to serve you better. 

While I work on that, here's how I can help you:

🎯 **Project Planning**
• Transform ideas into structured project plans
• Break down complex projects into manageable phases
• Create timelines with dependencies and milestones

📅 **Schedule Optimization** 
• Find optimal times for different types of work
• Block focus time for deep work sessions
• Balance meetings with productive work time

📊 **Task Management**
• Create and organize tasks with priorities
• Track progress across Kanban, Gantt, and List views
• Set smart reminders and deadlines

I'll be back to full AI-powered responses shortly. In the meantime, feel free to describe your project ideas!`
  }

  return `Hi! I'm Jia, your AI productivity assistant. I specialize in turning your project ideas into actionable plans!

I can help you with:

• **Project Planning** - Turn complex ideas into structured plans
• **Task Management** - Organize and prioritize your work
• **Schedule Optimization** - Find the best times for different activities
• **Productivity Insights** - Get personalized tips and recommendations

Try describing a project you'd like to work on, and I'll help you create a comprehensive plan with timelines, tasks, and milestones!`
}

function generateSuggestionsAndActions(
  userMessage: string,
  aiResponse: string,
  isProjectPlan: boolean,
): {
  suggestions: string[]
  actions: Array<{ type: string; label: string }>
} {
  const suggestions: string[] = []
  const actions: Array<{ type: string; label: string }> = []

  const messageLower = userMessage.toLowerCase()

  if (isProjectPlan) {
    suggestions.push("Review the project breakdown", "Adjust timeline or scope", "Assign team members")
    actions.push(
      { type: "view_kanban", label: "View Kanban Board" },
      { type: "view_gantt", label: "View Gantt Chart" },
      { type: "export_calendar", label: "Export to Calendar" },
    )
    return { suggestions, actions }
  }

  // Name/identity questions
  if (messageLower.includes("name") || messageLower.includes("who are you")) {
    suggestions.push("What can you help me with?", "Show me project planning features", "Give me productivity tips")
    actions.push({ type: "tour", label: "Take a Tour" }, { type: "help", label: "Get Help" })
  }

  // Tomorrow/planning questions
  else if (messageLower.includes("tomorrow") || messageLower.includes("plan")) {
    suggestions.push(
      "What are my priorities for tomorrow?",
      "Help me create a daily schedule",
      "Show me planning templates",
    )
    actions.push(
      { type: "plan_tomorrow", label: "Plan Tomorrow" },
      { type: "daily_plan", label: "Create Daily Plan" },
      { type: "set_priorities", label: "Set Priorities" },
    )
  }

  // Task-related questions
  else if (messageLower.includes("task") || messageLower.includes("todo") || messageLower.includes("work")) {
    suggestions.push("Help me prioritize my tasks", "Create a task management system", "Show me productivity tips")
    actions.push(
      { type: "create_task", label: "Create Task" },
      { type: "prioritize", label: "Prioritize Tasks" },
      { type: "productivity_tips", label: "Get Tips" },
    )
  }

  // Project planning questions
  else if (messageLower.includes("project") || messageLower.includes("development") || messageLower.includes("build")) {
    suggestions.push("Help me break down this project", "Create a timeline", "Show me project templates")
    actions.push(
      { type: "create_plan", label: "Create Project Plan" },
      { type: "set_timeline", label: "Set Timeline" },
      { type: "view_templates", label: "View Templates" },
    )
  }

  // Default suggestions
  else {
    suggestions.push("What should I focus on next?", "Help me plan my day", "Show me productivity features")
    actions.push(
      { type: "daily_plan", label: "Plan My Day" },
      { type: "productivity_tips", label: "Get Tips" },
      { type: "help", label: "Get Help" },
    )
  }

  return {
    suggestions: suggestions.slice(0, 4),
    actions: actions.slice(0, 3),
  }
}
