"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { TaskOverview } from "@/components/dashboard/task-overview"
import { SmartCalendar } from "@/components/calendar/smart-calendar"
import { ProductivityStats } from "@/components/dashboard/productivity-stats"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { AIAssistant } from "@/components/ai/ai-assistant"
import { ProjectViews } from "@/components/project/project-views"

export default function Dashboard() {
  const [showProjectViews, setShowProjectViews] = useState(false)
  const [currentProject, setCurrentProject] = useState(null)

  // Sample project data for demonstration
  const sampleProject = {
    project_name: "AxuMint Trading Platform",
    description: "A social trading platform forged in the spirit of African greatness",
    total_duration_weeks: 24,
    start_date: "2024-06-25",
    end_date: "2024-12-25",
    modules: ["Trading Engine", "Social Features", "AI Insights", "Security"],
    phases: [
      {
        id: 1,
        name: "Foundation & Planning",
        description: "Project setup, architecture design, and core infrastructure",
        start_week: 1,
        duration_weeks: 4,
        tasks: [
          {
            id: "task_1",
            title: "Project Requirements Analysis",
            description: "Define detailed project requirements and user stories",
            estimated_hours: 40,
            priority: "high" as const,
            dependencies: [],
            assignee: "Product Manager",
            status: "backlog" as const,
          },
          {
            id: "task_2",
            title: "System Architecture Design",
            description: "Design scalable system architecture and technology stack",
            estimated_hours: 60,
            priority: "high" as const,
            dependencies: ["task_1"],
            assignee: "Lead Architect",
            status: "backlog" as const,
          },
        ],
        milestones: [
          {
            name: "Project Kickoff",
            description: "Project officially started with team alignment",
            due_week: 1,
          },
          {
            name: "Architecture Approved",
            description: "System architecture reviewed and approved",
            due_week: 4,
          },
        ],
      },
      {
        id: 2,
        name: "Core Development",
        description: "Development of core trading engine and basic features",
        start_week: 5,
        duration_weeks: 8,
        tasks: [
          {
            id: "task_3",
            title: "Trading Engine Development",
            description: "Build core trading functionality and order management",
            estimated_hours: 120,
            priority: "high" as const,
            dependencies: ["task_2"],
            assignee: "Backend Developer",
            status: "in-progress" as const,
          },
          {
            id: "task_4",
            title: "User Authentication System",
            description: "Implement secure user registration and login",
            estimated_hours: 40,
            priority: "medium" as const,
            dependencies: ["task_2"],
            assignee: "Security Engineer",
            status: "backlog" as const,
          },
        ],
        milestones: [
          {
            name: "MVP Trading Features",
            description: "Basic trading functionality completed",
            due_week: 10,
          },
        ],
      },
    ],
    risks: ["Market volatility impact", "Regulatory compliance", "Technical scalability"],
    success_criteria: ["Platform launched on time", "User adoption targets met", "Security standards achieved"],
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        <DashboardHeader />

        {showProjectViews && currentProject ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Project Plan</h2>
              <button
                onClick={() => setShowProjectViews(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
            <ProjectViews projectPlan={currentProject} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <QuickActions />
                <TaskOverview />
                <ProductivityStats />
              </div>
              <div className="space-y-6">
                <AIAssistant />
                <SmartCalendar />
              </div>
            </div>

            <RecentActivity />
          </>
        )}
      </div>
    </div>
  )
}
