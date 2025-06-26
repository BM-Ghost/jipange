"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, CheckCircle, Calendar, Users, MessageSquare, GitBranch } from "lucide-react"

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: "task_completed",
      title: 'Completed "API Documentation"',
      description: "Finished writing comprehensive API docs",
      timestamp: "2 minutes ago",
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
    {
      id: 2,
      type: "meeting_scheduled",
      title: "Meeting scheduled with design team",
      description: "Tomorrow at 2:00 PM - Product Review",
      timestamp: "15 minutes ago",
      icon: Calendar,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      id: 3,
      type: "collaboration",
      title: "Sarah commented on your task",
      description: '"Great progress on the landing page design!"',
      timestamp: "1 hour ago",
      icon: MessageSquare,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
    },
    {
      id: 4,
      type: "team_update",
      title: "Alex joined the project",
      description: 'New team member added to "Mobile App"',
      timestamp: "2 hours ago",
      icon: Users,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
    },
    {
      id: 5,
      type: "code_commit",
      title: "Code pushed to main branch",
      description: "Authentication system implementation",
      timestamp: "3 hours ago",
      icon: GitBranch,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/20",
    },
  ]

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "task_completed":
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Completed</Badge>
      case "meeting_scheduled":
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Scheduled</Badge>
      case "collaboration":
        return <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Comment</Badge>
      case "team_update":
        return <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">Team</Badge>
      case "code_commit":
        return <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Code</Badge>
      default:
        return <Badge variant="secondary">Update</Badge>
    }
  }

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          <div className="p-4 space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-700/30 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full ${activity.bgColor} flex items-center justify-center flex-shrink-0`}
                >
                  <activity.icon className={`w-4 h-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-white truncate">{activity.title}</h4>
                    {getActivityBadge(activity.type)}
                  </div>
                  <p className="text-xs text-slate-400 mb-1">{activity.description}</p>
                  <span className="text-xs text-slate-500">{activity.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
