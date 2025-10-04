"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
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

  const minuteScrollRef = useRef<HTMLDivElement>(null)

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

    if (newPeriod === "PM" && newHour !== 12) {
      finalHour = newHour + 12
    } else if (newPeriod === "AM" && newHour === 12) {
      finalHour = 0
    }

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

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
        <Clock className="w-4 h-4" />
        {label}
      </label>

      <Card className="p-5 bg-gradient-to-br from-card to-card/50 border-2">
        <div className="flex items-stretch gap-3">
          {/* Hour Selector */}
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-3 text-center">Hour</p>
            <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {hours.map((h) => (
                <Button
                  key={h}
                  type="button"
                  variant={hour === h ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleHourChange(h)}
                  className={cn(
                    "h-10 text-sm font-semibold transition-all duration-200",
                    hour === h
                      ? "shadow-md scale-105 bg-primary text-primary-foreground"
                      : "hover:bg-secondary hover:scale-105 hover:border-primary/50",
                  )}
                >
                  {h}
                </Button>
              ))}
            </div>
          </div>

          {/* Minute Selector */}
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-3 text-center">Minute</p>
            <div
              ref={minuteScrollRef}
              className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
            >
              {minutes.map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={minute === m ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMinuteChange(m)}
                  className={cn(
                    "h-10 text-sm font-semibold transition-all duration-200",
                    minute === m
                      ? "shadow-md scale-105 bg-primary text-primary-foreground"
                      : "hover:bg-secondary hover:scale-105 hover:border-primary/50",
                  )}
                >
                  {String(m).padStart(2, "0")}
                </Button>
              ))}
            </div>
          </div>

          {/* AM/PM Selector */}
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold text-muted-foreground mb-3 text-center">Period</p>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant={period === "AM" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange("AM")}
                className={cn(
                  "h-12 w-16 text-sm font-bold transition-all duration-200",
                  period === "AM"
                    ? "shadow-md scale-105 bg-primary text-primary-foreground"
                    : "hover:bg-secondary hover:scale-105 hover:border-primary/50",
                )}
              >
                AM
              </Button>
              <Button
                type="button"
                variant={period === "PM" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange("PM")}
                className={cn(
                  "h-12 w-16 text-sm font-bold transition-all duration-200",
                  period === "PM"
                    ? "shadow-md scale-105 bg-primary text-primary-foreground"
                    : "hover:bg-secondary hover:scale-105 hover:border-primary/50",
                )}
              >
                PM
              </Button>
            </div>
          </div>
        </div>

        {/* Selected Time Display */}
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <p className="text-2xl font-bold tracking-tight">
              {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
              <span className="text-lg ml-2 text-muted-foreground">{period}</span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
