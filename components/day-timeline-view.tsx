"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { useScheduleStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Bed, BookOpen, Coffee, Brain, Clock, Sun, Moon, Sunrise, Sunset } from "lucide-react"

const iconMap = {
  bed: Bed,
  "book-open": BookOpen,
  coffee: Coffee,
  "brain-circuit": Brain,
}

const categoryColors = {
  work: "bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-blue-500/50 hover:from-blue-500/40 hover:to-blue-600/30",
  study:
    "bg-gradient-to-br from-violet-500/30 to-purple-600/20 border-violet-500/50 hover:from-violet-500/40 hover:to-purple-600/30",
  rest: "bg-gradient-to-br from-emerald-500/30 to-teal-600/20 border-emerald-500/50 hover:from-emerald-500/40 hover:to-teal-600/30",
  exercise:
    "bg-gradient-to-br from-orange-500/30 to-red-600/20 border-orange-500/50 hover:from-orange-500/40 hover:to-red-600/30",
  personal:
    "bg-gradient-to-br from-pink-500/30 to-rose-600/20 border-pink-500/50 hover:from-pink-500/40 hover:to-rose-600/30",
  social:
    "bg-gradient-to-br from-cyan-500/30 to-blue-600/20 border-cyan-500/50 hover:from-cyan-500/40 hover:to-blue-600/30",
}

const getTimePeriod = (hour: number) => {
  if (hour >= 5 && hour < 12) return { label: "Morning", icon: Sunrise, color: "text-amber-500" }
  if (hour >= 12 && hour < 17) return { label: "Afternoon", icon: Sun, color: "text-orange-500" }
  if (hour >= 17 && hour < 21) return { label: "Evening", icon: Sunset, color: "text-pink-500" }
  return { label: "Night", icon: Moon, color: "text-indigo-500" }
}

export function DayTimelineView() {
  const { scheduleItems } = useScheduleStore()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const getCurrentHour = () => {
    return currentTime.getHours() + currentTime.getMinutes() / 60
  }

  const currentHour = getCurrentHour()
  const currentTimePosition = (currentHour / 24) * 100
  const timePeriod = getTimePeriod(currentTime.getHours())
  const TimePeriodIcon = timePeriod.icon

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    null
  )
}
