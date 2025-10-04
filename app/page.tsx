"use client"

import { useState, useEffect } from "react"
import { ScheduleView } from "@/components/schedule-view"
import { StatsView } from "@/components/stats-view"
import { TasksView } from "@/components/tasks-view"
import { SettingsView } from "@/components/settings-view"
import { DayTimelineView } from "@/components/day-timeline-view"
import { Button } from "@/components/ui/button"
import { Calendar, BarChart3, CheckSquare, Settings, Clock, Timer } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const [activeView, setActiveView] = useState<"schedule" | "stats" | "tasks" | "settings">("schedule")
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-foreground rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-background" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Schedule</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right">
                <div className="text-xs sm:text-sm font-medium">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-card/30 sticky top-14 sm:top-16 z-40 hidden md:block">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
            <Button
              variant={activeView === "schedule" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("schedule")}
              className="gap-1.5 sm:gap-2 flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4"
            >
              <Calendar className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Schedule</span>
            </Button>
            <Button
              variant={activeView === "tasks" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("tasks")}
              className="gap-1.5 sm:gap-2 flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4"
            >
              <CheckSquare className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Tasks</span>
            </Button>
            <Button
              variant={activeView === "stats" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("stats")}
              className="gap-1.5 sm:gap-2 flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Analytics</span>
            </Button>
            <Link href="/tools">
              <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4">
                <Timer className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Tools</span>
              </Button>
            </Link>
            <Button
              variant={activeView === "settings" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("settings")}
              className="gap-1.5 sm:gap-2 flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4"
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Settings</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {activeView === "schedule" && (
          <div className="space-y-4 sm:space-y-6">
            <ScheduleView />
            <DayTimelineView />
          </div>
        )}
        {activeView === "tasks" && <TasksView />}
        {activeView === "stats" && <StatsView />}
        {activeView === "settings" && <SettingsView />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur-lg shadow-lg">
        <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
          <button
            onClick={() => setActiveView("schedule")}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${
              activeView === "schedule"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium">Schedule</span>
          </button>

          <button
            onClick={() => setActiveView("tasks")}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${
              activeView === "tasks"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium">Tasks</span>
          </button>

          <button
            onClick={() => setActiveView("stats")}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${
              activeView === "stats"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-medium">Analytics</span>
          </button>

          <Link href="/tools">
            <button className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all text-muted-foreground hover:text-foreground hover:bg-accent">
              <Timer className="w-5 h-5" />
              <span className="text-[10px] font-medium">Tools</span>
            </button>
          </Link>

          <button
            onClick={() => setActiveView("settings")}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${
              activeView === "settings"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
