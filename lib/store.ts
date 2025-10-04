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
    description: "Recharge and recover",
    timeRange: "02:00 - 09:00",
    startHour: 2,
    endHour: 9,
    icon: "bed",
    tasks: [],
    category: "rest",
    notes: "",
  },
  {
    id: "2",
    title: "Study Time",
    description: "Deep focus learning",
    timeRange: "10:00 - 15:00",
    startHour: 10,
    endHour: 15,
    icon: "book-open",
    tasks: [],
    category: "study",
    notes: "",
  },
  {
    id: "3",
    title: "Study Time",
    description: "Review and practice",
    timeRange: "16:00 - 17:30",
    startHour: 16,
    endHour: 17.5,
    icon: "book-open",
    tasks: [],
    category: "study",
    notes: "",
  },
  {
    id: "4",
    title: "Relax / Nap",
    description: "A well-deserved break",
    timeRange: "17:30 - 19:30",
    startHour: 17.5,
    endHour: 19.5,
    icon: "coffee",
    tasks: [],
    category: "rest",
    notes: "",
  },
  {
    id: "5",
    title: "Study Time",
    description: "Evening study session",
    timeRange: "19:30 - 22:00",
    startHour: 19.5,
    endHour: 22,
    icon: "book-open",
    tasks: [],
    category: "study",
    notes: "",
  },
  {
    id: "6",
    title: "Study Time",
    description: "Late night grinding",
    timeRange: "23:00 - 02:00",
    startHour: 23,
    endHour: 2,
    icon: "brain-circuit",
    tasks: [],
    category: "study",
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
          scheduleItems: state.scheduleItems.map((item) => (item.id === id ? { ...item, ...updates } : item)),
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
            item.id === scheduleId ? { ...item, tasks: [...(item.tasks || []), newTask] } : item,
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
                    task.id === taskId ? { ...task, completed: !task.completed } : task,
                  ),
                }
              : item,
          ),
        }))
      },

      deleteTask: (scheduleId, taskId) => {
        set((state) => ({
          scheduleItems: state.scheduleItems.map((item) =>
            item.id === scheduleId
              ? {
                  ...item,
                  tasks: (item.tasks || []).filter((task) => task.id !== taskId),
                }
              : item,
          ),
        }))
      },

      updateNotes: (scheduleId, notes) => {
        set((state) => ({
          scheduleItems: state.scheduleItems.map((item) => (item.id === scheduleId ? { ...item, notes } : item)),
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
          totalTasks: items.reduce((acc, item) => acc + (item.tasks?.length || 0), 0),
          completedTasks: items.reduce((acc, item) => acc + (item.tasks?.filter((t) => t.completed).length || 0), 0),
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
    },
  ),
)
