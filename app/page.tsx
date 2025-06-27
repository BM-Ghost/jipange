"use client"

import { useSession } from "next-auth/react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { TaskOverview } from "@/components/dashboard/task-overview"
import { SmartCalendar } from "@/components/calendar/smart-calendar"
import { AIAssistant } from "@/components/ai/ai-assistant"
import { ProductivityStats } from "@/components/dashboard/productivity-stats"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { signIn } from "next-auth/react"
import { Bot, Calendar, BarChart3, CheckCircle, Zap, Users } from "lucide-react"

export default function Dashboard() {
  const { data: session, status } = useSession()

  // Show loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div className="text-white text-lg">Loading Jipange...</div>
        </div>
      </div>
    )
  }

  // Show authenticated dashboard
  if (session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto p-6 space-y-6">
          <DashboardHeader />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <QuickActions />
              <TaskOverview />
              <RecentActivity />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <AIAssistant />
              <SmartCalendar />
              <ProductivityStats />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white">Jipange</h1>
          </div>

          <h2 className="text-3xl font-bold text-white">AI-Powered Productivity Platform</h2>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Transform your productivity with intelligent project planning, smart scheduling, and AI-powered task
            management. Let Jia, your AI assistant, help you achieve more.
          </p>

          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={() => signIn()}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
            >
              Get Started Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-3"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-purple-400" />
              </div>
              <CardTitle className="text-white">AI Project Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Describe your project idea and Jia will create comprehensive plans with phases, tasks, timelines, and
                dependencies automatically.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <CardTitle className="text-white">Smart Calendar Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Seamlessly sync with Google Calendar and GitHub. Export project timelines, set smart reminders, and
                optimize your schedule.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-green-400" />
              </div>
              <CardTitle className="text-white">Multiple Project Views</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Visualize your projects in Kanban boards, detailed lists, or Gantt charts. Choose the view that works
                best for your workflow.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <CardTitle className="text-white">Intelligent Task Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                AI-powered task prioritization, dependency tracking, and progress monitoring. Stay on top of what
                matters most.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-red-400" />
              </div>
              <CardTitle className="text-white">Smart Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Get notified via email, push notifications, or SMS. Never miss important deadlines or milestones again.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-pink-400" />
              </div>
              <CardTitle className="text-white">Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Share projects, assign tasks, and collaborate with your team. Keep everyone aligned and productive.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 space-y-6">
          <h3 className="text-2xl font-bold text-white">Ready to Transform Your Productivity?</h3>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Join thousands of professionals who use Jipange to plan better, work smarter, and achieve their goals faster
            with AI assistance.
          </p>
          <Button
            onClick={() => signIn()}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 text-lg"
          >
            Start Your Free Trial
          </Button>
        </div>
      </div>
    </div>
  )
}
