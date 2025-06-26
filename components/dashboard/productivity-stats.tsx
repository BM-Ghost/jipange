"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, Clock, Zap, Brain, Coffee } from "lucide-react"

export function ProductivityStats() {
  const stats = [
    {
      label: "Daily Goal",
      value: 75,
      target: 100,
      icon: Target,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      label: "Focus Time",
      value: 4.2,
      target: 6,
      unit: "hrs",
      icon: Clock,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
    },
    {
      label: "Energy Level",
      value: 85,
      target: 100,
      icon: Zap,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
    },
  ]

  const moodInsights = [
    { mood: "Focused", percentage: 65, color: "bg-green-500" },
    { mood: "Productive", percentage: 80, color: "bg-blue-500" },
    { mood: "Creative", percentage: 45, color: "bg-purple-500" },
    { mood: "Energetic", percentage: 70, color: "bg-yellow-500" },
  ]

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Productivity Stats</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Metrics */}
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-3 h-3 ${stat.color}`} />
                  </div>
                  <span className="text-sm text-slate-300">{stat.label}</span>
                </div>
                <span className="text-sm font-medium text-white">
                  {stat.value}
                  {stat.unit || "%"} / {stat.target}
                  {stat.unit || "%"}
                </span>
              </div>
              <Progress value={typeof stat.value === "number" ? (stat.value / stat.target) * 100 : 0} className="h-2" />
            </div>
          ))}
        </div>

        {/* Mood Analysis */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-slate-300">Mood Analysis</span>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
              AI Detected
            </Badge>
          </div>
          <div className="space-y-2">
            {moodInsights.map((mood, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{mood.mood}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${mood.color} transition-all duration-500`}
                      style={{ width: `${mood.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-8">{mood.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Coffee className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-300">AI Recommendation</span>
          </div>
          <p className="text-xs text-slate-300">
            {
              "Your energy is high! This is perfect for tackling complex tasks. Consider scheduling your most challenging work now."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
