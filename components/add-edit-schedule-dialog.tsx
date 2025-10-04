"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useScheduleStore, type ScheduleItem, type ActivityCategory } from "@/lib/store"
import { Bed, BookOpen, Coffee, Brain } from "lucide-react"
import { TimePicker } from "@/components/time-picker"

// ✅ define a union type for icon
type IconType = "book-open" | "bed" | "coffee" | "brain-circuit"

interface AddEditScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: ScheduleItem | null
}

export function AddEditScheduleDialog({ open, onOpenChange, item }: AddEditScheduleDialogProps) {
  const { addScheduleItem, updateScheduleItem } = useScheduleStore()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startHour: 9,
    endHour: 10,
    icon: "book-open" as IconType, // ✅ use union type here
    category: "work" as ActivityCategory,
  })

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.description,
        startHour: item.startHour,
        endHour: item.endHour,
        icon: item.icon as IconType, // ✅ cast item.icon properly
        category: item.category || "work",
      })
    } else {
      setFormData({
        title: "",
        description: "",
        startHour: 9,
        endHour: 10,
        icon: "book-open",
        category: "work",
      })
    }
  }, [item, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const formatTime = (hour: number) => {
      const h = Math.floor(hour)
      const m = Math.round((hour - h) * 60)
      const period = h >= 12 ? "PM" : "AM"
      const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
      return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`
    }

    const timeRange = `${formatTime(formData.startHour)} - ${formatTime(formData.endHour)}`

    if (item) {
      updateScheduleItem(item.id, { ...formData, timeRange })
    } else {
      addScheduleItem({ ...formData, timeRange })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">{item ? "Edit Activity" : "Add Activity"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="title" className="text-sm font-semibold">
              Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Study Time"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-semibold">
              Description
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deep focus learning"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="category" className="text-sm font-semibold">
              Category
            </Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ActivityCategory })}
              className="w-full px-3 py-2 rounded-md border border-input bg-background mt-1.5 font-medium"
            >
              <option value="work"> Work</option>
              <option value="study"> Study</option>
              <option value="rest"> Rest</option>
              <option value="exercise"> Exercise</option>
              <option value="personal"> Personal</option>
              <option value="social"> Social</option>
            </select>
          </div>

          <div className="space-y-4">
            <TimePicker
              value={formData.startHour}
              onChange={(value) => setFormData({ ...formData, startHour: value })}
              label="Start Time"
            />
            <TimePicker
              value={formData.endHour}
              onChange={(value) => setFormData({ ...formData, endHour: value })}
              label="End Time"
            />
          </div>

          <div>
            <Label htmlFor="icon" className="text-sm font-semibold">
              Icon
            </Label>
            <div className="grid grid-cols-4 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, icon: "book-open" })}
                className={`p-4 rounded-lg border-2 transition-all hover:border-foreground/50 ${
                  formData.icon === "book-open" ? "border-foreground bg-secondary" : "border-border"
                }`}
              >
                <BookOpen className="w-6 h-6 mx-auto" />
                <p className="text-xs mt-1">Book</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, icon: "bed" })}
                className={`p-4 rounded-lg border-2 transition-all hover:border-foreground/50 ${
                  formData.icon === "bed" ? "border-foreground bg-secondary" : "border-border"
                }`}
              >
                <Bed className="w-6 h-6 mx-auto" />
                <p className="text-xs mt-1">Sleep</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, icon: "coffee" })}
                className={`p-4 rounded-lg border-2 transition-all hover:border-foreground/50 ${
                  formData.icon === "coffee" ? "border-foreground bg-secondary" : "border-border"
                }`}
              >
                <Coffee className="w-6 h-6 mx-auto" />
                <p className="text-xs mt-1">Break</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, icon: "brain-circuit" })}
                className={`p-4 rounded-lg border-2 transition-all hover:border-foreground/50 ${
                  formData.icon === "brain-circuit" ? "border-foreground bg-secondary" : "border-border"
                }`}
              >
                <Brain className="w-6 h-6 mx-auto" />
                <p className="text-xs mt-1">Focus</p>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {item ? "Update" : "Add"} Activity
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
