import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

export type ActivityCategory = "work" | "study" | "rest" | "exercise" | "personal" | "social"

export interface ScheduleItem {
  id: string
  title: string
  description: string
  timeRange: string
  startHour: number
  endHour: number
  icon: "bed" | "book-open" | "coffee" | "brain-circuit"
  tasks?: Task[]
  category?: ActivityCategory
  notes?: string
  color?: string
}

export interface ActivityHistory {
  date: string
  completedTasks: number
  totalTasks: number
  focusedMinutes: number
}

interface ScheduleStore {
  scheduleItems: ScheduleItem[]
  activityHistory: ActivityHistory[]
  currentStreak: number
  addScheduleItem: (item: Omit<ScheduleItem, "id" | "tasks">) => void
  updateScheduleItem: (id: string, item: Partial<ScheduleItem>) => void
  deleteScheduleItem: (id: string) => void
  addTask: (scheduleId: string, text: string) => void
  toggleTask: (scheduleId: string, taskId: string) => void
  deleteTask: (scheduleId: string, taskId: string) => void
  updateTask: (scheduleId: string, taskId: string, newText: string) => void   //  new added
  updateNotes: (scheduleId: string, notes: string) => void
  importSchedule: (items: ScheduleItem[]) => void
  clearAllData: () => void
  resetToDefault: () => void
  getStats: () => any
  updateDailyHistory: () => void
}

const defaultSchedule: ScheduleItem[] = [
  {
  id: "1",
  title: "Sleep",
  description: "Deep rest for recovery",
  timeRange: "11:00 PM - 07:00 AM",
  startHour: 23,
  endHour: 7,
  icon: "bed",
  tasks: [],
  category: "rest",
  notes: "",
},
{
  id: "2",
  title: "Morning Work",
  description: "Start tasks with focus",
  timeRange: "08:00 AM - 10:00 AM",
  startHour: 8,
  endHour: 10,
  icon: "brain-circuit",
  tasks: [],
  category: "work",
  notes: "",
},
{
  id: "3",
  title: "Study Session",
  description: "Learn and review topics",
  timeRange: "10:30 AM - 01:30 PM",
  startHour: 10.5,
  endHour: 13.5,
  icon: "book-open",
  tasks: [],
  category: "study",
  notes: "",
},
{
  id: "4",
  title: "Exercise Hour",
  description: "Move and stay healthy",
  timeRange: "02:00 PM - 03:00 PM",
  startHour: 14,
  endHour: 15,
  icon: "brain-circuit",
  tasks: [],
  category: "exercise",
  notes: "",
},
{
  id: "5",
  title: "Personal Growth",
  description: "Focus on self improvement",
  timeRange: "04:00 PM - 06:00 PM",
  startHour: 16,
  endHour: 18,
  icon: "book-open",
  tasks: [],
  category: "personal",
  notes: "",
},
{
  id: "6",
  title: "Social Time",
  description: "Connect and relax together",
  timeRange: "07:00 PM - 10:00 PM",
  startHour: 19,
  endHour: 22,
  icon: "coffee",
  tasks: [],
  category: "social",
  notes: "",
},

]

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      scheduleItems: defaultSchedule,
      activityHistory: [],
      currentStreak: 0,

      addScheduleItem: (item) => {
        const newItem: ScheduleItem = {
          ...item,
          id: Date.now().toString(),
          tasks: [],
        }
        set((state) => ({
          scheduleItems: [...state.scheduleItems, newItem],
        }))
      },

      updateScheduleItem: (id, updates) => {
        set((state) => ({
          scheduleItems: state.scheduleItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }))
      },

      deleteScheduleItem: (id) => {
        set((state) => ({
          scheduleItems: state.scheduleItems.filter((item) => item.id !== id),
        }))
      },

      addTask: (scheduleId, text) => {
        const newTask: Task = {
          id: Date.now().toString(),
          text,
          completed: false,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          scheduleItems: state.scheduleItems.map((item) =>
            item.id === scheduleId
              ? { ...item, tasks: [...(item.tasks || []), newTask] }
              : item
          ),
        }))
      },

      toggleTask: (scheduleId, taskId) => {
        set((state) => ({
          scheduleItems: state.scheduleItems.map((item) =>
            item.id === scheduleId
              ? {
                  ...item,
                  tasks: (item.tasks || []).map((task) =>
                    task.id === taskId
                      ? { ...task, completed: !task.completed }
                      : task
                  ),
                }
              : item
          ),
        }))
      },

      deleteTask: (scheduleId, taskId) => {
        set((state) => ({
          scheduleItems: state.scheduleItems.map((item) =>
            item.id === scheduleId
              ? {
                  ...item,
                  tasks: (item.tasks || []).filter(
                    (task) => task.id !== taskId
                  ),
                }
              : item
          ),
        }))
      },

      //  NEW — for editing a task text
      updateTask: (scheduleId, taskId, newText) => {
        set((state) => ({
          scheduleItems: state.scheduleItems.map((item) =>
            item.id === scheduleId
              ? {
                  ...item,
                  tasks: (item.tasks || []).map((task) =>
                    task.id === taskId ? { ...task, text: newText } : task
                  ),
                }
              : item
          ),
        }))
      },

      updateNotes: (scheduleId, notes) => {
        set((state) => ({
          scheduleItems: state.scheduleItems.map((item) =>
            item.id === scheduleId ? { ...item, notes } : item
          ),
        }))
      },

      importSchedule: (items) => {
        set({ scheduleItems: items })
      },

      clearAllData: () => {
        set({ scheduleItems: [], activityHistory: [], currentStreak: 0 })
      },

      resetToDefault: () => {
        set({ scheduleItems: defaultSchedule })
      },

      getStats: () => {
        const items = get().scheduleItems
        return {
          totalItems: items.length,
          totalTasks: items.reduce(
            (acc, item) => acc + (item.tasks?.length || 0),
            0
          ),
          completedTasks: items.reduce(
            (acc, item) =>
              acc + (item.tasks?.filter((t) => t.completed).length || 0),
            0
          ),
        }
      },

      updateDailyHistory: () => {
        const today = new Date().toISOString().split("T")[0]
        const stats = get().getStats()
        const history = get().activityHistory

        const existingIndex = history.findIndex((h) => h.date === today)
        const newEntry: ActivityHistory = {
          date: today,
          completedTasks: stats.completedTasks,
          totalTasks: stats.totalTasks,
          focusedMinutes: 0,
        }

        if (existingIndex >= 0) {
          const newHistory = [...history]
          newHistory[existingIndex] = newEntry
          set({ activityHistory: newHistory })
        } else {
          set({ activityHistory: [...history, newEntry] })
        }
      },
    }),
    {
      name: "schedule-storage",
    }
  )
)
