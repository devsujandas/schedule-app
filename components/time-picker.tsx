"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: number // hour in decimal format (e.g., 9.5 for 9:30)
  onChange: (value: number) => void
  label: string
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [hour, setHour] = useState(12)
  const [minute, setMinute] = useState(0)
  const [period, setPeriod] = useState<"AM" | "PM">("AM")

  useEffect(() => {
    const h = Math.floor(value)
    const m = Math.round((value % 1) * 60)

    setMinute(m)
    setPeriod(h >= 12 ? "PM" : "AM")

    if (h === 0) {
      setHour(12)
    } else if (h > 12) {
      setHour(h - 12)
    } else {
      setHour(h)
    }
  }, [value])

  const updateTime = (newHour: number, newMinute: number, newPeriod: "AM" | "PM") => {
    let finalHour = newHour
    if (newPeriod === "PM" && newHour !== 12) finalHour = newHour + 12
    else if (newPeriod === "AM" && newHour === 12) finalHour = 0

    onChange(finalHour + newMinute / 60)
  }

  const handleHourChange = (newHour: number) => {
    setHour(newHour)
    updateTime(newHour, minute, period)
  }

  const handleMinuteChange = (newMinute: number) => {
    setMinute(newMinute)
    updateTime(hour, newMinute, period)
  }

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    setPeriod(newPeriod)
    updateTime(hour, minute, newPeriod)
  }

  const getPrev = (arr: number[], current: number) => {
    const idx = arr.indexOf(current)
    return idx > 0 ? arr[idx - 1] : arr[arr.length - 1]
  }

  const getNext = (arr: number[], current: number) => {
    const idx = arr.indexOf(current)
    return idx < arr.length - 1 ? arr[idx + 1] : arr[0]
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  // --- Touch handlers (scroll/swipe up/down) ---
  const useSwipe = (onSwipeUp: () => void, onSwipeDown: () => void) => {
    let touchStartY = 0
    return {
      onTouchStart: (e: React.TouchEvent) => {
        touchStartY = e.touches[0].clientY
      },
      onTouchEnd: (e: React.TouchEvent) => {
        const touchEndY = e.changedTouches[0].clientY
        if (touchStartY - touchEndY > 30) {
          onSwipeUp()
        } else if (touchEndY - touchStartY > 30) {
          onSwipeDown()
        }
      },
    }
  }

  return (
    <div className="space-y-3 text-center select-none">
      {/* Label */}
      <label className="text-sm font-semibold flex items-center justify-center gap-2 text-foreground">
        <Clock className="w-4 h-4" />
        {label}
      </label>

      {/* Picker */}
      <div className="flex items-center justify-center gap-6 sm:gap-8">
        {/* Hour */}
        <div
          className="flex flex-col items-center w-16"
          {...useSwipe(
            () => handleHourChange(getNext(hours, hour)),
            () => handleHourChange(getPrev(hours, hour))
          )}
        >
          <span className="text-xl sm:text-2xl text-muted-foreground/50">
            {String(getPrev(hours, hour)).padStart(2, "0")}
          </span>
          <motion.span
            key={hour}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-4xl sm:text-5xl font-bold text-foreground"
          >
            {String(hour).padStart(2, "0")}
          </motion.span>
          <span className="text-xl sm:text-2xl text-muted-foreground/50">
            {String(getNext(hours, hour)).padStart(2, "0")}
          </span>
        </div>

        <span className="text-4xl sm:text-5xl font-bold text-foreground">:</span>

        {/* Minute */}
        <div
          className="flex flex-col items-center w-16"
          {...useSwipe(
            () => handleMinuteChange(getNext(minutes, minute)),
            () => handleMinuteChange(getPrev(minutes, minute))
          )}
        >
          <span className="text-xl sm:text-2xl text-muted-foreground/50">
            {String(getPrev(minutes, minute)).padStart(2, "0")}
          </span>
          <motion.span
            key={minute}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-4xl sm:text-5xl font-bold text-foreground"
          >
            {String(minute).padStart(2, "0")}
          </motion.span>
          <span className="text-xl sm:text-2xl text-muted-foreground/50">
            {String(getNext(minutes, minute)).padStart(2, "0")}
          </span>
        </div>

        {/* Period */}
        <div
          className="flex flex-col items-center w-16"
          {...useSwipe(
            () => handlePeriodChange(period === "AM" ? "PM" : "AM"),
            () => handlePeriodChange(period === "AM" ? "PM" : "AM")
          )}
        >
          <span className="text-xl sm:text-2xl text-muted-foreground/50">
            {period === "AM" ? "PM" : "AM"}
          </span>
          <motion.span
            key={period}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-4xl sm:text-5xl font-bold text-foreground"
          >
            {period}
          </motion.span>
          <span className="text-xl sm:text-2xl text-muted-foreground/50">
            {period === "AM" ? "PM" : "AM"}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={() => handleHourChange(getNext(hours, hour))}
          className="px-3 py-1 rounded-md border text-foreground hover:bg-muted"
        >
          Hour +
        </button>
        <button
          onClick={() => handleMinuteChange(getNext(minutes, minute))}
          className="px-3 py-1 rounded-md border text-foreground hover:bg-muted"
        >
          Min +
        </button>
        <button
          onClick={() => handlePeriodChange(period === "AM" ? "PM" : "AM")}
          className="px-3 py-1 rounded-md border text-foreground hover:bg-muted"
        >
          Switch
        </button>
      </div>
    </div>
  )
}
