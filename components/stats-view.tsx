"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useScheduleStore } from "@/lib/store"
import { Clock, CheckCircle, TrendingUp, Target } from "lucide-react"

export function StatsView() {
  const { scheduleItems, getStats } = useScheduleStore()
  const stats = getStats()

  const totalHours = scheduleItems.reduce((acc, item) => {
    const duration = item.endHour < item.startHour ? 24 - item.startHour + item.endHour : item.endHour - item.startHour
    return acc + duration
  }, 0)

  const studyHours = scheduleItems
    .filter((item) => item.title.toLowerCase().includes("study"))
    .reduce((acc, item) => {
      const duration =
        item.endHour < item.startHour ? 24 - item.startHour + item.endHour : item.endHour - item.startHour
      return acc + duration
    }, 0)

  const allTasks = scheduleItems.flatMap((item) => item.tasks || [])
  const completedTasks = allTasks.filter((t) => t.completed).length
  const completionRate = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold">Analytics</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Track your productivity and progress</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">{totalHours.toFixed(1)}h</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total Scheduled</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">{studyHours.toFixed(1)}h</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Study Time</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">
                {completedTasks}/{allTasks.length}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Tasks Done</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold">{completionRate}%</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Completion Rate</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Activity Breakdown</h3>
        <div className="space-y-3 sm:space-y-4">
          {scheduleItems.map((item) => {
            const duration =
              item.endHour < item.startHour ? 24 - item.startHour + item.endHour : item.endHour - item.startHour
            const percentage = (duration / totalHours) * 100

            return (
              <div key={item.id}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <span className="font-medium text-xs sm:text-sm truncate">{item.title}</span>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                      {item.timeRange}
                    </Badge>
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    {duration.toFixed(1)}h ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Task Statistics</h3>
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <div>
            <p className="text-2xl sm:text-3xl font-bold">{allTasks.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total Tasks</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold">{completedTasks}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Completed</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold">{allTasks.length - completedTasks}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Remaining</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
