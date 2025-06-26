"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Send, Sparkles, Lightbulb, User, Clock, Zap, AlertCircle, Wifi, WifiOff, CheckCircle } from "lucide-react"

interface Message {
  id: number
  type: "user" | "ai"
  content: string
  timestamp: Date
  suggestions?: string[]
  actions?: Array<{ type: string; label: string }>
  project_plan?: any
  plan_id?: string
  next_steps?: string[]
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

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "ai",
      content:
        "Hi! I'm Jia, your AI productivity assistant. I can help you transform project ideas into structured plans with timelines, tasks, and milestones. Try describing a project you'd like to work on!",
      timestamp: new Date(),
      suggestions: [
        "🌍 AxuMint: A Platform Forged in the Spirit of African Greatness",
        "Help me plan a 3-month development project",
        "What can you help me with?",
        "Show me project planning features",
      ],
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("connected")
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight
      }
    }
  }, [messages])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue("")
    setIsLoading(true)
    setIsTyping(true)
    setConnectionStatus("connecting")
    setError(null)

    try {
      // Use Next.js API route
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          user_id: "user123", // Replace with actual user ID from auth
          context: `Dashboard context - Current time: ${new Date().toISOString()}`,
          conversation_id: conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: ChatResponse = await response.json()
      setConnectionStatus("connected")

      // Set conversation ID for future messages
      if (!conversationId) {
        setConversationId(result.conversation_id)
      }

      // Simulate typing delay for better UX
      setTimeout(
        () => {
          const aiMessage: Message = {
            id: messages.length + 2,
            type: "ai",
            content: result.response,
            timestamp: new Date(),
            suggestions: result.suggestions,
            actions: result.actions,
            project_plan: result.project_plan,
            plan_id: result.plan_id,
            next_steps: result.next_steps,
          }

          setMessages((prev) => [...prev, aiMessage])
          setIsTyping(false)
        },
        Math.min(result.response.length * 20, 2000),
      ) // Dynamic typing delay
    } catch (error) {
      console.error("Error sending message:", error)
      setConnectionStatus("disconnected")
      setError(error instanceof Error ? error.message : "Failed to send message")

      // Enhanced fallback response based on user input
      const fallbackMessage: Message = {
        id: messages.length + 2,
        type: "ai",
        content: generateLocalFallbackResponse(currentInput),
        timestamp: new Date(),
        suggestions: [
          "Try asking again",
          "Check your connection",
          "What can you help me with?",
          "Show me offline features",
        ],
      }

      setTimeout(() => {
        setMessages((prev) => [...prev, fallbackMessage])
        setIsTyping(false)
      }, 1000)
    } finally {
      setIsLoading(false)
    }
  }

  const generateLocalFallbackResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()

    // Project planning fallback
    if (input.includes("axumint") || input.includes("project") || input.includes("platform")) {
      return "I can help you create a comprehensive project plan! Even though I'm having connection issues, here's what I normally do:\n\n🎯 **Project Analysis**\n• Extract key objectives and scope\n• Identify modules and features\n• Break down into manageable phases\n\n📅 **Timeline Creation**\n• Generate realistic schedules\n• Set milestones and dependencies\n• Create Kanban, Gantt, and List views\n\n✅ **Plan Confirmation**\n• Review and adjust timelines\n• Assign team members\n• Sync with calendar\n\nOnce I'm back online, I can transform your project ideas into detailed, actionable plans!"
    }

    // Name questions
    if (input.includes("name") || input.includes("who are you")) {
      return "I'm Jia, your AI productivity assistant! Even though I'm having connection issues right now, I can still help you understand what I do. I specialize in transforming project ideas into structured plans with timelines, tasks, and milestones. Once we're reconnected, I'll be able to provide personalized project planning assistance!"
    }

    // Default fallback
    return "I'm currently having connection issues, but I'm still here to help as best I can! I'm Jia, your AI productivity assistant, and I specialize in:\n\n• **Project Planning** - Turn complex ideas into structured plans\n• **Task Management** - Organize and prioritize your work\n• **Schedule Optimization** - Find the best times for different activities\n• **Timeline Creation** - Generate realistic schedules with milestones\n\nPlease try your question again, or check your internet connection. I'll be back to full functionality soon!"
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const handleActionClick = (action: { type: string; label: string }) => {
    // Handle different action types
    const actionPrompts: Record<string, string> = {
      create_task: "Help me create a new task",
      view_tasks: "Show me my current tasks",
      view_calendar: "Show me my calendar for today",
      plan_tomorrow: "Help me plan tomorrow",
      prioritize: "Help me prioritize my tasks",
      productivity_report: "Show me my productivity insights",
      schedule_focus: "Help me schedule focus time",
      optimize_schedule: "Optimize my schedule",
      tour: "Give me a tour of your features",
      help: "What can you help me with?",
      daily_plan: "Help me plan my day",
      insights: "Show me productivity insights",
      create_plan: "Help me create a project plan",
      set_timeline: "Help me set a project timeline",
      view_templates: "Show me project templates",
      view_kanban: "Show me the Kanban board view",
      view_gantt: "Show me the Gantt chart view",
      export_calendar: "Export this plan to my calendar",
    }

    setInputValue(actionPrompts[action.type] || action.label)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="w-3 h-3" />
      case "connecting":
        return <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      case "disconnected":
        return <WifiOff className="w-3 h-3" />
    }
  }

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-300 border-green-500/30 bg-green-500/20"
      case "connecting":
        return "text-yellow-300 border-yellow-500/30 bg-yellow-500/20"
      case "disconnected":
        return "text-red-300 border-red-500/30 bg-red-500/20"
    }
  }

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 h-96 flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-white flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Bot className="w-3 h-3 text-white" />
          </div>
          <span>Jia AI Assistant</span>
          <Badge variant="secondary" className={`${getConnectionColor()}`}>
            <div className="mr-1">{getConnectionIcon()}</div>
            {connectionStatus === "connected" && "Online"}
            {connectionStatus === "connecting" && "Connecting"}
            {connectionStatus === "disconnected" && "Offline"}
          </Badge>
          {conversationId && connectionStatus === "connected" && (
            <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Session Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex flex-col flex-1 min-h-0">
        {/* Error Alert */}
        {error && (
          <div className="px-4 pb-2">
            <Alert className="bg-red-500/10 border-red-500/30 text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Connection error: {error}. Responses may be limited.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] space-y-2">
                  <div
                    className={`p-3 rounded-lg ${
                      message.type === "user" ? "bg-purple-500 text-white ml-auto" : "bg-slate-700/50 text-slate-200"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === "ai" && <Bot className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" />}
                      {message.type === "user" && <User className="w-4 h-4 mt-0.5 text-white flex-shrink-0" />}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Project Plan Preview */}
                  {message.project_plan && (
                    <Card className="bg-slate-600/30 border-slate-500/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white text-sm">📋 Project Plan Created</h4>
                          <div className="flex space-x-1">
                            <Button size="sm" className="bg-green-500 hover:bg-green-600 h-7 text-xs">
                              Confirm
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs border-slate-500">
                              Export
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-slate-300 space-y-1">
                          <div>📅 Duration: {message.project_plan.total_duration_weeks} weeks</div>
                          <div>🎯 Phases: {message.project_plan.phases?.length || 0}</div>
                          <div>
                            ✅ Tasks:{" "}
                            {message.project_plan.phases?.reduce(
                              (acc: number, phase: any) => acc + (phase.tasks?.length || 0),
                              0,
                            ) || 0}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Next Steps */}
                  {message.next_steps && message.next_steps.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-slate-400">Next steps:</span>
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        {message.next_steps.map((step, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <span className="text-purple-400">{index + 1}.</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {message.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleActionClick(action)}
                          className="text-xs bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white h-7"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-slate-400">Quick suggestions:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 justify-start p-1 h-auto min-h-6"
                          >
                            <Lightbulb className="w-3 h-3 mr-1" />
                            <span className="truncate max-w-32">{suggestion}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-700/50 text-slate-200 p-3 rounded-lg max-w-[85%]">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <div className="flex space-x-1">
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400">Jia is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-slate-700/50 flex-shrink-0">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe your project idea or ask anything..."
              className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-400 flex-1"
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="bg-purple-500 hover:bg-purple-600 flex-shrink-0 disabled:opacity-50"
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Connection status */}
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span>
              {conversationId ? `Connected to Jia • ${messages.length - 1} messages` : "Ready for new conversation"}
            </span>
            <span className="flex items-center space-x-1">
              <div
                className={`w-1 h-1 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-400 animate-pulse"
                    : connectionStatus === "connecting"
                      ? "bg-yellow-400 animate-pulse"
                      : "bg-red-400"
                }`}
              />
              <span>
                Groq AI{" "}
                {connectionStatus === "connected"
                  ? "• Fast"
                  : connectionStatus === "connecting"
                    ? "• Connecting"
                    : "• Offline"}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
