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

  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  // ---------- Smooth Scroll Logic ----------
  const useSmoothScroll = (
    onScrollUp: () => void,
    onScrollDown: () => void
  ) => {
    const touchStartY = useRef(0)

    const handleDelta = (delta: number) => {
      const absDelta = Math.abs(delta)
      const steps = absDelta < 20 ? 1 : absDelta < 50 ? 2 : absDelta < 100 ? 3 : 4
      if (delta > 0) {
        for (let i = 0; i < steps; i++) onScrollDown()
      } else {
        for (let i = 0; i < steps; i++) onScrollUp()
      }
    }

    return {
      onWheel: (e: React.WheelEvent) => {
        handleDelta(e.deltaY)
      },
      onTouchStart: (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY
      },
      onTouchMove: (e: React.TouchEvent) => {
        const delta = touchStartY.current - e.touches[0].clientY
        handleDelta(delta)
        touchStartY.current = e.touches[0].clientY
      },
    }
  }

  return (
    <div className="space-y-3 text-center select-none">
      {/* Label */}
      <label className="text-sm font-semibold flex items-center justify-center gap-2 text-foreground">
        <Clock className="w-4 h-4" />
        <span className="text-lg">{label}</span>
      </label>

      <div className="flex items-center justify-center gap-6 sm:gap-8">
        {/* Hour */}
        <div
          className="flex flex-col items-center w-16 cursor-pointer"
          {...useSmoothScroll(
            () => handleHourChange(hour === 12 ? 1 : hour + 1),
            () => handleHourChange(hour === 1 ? 12 : hour - 1)
          )}
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
          {...useSmoothScroll(
            () => handleMinuteChange((minute + 1) % 60),
            () => handleMinuteChange((minute - 1 + 60) % 60)
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
          {...useSmoothScroll(
            () => handlePeriodChange(period === "AM" ? "PM" : "AM"),
            () => handlePeriodChange(period === "AM" ? "PM" : "AM")
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

      {/* Controls */}
      <div className="flex justify-center gap-6 mt-4">
        <button
          type="button"
          onClick={() => handleHourChange(hour === 12 ? 1 : hour + 1)}
          className="px-3 py-1 rounded-md border text-foreground hover:bg-muted"
        >
          Hour +
        </button>
        <button
          type="button"
          onClick={() => handleMinuteChange((minute + 1) % 60)}
          className="px-3 py-1 rounded-md border text-foreground hover:bg-muted"
        >
          Min +
        </button>
        <button
          type="button"
          onClick={() => handlePeriodChange(period === "AM" ? "PM" : "AM")}
          className="px-3 py-1 rounded-md border text-foreground hover:bg-muted"
        >
          Switch
        </button>
      </div>
    </div>
  )
}
