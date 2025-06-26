"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, MapPin, Zap } from "lucide-react"

export function SmartCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const events = [
    {
      id: 1,
      title: "Team Standup",
      time: "09:00 - 09:30",
      type: "meeting",
      attendees: 5,
      location: "Conference Room A",
      aiSuggested: false,
    },
    {
      id: 2,
      title: "Deep Work: Landing Page Design",
      time: "10:00 - 12:00",
      type: "focus",
      attendees: 1,
      location: "Remote",
      aiSuggested: true,
    },
    {
      id: 3,
      title: "Client Presentation",
      time: "14:00 - 15:00",
      type: "meeting",
      attendees: 8,
      location: "Zoom",
      aiSuggested: false,
    },
    {
      id: 4,
      title: "Code Review Session",
      time: "15:30 - 16:30",
      type: "collaboration",
      attendees: 3,
      location: "Dev Room",
      aiSuggested: true,
    },
  ]

  const getEventColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "focus":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30"
      case "collaboration":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
    setCurrentDate(newDate)
    setSelectedDate(newDate)
  }

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Smart Calendar</span>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              AI Optimized
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate("prev")}
              className="text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate("next")}
              className="text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-slate-400">{formatDate(selectedDate)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Insights */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">AI Insights</span>
          </div>
          <p className="text-sm text-slate-300">
            {
              "You have 2 hours of deep work scheduled. Consider moving the 3 PM meeting to tomorrow for better focus flow."
            }
          </p>
        </div>

        {/* Events List */}
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-white">{event.title}</h4>
                  {event.aiSuggested && (
                    <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      AI
                    </Badge>
                  )}
                </div>
                <Badge className={getEventColor(event.type)}>{event.type}</Badge>
              </div>

              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{event.attendees}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Schedule */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            className="flex-1 bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          >
            Schedule Focus Time
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          >
            Find Meeting Slot
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
