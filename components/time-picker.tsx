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

  const handleHourChange = (delta: number) => {
    let newHour = hour + delta
    if (newHour > 12) newHour = newHour - 12
    if (newHour < 1) newHour = 12 + newHour
    setHour(newHour)
    updateTime(newHour, minute, period)
  }

  const handleMinuteChange = (delta: number) => {
    let newMinute = minute + delta
    if (newMinute >= 60) {
      handleHourChange(1)
      newMinute = newMinute % 60
    } else if (newMinute < 0) {
      handleHourChange(-1)
      newMinute = 60 + newMinute
    }
    setMinute(newMinute)
    updateTime(hour, newMinute, period)
  }

  const handlePeriodChange = () => {
    const newPeriod = period === "AM" ? "PM" : "AM"
    setPeriod(newPeriod)
    updateTime(hour, minute, newPeriod)
  }

  // Smooth scroll logic
  const useSmoothScroll = () => {
    const touchStartY = useRef(0)
    const touchStartTime = useRef(0)

    const getDeltaValue = (delta: number, duration: number) => {
      // Fast swipe = bigger delta, slow swipe = 1 increment
      const speed = Math.abs(delta) / duration
      if (speed > 0.5) return Math.min(Math.round(speed * 20), 20) // max 20
      return 1
    }

    return {
      onWheel: (e: React.WheelEvent, type: "hour" | "minute") => {
        const delta = e.deltaY
        if (type === "hour") handleHourChange(delta > 0 ? -1 : 1)
        else handleMinuteChange(delta > 0 ? -1 : 1)
      },
      onTouchStart: (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY
        touchStartTime.current = Date.now()
      },
      onTouchEnd: (e: React.TouchEvent, type: "hour" | "minute") => {
        const deltaY = touchStartY.current - e.changedTouches[0].clientY
        const duration = (Date.now() - touchStartTime.current) / 1000 // seconds
        const deltaValue = getDeltaValue(deltaY, duration)
        if (type === "hour") handleHourChange(deltaY > 0 ? deltaValue : -deltaValue)
        else handleMinuteChange(deltaY > 0 ? deltaValue : -deltaValue)
      },
    }
  }

  const scrollHandlers = useSmoothScroll()

  return (
    <div className="space-y-3 text-center select-none">
      {/* Label with better heading */}
      <h3 className="flex items-center justify-center gap-2 text-lg font-semibold text-foreground">
        <Clock className="w-5 h-5" />
        {label}
      </h3>

      <div className="flex items-center justify-center gap-6 sm:gap-8">
        {/* Hour */}
        <div
          className="flex flex-col items-center w-16 cursor-pointer"
          onWheel={(e) => scrollHandlers.onWheel(e, "hour")}
          onTouchStart={scrollHandlers.onTouchStart}
          onTouchEnd={(e) => scrollHandlers.onTouchEnd(e, "hour")}
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
          onWheel={(e) => scrollHandlers.onWheel(e, "minute")}
          onTouchStart={scrollHandlers.onTouchStart}
          onTouchEnd={(e) => scrollHandlers.onTouchEnd(e, "minute")}
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
          onClick={handlePeriodChange}
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
