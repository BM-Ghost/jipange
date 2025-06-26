"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Circle, Clock, AlertTriangle, MoreHorizontal, Calendar, Users } from "lucide-react"

export function TaskOverview() {
  const [activeView, setActiveView] = useState("kanban")

  const tasks = [
    {
      id: 1,
      title: "Design new landing page",
      description: "Create wireframes and mockups for the new product landing page",
      status: "in-progress",
      priority: "high",
      dueDate: "2024-01-15",
      assignee: "Sarah Chen",
      progress: 65,
      tags: ["Design", "Frontend"],
    },
    {
      id: 2,
      title: "Implement user authentication",
      description: "Set up Clerk.dev integration for user login and registration",
      status: "todo",
      priority: "medium",
      dueDate: "2024-01-18",
      assignee: "Alex Kumar",
      progress: 0,
      tags: ["Backend", "Security"],
    },
    {
      id: 3,
      title: "Write API documentation",
      description: "Document all REST endpoints for the mobile app team",
      status: "completed",
      priority: "low",
      dueDate: "2024-01-12",
      assignee: "Mike Johnson",
      progress: 100,
      tags: ["Documentation"],
    },
    {
      id: 4,
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automated testing and deployment",
      status: "in-progress",
      priority: "high",
      dueDate: "2024-01-16",
      assignee: "Emma Davis",
      progress: 40,
      tags: ["DevOps", "Automation"],
    },
  ]

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
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-400" />
      case "todo":
        return <Circle className="w-4 h-4 text-slate-400" />
      default:
        return <Circle className="w-4 h-4 text-slate-400" />
    }
  }

  const KanbanView = () => {
    const columns = [
      { id: "todo", title: "To Do", tasks: tasks.filter((t) => t.status === "todo") },
      { id: "in-progress", title: "In Progress", tasks: tasks.filter((t) => t.status === "in-progress") },
      { id: "completed", title: "Completed", tasks: tasks.filter((t) => t.status === "completed") },
    ]

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-200">{column.title}</h3>
              <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                {column.tasks.length}
              </Badge>
            </div>
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

                    {task.status === "in-progress" && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-1" />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        <div className="flex items-center space-x-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span>{task.dueDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-slate-400">
                        <Users className="w-3 h-3" />
                        <span>{task.assignee.split(" ")[0]}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs bg-slate-600/30 text-slate-300 border-slate-500/30"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const ListView = () => (
    <div className="space-y-2">
      {tasks.map((task) => (
        <Card key={task.id} className="bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(task.status)}
                <div>
                  <h4 className="font-medium text-white">{task.title}</h4>
                  <p className="text-sm text-slate-400">{task.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                <div className="text-sm text-slate-400">{task.dueDate}</div>
                <div className="text-sm text-slate-400">{task.assignee}</div>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-white">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Task Overview</CardTitle>
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList className="bg-slate-700/50">
              <TabsTrigger value="kanban" className="data-[state=active]:bg-purple-500">
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-purple-500">
                List
              </TabsTrigger>
              <TabsTrigger value="gantt" className="data-[state=active]:bg-purple-500">
                Gantt
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
          <TabsContent value="list">
            <ListView />
          </TabsContent>
          <TabsContent value="gantt">
            <div className="flex items-center justify-center h-64 text-slate-400">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <p>Gantt chart view coming soon!</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
