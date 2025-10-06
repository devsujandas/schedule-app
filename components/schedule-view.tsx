"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Bed,
  BookOpen,
  Coffee,
  Brain,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  Circle,
  LayoutGrid,
  LayoutList,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Flame,
  Target,
  TrendingUp,
  Search,
} from "lucide-react"
import { useScheduleStore, type ScheduleItem, type ActivityCategory } from "@/lib/store"
import { AddEditScheduleDialog } from "@/components/add-edit-schedule-dialog"
import { cn } from "@/lib/utils"

const iconMap = {
  bed: Bed,
  "book-open": BookOpen,
  coffee: Coffee,
  "brain-circuit": Brain,
}

const categoryColors: Record<ActivityCategory, { bg: string; border: string; text: string }> = {
  work: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-600 dark:text-blue-400" },
  study: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-600 dark:text-violet-400" },
  rest: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400" },
  exercise: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-600 dark:text-orange-400" },
  personal: { bg: "bg-pink-500/10", border: "border-pink-500/20", text: "text-pink-600 dark:text-pink-400" },
  social: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-600 dark:text-cyan-400" },
}

export function ScheduleView() {
  const { scheduleItems, deleteScheduleItem, addTask, toggleTask, deleteTask, updateNotes } = useScheduleStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [focusMode, setFocusMode] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid")
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [newTaskText, setNewTaskText] = useState<{ [key: string]: string }>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<ActivityCategory | "all">("all")
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getCurrentHour = () => {
    return currentTime.getHours() + currentTime.getMinutes() / 60
  }

  const isActive = (item: ScheduleItem) => {
    const currentHour = getCurrentHour()
    const isOvernight = item.startHour > item.endHour
    return (
      (isOvernight && (currentHour >= item.startHour || currentHour < item.endHour)) ||
      (!isOvernight && currentHour >= item.startHour && currentHour < item.endHour)
    )
  }

  const getProgress = (item: ScheduleItem) => {
    if (!isActive(item)) return 0
    const currentHour = getCurrentHour()
    const duration = item.endHour < item.startHour ? 24 - item.startHour + item.endHour : item.endHour - item.startHour
    const elapsed = currentHour < item.startHour ? 24 - item.startHour + currentHour : currentHour - item.startHour
    return Math.min((elapsed / duration) * 100, 100)
  }

  const getTimeRemaining = (item: ScheduleItem) => {
    if (!isActive(item)) return ""
    const currentHour = getCurrentHour()
    const endHour = item.endHour < item.startHour ? item.endHour + 24 : item.endHour
    const effectiveCurrentHour = currentHour < item.startHour ? currentHour + 24 : currentHour
    const remaining = (endHour - effectiveCurrentHour) * 60
    const hours = Math.floor(remaining / 60)
    const minutes = Math.round(remaining % 60)
    return `${hours > 0 ? hours + "h " : ""}${minutes}m remaining`
  }

  const getDuration = (item: ScheduleItem) => {
    const duration = item.endHour < item.startHour ? 24 - item.startHour + item.endHour : item.endHour - item.startHour
    const hours = Math.floor(duration)
    const minutes = Math.round((duration - hours) * 60)
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`
  }

  const getNextItem = () => {
    const currentHour = getCurrentHour()
    const sorted = [...scheduleItems].sort((a, b) => {
      const startA = a.startHour < currentHour ? a.startHour + 24 : a.startHour
      const startB = b.startHour < currentHour ? b.startHour + 24 : b.startHour
      return startA - startB
    })
    return sorted.find((item) => !isActive(item))
  }

  const toggleCardExpansion = (id: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCards(newExpanded)
  }

  const handleAddTask = (scheduleId: string) => {
    const text = newTaskText[scheduleId]?.trim()
    if (text) {
      addTask(scheduleId, text)
      setNewTaskText({ ...newTaskText, [scheduleId]: "" })
    }
  }

  const handleSaveNotes = (scheduleId: string) => {
    const notes = notesText[scheduleId] || ""
    updateNotes(scheduleId, notes)
    setEditingNotes(null)
  }

  const filteredItems = scheduleItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === "all" || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const nextItem = getNextItem()
  const sortedItems = [...filteredItems].sort((a, b) => {
    const aIsActive = isActive(a)
    const bIsActive = isActive(b)
    const aIsNext = nextItem?.id === a.id
    const bIsNext = nextItem?.id === b.id

    // Active item comes first
    if (aIsActive && !bIsActive) return -1
    if (!aIsActive && bIsActive) return 1

    // "Up Next" item comes second
    if (aIsNext && !bIsNext) return -1
    if (!aIsNext && bIsNext) return 1

    // Fallback to sorting by start hour
    return a.startHour - b.startHour
  })


  const totalTasks = scheduleItems.reduce((acc, item) => acc + (item.tasks?.length || 0), 0)
  const completedTasks = scheduleItems.reduce(
    (acc, item) => acc + (item.tasks?.filter((t) => t.completed).length || 0),
    0,
  )
  const activeItem = scheduleItems.find(isActive)
  const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-semibold">Today's Schedule</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredItems.length} activities •{" "}
            {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as ActivityCategory | "all")}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Categories</option>
            <option value="work">Work</option>
            <option value="study">Study</option>
            <option value="rest">Rest</option>
            <option value="exercise">Exercise</option>
            <option value="personal">Personal</option>
            <option value="social">Social</option>
          </select>

          <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === "timeline" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("timeline")}
              className="gap-2"
            >
              <LayoutList className="w-4 h-4" />
              Timeline
            </Button>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Activity</span>
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-card to-card/50 border-2">
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Current Activity */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="font-medium">Current Activity</span>
              </div>
              {activeItem ? (
                <div>
                  <p className="text-lg sm:text-2xl font-bold font-serif leading-tight">{activeItem.title}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{getTimeRemaining(activeItem)}</p>
                </div>
              ) : (
                <p className="text-sm sm:text-lg text-muted-foreground">No active activity</p>
              )}
            </div>

            {/* Productivity Score */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="font-medium">Productivity</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-lg sm:text-2xl font-bold font-serif">{productivityScore}%</p>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <Progress value={productivityScore} className="h-1.5 sm:h-2" />
            </div>

            {/* Tasks Progress */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="font-medium">Tasks Today</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold font-serif">
                {completedTasks}/{totalTasks}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">{totalTasks - completedTasks} remaining</p>
            </div>

            {/* Streak */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="font-medium">Current Streak</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold font-serif">7 days</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Keep it up!</p>
            </div>
          </div>
        </div>
      </Card>

      {viewMode === "grid" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] || BookOpen
            const active = isActive(item)
            const progress = getProgress(item)
            const isNext = nextItem?.id === item.id
            const isFocused = focusMode === item.id
            const isExpanded = expandedCards.has(item.id)
            const tasks = item.tasks || []
            const completedTasks = tasks.filter((t) => t.completed).length
            const category = item.category || "work"
            const colors = categoryColors[category]

            return (
              <Card
                key={item.id}
                className={cn(
                  "transition-all duration-300 hover:shadow-lg relative overflow-hidden border-2",
                  active && "ring-2 ring-foreground shadow-xl scale-[1.02]",
                  isFocused && "ring-2 ring-foreground/50",
                  colors.border,
                )}
              >
                {active && <div className={cn("absolute top-0 left-0 right-0 h-1.5", colors.bg)} />}

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                            colors.bg,
                          )}
                        >
                          <Icon className={cn("w-6 h-6", colors.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold font-serif truncate">{item.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            <span className="font-medium">{item.timeRange}</span>
                            <span>•</span>
                            <span>{getDuration(item)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      {active && <Badge className="bg-foreground text-background text-xs font-semibold">LIVE</Badge>}
                      {isNext && !active && (
                        <Badge variant="secondary" className="text-xs font-semibold bg-sky-600">
                          UP NEXT
                        </Badge>
                      )}
                      <Badge variant="outline" className={cn("text-xs capitalize", colors.text)}>
                        {category}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {active && (
                    <div className="space-y-2 mb-4 p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-semibold">{getTimeRemaining(item)}</span>
                        <span className="font-bold text-base">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2.5" />
                    </div>
                  )}

                  {/* Tasks Summary */}
                  {tasks.length > 0 && (
                    <div className="mb-4 p-3 bg-secondary/50 rounded-lg border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2
                            className={cn(
                              "w-4 h-4",
                              completedTasks === tasks.length ? "text-green-600" : "text-muted-foreground",
                            )}
                          />
                          <span className="font-semibold">
                            {completedTasks}/{tasks.length} tasks
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCardExpansion(item.id)}
                          className="h-7 w-7 p-0"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>

                      {/* Task Progress Bar */}
                      {tasks.length > 0 && (
                        <Progress value={(completedTasks / tasks.length) * 100} className="h-1.5 mt-2" />
                      )}
                    </div>
                  )}

                  {/* Expanded Tasks */}
                  {isExpanded && (
                    <div className="space-y-3 mb-4 pb-4 border-b border-border">
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 group p-2 rounded-md hover:bg-secondary/50 transition-colors"
                          >
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => toggleTask(item.id, task.id)}
                              className="flex-shrink-0"
                            />
                            <span
                              className={cn("text-sm flex-1", task.completed && "line-through text-muted-foreground")}
                            >
                              {task.text}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTask(item.id, task.id)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* Add Task Input */}
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Add a task..."
                          value={newTaskText[item.id] || ""}
                          onChange={(e) => setNewTaskText({ ...newTaskText, [item.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleAddTask(item.id)
                            }
                          }}
                          className="h-9 text-sm"
                        />
                        <Button size="sm" onClick={() => handleAddTask(item.id)} className="h-9 px-3">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {editingNotes === item.id ? (
                    <div className="space-y-2 mb-4 pb-4 border-b border-border">
                      <Textarea
                        placeholder="Add notes for this activity..."
                        value={notesText[item.id] ?? item.notes ?? ""}
                        onChange={(e) => setNotesText({ ...notesText, [item.id]: e.target.value })}
                        className="min-h-[80px] text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveNotes(item.id)} className="flex-1">
                          Save Notes
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingNotes(null)} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : item.notes ? (
                    <div className="mb-4 p-3 bg-secondary/30 rounded-lg border border-border/50">
                      <div className="flex items-start gap-2">
                        <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground flex-1 leading-relaxed">{item.notes}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingNotes(item.id)
                            setNotesText({ ...notesText, [item.id]: item.notes || "" })
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFocusMode(isFocused ? null : item.id)}
                      className="gap-2 flex-1"
                    >
                      {isFocused ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {isFocused ? "Unfocus" : "Focus"}
                    </Button>
                    {!editingNotes && !item.notes && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingNotes(item.id)
                          setNotesText({ ...notesText, [item.id]: "" })
                        }}
                      >
                        <StickyNote className="w-3 h-3" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteScheduleItem(item.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {viewMode === "timeline" && (
  <div className="space-y-2">
    {sortedItems.map((item, index) => {
      const Icon = iconMap[item.icon as keyof typeof iconMap] || BookOpen
      const active = isActive(item)
      const progress = getProgress(item)
      const isNext = nextItem?.id === item.id
      const isFocused = focusMode === item.id
      const tasks = item.tasks || []
      const completedTasks = tasks.filter((t) => t.completed).length
      const category = item.category || "work"
      const colors = categoryColors[category]

      return (
        <Card
          key={item.id}
          className={cn(
            "transition-all duration-300 hover:shadow-md relative border-2",
            active && "ring-2 ring-foreground shadow-xl",
            isFocused && "ring-2 ring-foreground/50",
            colors.border,
          )}
        >
          {active && <div className={cn("absolute top-0 left-0 right-0 h-1.5", colors.bg)} />}

          <div className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Time Column */}
              <div className="flex-shrink-0 w-full sm:w-32 sm:text-right">
                <div className="text-lg font-bold font-mono">{item.timeRange.split(" - ")[0]}</div>
                <div className="text-xs text-muted-foreground font-medium">{getDuration(item)}</div>
              </div>

              {/* Timeline Indicator */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all",
                    active
                      ? cn("bg-foreground text-background border-foreground shadow-lg")
                      : cn("border-border", colors.bg),
                  )}
                >
                  <Icon className={cn("w-7 h-7", active ? "" : colors.text)} />
                </div>
                {index < sortedItems.length - 1 && (
                  <div className={cn("w-0.5 h-8 mt-2", active ? "bg-foreground" : "bg-border")} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-xl font-bold font-serif">{item.title}</h3>
                      {active && (
                        <Badge className="bg-foreground text-background text-xs font-semibold">LIVE</Badge>
                      )}
                      {isNext && !active && (
                        <Badge variant="secondary" className="text-xs font-semibold">
                          UP NEXT
                        </Badge>
                      )}
                      <Badge variant="outline" className={cn("text-xs capitalize", colors.text)}>
                        {category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFocusMode(isFocused ? null : item.id)}
                    >
                      {isFocused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteScheduleItem(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                {active && (
                  <div className="space-y-1 mb-3 p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-semibold">{getTimeRemaining(item)}</span>
                      <span className="font-bold text-base">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2.5" />
                  </div>
                )}

                {/* Tasks and Notes */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {tasks.length > 0 && (
                    <div className="flex items-center gap-2">
                      {completedTasks === tasks.length ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-muted-foreground font-medium">
                        {completedTasks}/{tasks.length} tasks
                      </span>
                    </div>
                  )}
                  {item.notes && (
                    <div className="flex items-center gap-2">
                      <StickyNote className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground font-medium">Has notes</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )
    })}
  </div>
)}


      {/* Empty State */}
      {filteredItems.length === 0 && scheduleItems.length > 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No activities found</h3>
            <p className="text-sm text-muted-foreground mb-6">Try adjusting your search or filter criteria</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setFilterCategory("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {filteredItems.length === 0 && scheduleItems.length === 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No activities scheduled</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start by adding your first activity to organize your day
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Activity
            </Button>
          </div>
        </Card>
      )}

      {/* Dialogs */}
      <AddEditScheduleDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <AddEditScheduleDialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem}
      />
    </div>
  )
}
