"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Calendar, CheckSquare, Eye, EyeOff, Pencil, X } from "lucide-react"
import { useScheduleStore } from "@/lib/store"

type EditingTask = {
  scheduleId: string
  taskId: string
  text: string
} | null

export function TasksView() {
  const { scheduleItems, addTask, toggleTask, deleteTask, updateTask } = useScheduleStore()
  const [newTaskText, setNewTaskText] = useState("")
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("")
  const [showCompleted, setShowCompleted] = useState(false)
  const [removingTaskId, setRemovingTaskId] = useState<string | null>(null)

  // Edit modal state
  const [editingTask, setEditingTask] = useState<EditingTask>(null)
  const [editText, setEditText] = useState("")

  // Flattened tasks
  const allTasks = scheduleItems.flatMap((item) =>
    (item.tasks || []).map((task) => ({
      ...task,
      scheduleTitle: item.title,
      scheduleId: item.id,
    })),
  )

  const completedCount = allTasks.filter((t) => t.completed).length
  const totalCount = allTasks.length

  // If completed tasks become zero, reset showCompleted to false
  useEffect(() => {
    if (completedCount === 0 && showCompleted) {
      setShowCompleted(false)
    }
  }, [completedCount, showCompleted])

  // Handle add task: ensure view is on incomplete tasks so new task is visible
  const handleAddTask = () => {
    if (newTaskText.trim() && selectedScheduleId) {
      addTask(selectedScheduleId, newTaskText.trim())
      setNewTaskText("")
      // show incomplete tasks (so newly added visible)
      setShowCompleted(false)
    }
  }

  const handleComplete = (scheduleId: string, taskId: string) => {
    // animate removal then toggle
    setRemovingTaskId(taskId)
    setTimeout(() => {
      toggleTask(scheduleId, taskId)
      setRemovingTaskId(null)
    }, 400)
  }

  // Open custom edit modal
  const openEditModal = (scheduleId: string, taskId: string, text: string) => {
    setEditingTask({ scheduleId, taskId, text })
    setEditText(text)
  }

  const closeEditModal = () => {
    setEditingTask(null)
    setEditText("")
  }

  const saveEdit = () => {
    if (!editingTask) return
    const trimmed = editText.trim()
    if (trimmed && trimmed !== editingTask.text) {
      updateTask(editingTask.scheduleId, editingTask.taskId, trimmed)
    }
    closeEditModal()
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold">Tasks</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {completedCount} of {totalCount} completed
            </p>
          </div>
          <div className="flex items-center gap-2">
            {totalCount > 0 && (
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {Math.round((completedCount / totalCount) * 100)}% Complete
              </Badge>
            )}

            {/* View Completed button: always visible, but disabled when no completed tasks */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompleted((s) => !s)}
              className="text-xs sm:text-sm"
              disabled={completedCount === 0}
            >
              {showCompleted ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" /> Hide Completed
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" /> View Completed
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Add Task */}
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

        {/* Task List */}
        <div className="space-y-3 sm:space-y-4">
          {scheduleItems.map((item) => {
            const tasks = item.tasks || []
            if (tasks.length === 0) return null

            const visibleTasks = tasks.filter((t) => (showCompleted ? t.completed : !t.completed))
            if (visibleTasks.length === 0) return null

            return (
              <Card key={item.id} className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{item.title}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{item.timeRange}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    {tasks.filter((t) => t.completed).length}/{tasks.length}
                  </Badge>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <AnimatePresence>
                    {visibleTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.35 }}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors group ${
                          showCompleted ? "bg-secondary/30" : "hover:bg-secondary/50"
                        }`}
                      >
                        {!showCompleted && (
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleComplete(item.id, task.id)}
                            className="flex-shrink-0"
                          />
                        )}

                        <span
                          className={`flex-1 text-xs sm:text-sm min-w-0 ${
                            task.completed ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {task.text}
                        </span>

                        {/* Edit (only for incomplete view) */}
                        {!showCompleted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(item.id, task.id, task.text)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0 opacity-100"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {/* Delete button (always shown) */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTask(item.id, task.id)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0 opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
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

      {/* Edit Modal (custom) */}
      <AnimatePresence>
        {editingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
            />

            {/* modal box */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 w-[min(520px,95%)] bg-background rounded-2xl shadow-lg p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm sm:text-base font-semibold">Edit Task</h3>
                <Button variant="ghost" size="sm" onClick={closeEditModal} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit()
                  }}
                  className="text-sm"
                />

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={closeEditModal}>
                    Cancel
                  </Button>
                  <Button onClick={saveEdit} disabled={!editText.trim()}>
                    Save
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
