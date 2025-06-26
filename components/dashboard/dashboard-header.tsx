"use client"

import { Bell, Search, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">J</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Jipange
          </h1>
        </div>
        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
          AI Powered
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search tasks, projects..."
            className="pl-10 w-64 bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-400"
          />
        </div>

        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-700/50">
          <Bell className="w-5 h-5" />
        </Button>

        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-700/50">
          <Settings className="w-5 h-5" />
        </Button>

        <Avatar className="w-8 h-8">
          <AvatarImage src="/placeholder.svg?height=32&width=32" />
          <AvatarFallback className="bg-purple-500 text-white">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
