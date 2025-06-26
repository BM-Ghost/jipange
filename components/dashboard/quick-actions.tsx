"use client"

import { Plus, Calendar, Mic, Camera, Timer, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function QuickActions() {
  const actions = [
    { icon: Plus, label: "Add Task", color: "from-blue-500 to-cyan-500" },
    { icon: Calendar, label: "Schedule", color: "from-green-500 to-emerald-500" },
    { icon: Mic, label: "Voice Task", color: "from-purple-500 to-violet-500" },
    { icon: Camera, label: "Screenshot", color: "from-orange-500 to-red-500" },
    { icon: Timer, label: "Pomodoro", color: "from-pink-500 to-rose-500" },
    { icon: Zap, label: "AI Suggest", color: "from-yellow-500 to-amber-500" },
  ]

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {actions.map((action, index) => (
            <Button key={index} variant="ghost" className="h-20 flex-col space-y-2 hover:bg-slate-700/50 group">
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-slate-300 group-hover:text-white">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
