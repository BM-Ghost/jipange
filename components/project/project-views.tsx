"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Calendar,
  Users,
  BarChart3,
  List,
  Kanban,
  Target,
} from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  estimated_hours: number
  priority: "high" | "medium" | "low"
  dependencies: string[]
  assignee: string
  status: "backlog" | "in-progress" | "review" | "done"
  phase_id: number
}

interface Phase {
  id: number
  name: string
  description: string
  start_week: number
  duration_weeks: number
  tasks: Task[]
  milestones: Array<{
    name: string
    description: string
    due_week: number
  }>
}

interface ProjectPlan {
  project_name: string
  description: string
  total_duration_weeks: number
  start_date: string
  end_date: string
  modules: string[]
  phases: Phase[]
  risks: string[]
  success_criteria: string[]
}

interface ProjectViewsProps {
  projectPlan: ProjectPlan
}

export function ProjectViews({ projectPlan }: ProjectViewsProps) {
  const [activeView, setActiveView] = useState("kanban")

  // Flatten all tasks from all phases
  const allTasks = projectPlan.phases.flatMap((phase) =>
    phase.tasks.map((task) => ({
      ...task,
      phase_name: phase.name,
      phase_start_week: phase.start_week,
    })),
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-400" />
      case "review":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case "backlog":
        return <Circle className="w-4 h-4 text-slate-400" />
      default:
        return <Circle className="w-4 h-4 text-slate-400" />
    }
  }

  const KanbanView = () => {
    const columns = [
      { id: "backlog", title: "Backlog", tasks: allTasks.filter((t) => t.status === "backlog") },
      { id: "in-progress", title: "In Progress", tasks: allTasks.filter((t) => t.status === "in-progress") },
      { id: "review", title: "Review", tasks: allTasks.filter((t) => t.status === "review") },
      { id: "done", title: "Done", tasks: allTasks.filter((t) => t.status === "done") },
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-200">{column.title}</h3>
              <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                {column.tasks.length}
              </Badge>
            </div>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {column.tasks.map((task) => (
                  <Card
                    key={task.id}
                    className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/70 transition-colors cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white text-sm">{task.title}</h4>
                        <Button variant="ghost" size="icon" className="w-6 h-6 text-slate-400 hover:text-white">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{task.description}</p>

                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        <div className="text-xs text-slate-400">{task.estimated_hours}h</div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-400">Phase: {(task as any).phase_name}</div>
                        <div className="flex items-center space-x-1 text-xs text-slate-400">
                          <Users className="w-3 h-3" />
                          <span>{task.assignee}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>
    )
  }

  const GanttView = () => {
    const totalWeeks = projectPlan.total_duration_weeks
    const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1)

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 mb-4">
              <div className="col-span-4 text-sm font-medium text-slate-300">Phase / Task</div>
              <div className="col-span-8 grid grid-cols-12 gap-1">
                {weeks.map((week) => (
                  <div key={week} className="text-xs text-slate-400 text-center">
                    W{week}
                  </div>
                ))}
              </div>
            </div>

            {/* Phases and Tasks */}
            <div className="space-y-2">
              {projectPlan.phases.map((phase) => (
                <div key={phase.id} className="space-y-1">
                  {/* Phase Row */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-white">{phase.name}</span>
                      </div>
                    </div>
                    <div className="col-span-8 grid grid-cols-12 gap-1">
                      {weeks.map((week) => {
                        const isInPhase = week >= phase.start_week && week < phase.start_week + phase.duration_weeks
                        return (
                          <div
                            key={week}
                            className={`h-6 rounded ${
                              isInPhase ? "bg-purple-500/30 border border-purple-500/50" : "bg-slate-700/20"
                            }`}
                          />
                        )
                      })}
                    </div>
                  </div>

                  {/* Task Rows */}
                  {phase.tasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="grid grid-cols-12 gap-2 items-center ml-6">
                      <div className="col-span-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(task.status)}
                          <span className="text-xs text-slate-300">{task.title}</span>
                        </div>
                      </div>
                      <div className="col-span-8 grid grid-cols-12 gap-1">
                        {weeks.map((week) => {
                          const taskWeek = phase.start_week + Math.floor(Math.random() * phase.duration_weeks)
                          const isTaskWeek = week === taskWeek
                          return (
                            <div
                              key={week}
                              className={`h-4 rounded ${
                                isTaskWeek ? "bg-blue-500/50 border border-blue-500/70" : "bg-slate-700/10"
                              }`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Milestones */}
        <Card className="bg-slate-700/30 border-slate-600/50">
          <CardHeader>
            <CardTitle className="text-white text-sm">Key Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projectPlan.phases.flatMap((phase) =>
                phase.milestones.map((milestone, index) => (
                  <div key={`${phase.id}-${index}`} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white">{milestone.name}</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      Week {milestone.due_week}
                    </Badge>
                  </div>
                )),
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const ListView = () => (
    <div className="space-y-4">
      {projectPlan.phases.map((phase) => (
        <Card key={phase.id} className="bg-slate-700/30 border-slate-600/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm">{phase.name}</CardTitle>
              <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                Week {phase.start_week}-{phase.start_week + phase.duration_weeks - 1}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">{phase.description}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {phase.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg hover:bg-slate-600/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <h4 className="font-medium text-white text-sm">{task.title}</h4>
                      <p className="text-xs text-slate-400">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    <div className="text-xs text-slate-400">{task.estimated_hours}h</div>
                    <div className="text-xs text-slate-400">{task.assignee}</div>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Milestones */}
            {phase.milestones.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-600/50">
                <h5 className="text-xs font-medium text-slate-300 mb-2">Milestones</h5>
                <div className="space-y-1">
                  {phase.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs text-slate-300">{milestone.name}</span>
                      </div>
                      <span className="text-xs text-slate-400">Week {milestone.due_week}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">{projectPlan.project_name}</CardTitle>
            <p className="text-sm text-slate-400 mt-1">
              {projectPlan.total_duration_weeks} weeks • {projectPlan.phases.length} phases • {allTasks.length} tasks
            </p>
          </div>
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList className="bg-slate-700/50">
              <TabsTrigger value="kanban" className="data-[state=active]:bg-purple-500">
                <Kanban className="w-4 h-4 mr-1" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="gantt" className="data-[state=active]:bg-purple-500">
                <BarChart3 className="w-4 h-4 mr-1" />
                Gantt
              </TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-purple-500">
                <List className="w-4 h-4 mr-1" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeView}>
          <TabsContent value="kanban">
            <KanbanView />
          </TabsContent>
          <TabsContent value="gantt">
            <GanttView />
          </TabsContent>
          <TabsContent value="list">
            <ListView />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
