"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Calendar, CheckSquare } from "lucide-react"
import { useScheduleStore } from "@/lib/store"

export function TasksView() {
  const { scheduleItems, addTask, toggleTask, deleteTask } = useScheduleStore()
  const [newTaskText, setNewTaskText] = useState("")
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("")

  const handleAddTask = () => {
    if (newTaskText.trim() && selectedScheduleId) {
      addTask(selectedScheduleId, newTaskText.trim())
      setNewTaskText("")
    }
  }

  const allTasks = scheduleItems.flatMap((item) =>
    (item.tasks || []).map((task) => ({
      ...task,
      scheduleTitle: item.title,
      scheduleId: item.id,
    })),
  )

  const completedCount = allTasks.filter((t) => t.completed).length
  const totalCount = allTasks.length

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold">Tasks</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        {totalCount > 0 && (
          <Badge variant="secondary" className="text-xs sm:text-sm self-start sm:self-auto">
            {Math.round((completedCount / totalCount) * 100)}% Complete
          </Badge>
        )}
      </div>

      <Card className="p-4 sm:p-6">
        <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Add New Task</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <select
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            className="px-3 py-2 rounded-md border border-input bg-background text-xs sm:text-sm h-10 sm:w-48"
          >
            <option value="">Select activity...</option>
            {scheduleItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.timeRange})
              </option>
            ))}
          </select>
          <div className="flex gap-2 flex-1">
            <Input
              placeholder="Task description..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="flex-1 text-xs sm:text-sm h-10"
            />
            <Button
              onClick={handleAddTask}
              disabled={!newTaskText.trim() || !selectedScheduleId}
              className="h-10 px-3 sm:px-4"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-3 sm:space-y-4">
        {scheduleItems.map((item) => {
          const tasks = item.tasks || []
          if (tasks.length === 0) return null

          return (
            <Card key={item.id} className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{item.title}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{item.timeRange}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                  {tasks.filter((t) => t.completed).length}/{tasks.length}
                </Badge>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(item.id, task.id)}
                      className="flex-shrink-0"
                    />
                    <span
                      className={`flex-1 text-xs sm:text-sm min-w-0 ${task.completed ? "line-through text-muted-foreground" : ""}`}
                    >
                      {task.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(item.id, task.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      {allTasks.length === 0 && (
        <Card className="p-8 sm:p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <CheckSquare className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">No tasks yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Add tasks to your scheduled activities to track your progress
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
