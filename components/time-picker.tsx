"use client"

import { useState, useEffect, useRef } from "react"
import { Clock } from "lucide-react"
import { motion } from "framer-motion"

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

    if (h === 0) setHour(12)
    else if (h > 12) setHour(h - 12)
    else setHour(h)
  }, [value])

  const updateTime = (newHour: number, newMinute: number, newPeriod: "AM" | "PM") => {
    let finalHour = newHour
    if (newPeriod === "PM" && newHour !== 12) finalHour = newHour + 12
    else if (newPeriod === "AM" && newHour === 12) finalHour = 0

    onChange(finalHour + newMinute / 60)
  }

  const handleHourChange = (newHour: number) => {
    if (newHour < 1) newHour = 12
    if (newHour > 12) newHour = 1
    setHour(newHour)
    updateTime(newHour, minute, period)
  }

  const handleMinuteChange = (newMinute: number) => {
    if (newMinute < 0) newMinute = 59
    if (newMinute > 59) newMinute = 0
    setMinute(newMinute)
    updateTime(hour, newMinute, period)
  }

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    setPeriod(newPeriod)
    updateTime(hour, minute, newPeriod)
  }

  // ----------- Smooth Spinner Scroll Logic -----------
  const useSmoothScroll = (
    onStep: (steps: number) => void
  ) => {
    const touchStartY = useRef(0)
    const wheelTimeout = useRef<NodeJS.Timeout | null>(null)

    return {
      onWheel: (e: React.WheelEvent) => {
        const stepSize = 30 // px per step
        const steps = Math.round(e.deltaY / stepSize)
        if (steps !== 0) {
          onStep(steps)
        }

        // prevent continuous firing too fast
        if (wheelTimeout.current) clearTimeout(wheelTimeout.current)
        wheelTimeout.current = setTimeout(() => {}, 100)
      },
      onTouchStart: (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY
      },
      onTouchEnd: (e: React.TouchEvent) => {
        const delta = touchStartY.current - e.changedTouches[0].clientY
        const stepSize = 25 // smaller step for mobile touch
        const steps = Math.round(delta / stepSize)
        if (steps !== 0) {
          onStep(steps)
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

      <div className="flex items-center justify-center gap-6 sm:gap-8">
        {/* Hour */}
        <div
          className="flex flex-col items-center w-16 cursor-pointer"
          {...useSmoothScroll((steps) => handleHourChange(hour + steps))}
        >
          <span className="text-xl sm:text-2xl text-muted-foreground/50">
            {hour === 1 ? 12 : String(hour - 1).padStart(2, "0")}
          </span>
          <motion.span
            key={hour}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="text-4xl sm:text-5xl font-bold text-foreground"
          >
            {String(hour).padStart(2, "0")}
          </motion.span>
          <span className="text-xl sm:text-2xl text-muted-foreground/50">
            {hour === 12 ? 1 : String(hour + 1).padStart(2, "0")}
          </span>
        </div>

        <span className="text-4xl sm:text-5xl font-bold text-foreground">:</span>

        {/* Minute */}
        <div
          className="flex flex-col items-center w-16 cursor-pointer"
          {...useSmoothScroll((steps) =>
            handleMinuteChange((minute + steps + 60) % 60)
          )}
        >
          <span className="text-xl sm:text-2xl text-muted-foreground/50">
            {String((minute - 1 + 60) % 60).padStart(2, "0")}
          </span>
          <motion.span
            key={minute}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="text-4xl sm:text-5xl font-bold text-foreground"
          >
            {String(minute).padStart(2, "0")}
          </motion.span>
          <span className="text-xl sm:text-2xl text-muted-foreground/50">
            {String((minute + 1) % 60).padStart(2, "0")}
          </span>
        </div>

        {/* Period */}
        <div
          className="flex flex-col items-center w-16 cursor-pointer"
          {...useSmoothScroll(() =>
            handlePeriodChange(period === "AM" ? "PM" : "AM")
          )}
        >
          <span className="text-xl sm:text-2xl text-muted-foreground/50">
            {period === "AM" ? "PM" : "AM"}
          </span>
          <motion.span
            key={period}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="text-4xl sm:text-5xl font-bold text-foreground"
          >
            {period}
          </motion.span>
          <span className="text-xl sm:text-2xl text-muted-foreground/50">
            {period === "AM" ? "PM" : "AM"}
          </span>
        </div>
      </div>
    </div>
  )
}
