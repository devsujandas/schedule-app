"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useScheduleStore } from "@/lib/store"
import {
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Loader2,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Calendar,
  Lock,
  Clock,
  AlertTriangle,
  InfoIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { InstallButton, useInstallState } from "@/components/install-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export function SettingsView() {
  const { scheduleItems, importSchedule, clearAllData, resetToDefault } = useScheduleStore()
  const { theme, setTheme } = useTheme()
  const { isInstallable, showApkDownload } = useInstallState()

  const [importError, setImportError] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // --- APK Download Handler ---
  const handleApkDownload = () => {
    const apkUrl = "/downloads/Schedule.apk"
    const link = document.createElement("a")
    link.href = apkUrl
    link.download = "Schedule.apk"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExport = async () => {
    setIsExporting(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const data = JSON.stringify({ scheduleItems }, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `schedule-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setIsExporting(false)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.scheduleItems && Array.isArray(data.scheduleItems)) {
          importSchedule(data.scheduleItems)
          setImportError("")
        } else {
          setImportError("Invalid file format")
        }
      } catch (error) {
        setImportError("Failed to parse file")
      }
      setIsImporting(false)
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleReset = async () => {
    setIsResetting(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    resetToDefault()
    setIsResetting(false)
    window.location.href = "/"
  }

  const handleClear = async () => {
    setIsClearing(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    clearAllData()
    setIsClearing(false)
    setShowConfirm(false)
    window.location.href = "/"
  }

  return (
    <>
      <div className="space-y-10">
        {/* Header */}
        <div className="pb-3 border-b border-border">
          <h2 className="text-3xl font-serif font-semibold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your schedule data and preferences
          </p>
        </div>

        {/* Install App */}
        {(isInstallable || showApkDownload) && (
          <Card className="p-6 space-y-4 lg:hidden shadow-sm border-border/70">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Install App
            </h3>
            <p className="text-sm text-muted-foreground">
              Get instant access to this app whenever you need it.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <InstallButton />
              <Button onClick={handleApkDownload} className="gap-2 flex-1 sm:flex-none">
                <Smartphone className="w-4 h-4" />
                Download APK
              </Button>
            </div>
          </Card>
        )}

        {/* Appearance */}
        <Card className="p-6 space-y-5 shadow-sm border-border/70">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4" />
            <h3 className="text-lg font-semibold">Appearance</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Theme</p>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
                className="gap-2 flex-1"
              >
                <Sun className="w-4 h-4" /> Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                className="gap-2 flex-1"
              >
                <Moon className="w-4 h-4" /> Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                onClick={() => setTheme("system")}
                className="gap-2 flex-1"
              >
                <Monitor className="w-4 h-4" /> System
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {theme === "system"
                ? "Following system preferences"
                : `Using ${theme} theme`}
            </p>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-6 space-y-5 shadow-sm border-border/70">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <h3 className="text-lg font-semibold">Data Management</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExport}
              className="gap-2 flex-1 sm:flex-none"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Export Schedule
                </>
              )}
            </Button>

            <label htmlFor="import-file" className="flex-1 sm:flex-none">
              <Button asChild className="gap-2 w-full" disabled={isImporting}>
                <span>
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Import Schedule
                    </>
                  )}
                </span>
              </Button>
            </label>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              disabled={isImporting}
            />
          </div>

          {importError && <p className="text-xs text-red-500">{importError}</p>}
          <p className="text-xs text-muted-foreground">
            Export or import your schedule as a JSON file.
          </p>
        </Card>

        {/* Reset Options */}
        <Card className="p-6 space-y-5 shadow-sm border-border/70">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            <h3 className="text-lg font-semibold">Reset Options</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2 flex-1 sm:flex-none"
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" /> Reset to Default
                </>
              )}
            </Button>

            <Button
              variant="destructive"
              onClick={() => setShowConfirm(true)}
              className="gap-2 flex-1 sm:flex-none"
              disabled={isClearing}
            >
              <Trash2 className="w-4 h-4" /> Clear All Data
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Reset or delete all data (cannot be undone).
          </p>
        </Card>

        {/* About Section */}
        <Card className="p-6 space-y-4 shadow-sm border-border/70">
          <div className="flex items-center gap-2">
            <InfoIcon className="w-4 h-4" />
            <h3 className="text-lg font-semibold">About</h3>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Your schedule — organized, private, and always ready.</p>
            
            <p>
              Schedulaar App v2.8{" "}
              <span className="inline-block bg-yellow-200 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full ml-1">
                Beta
              </span>
            </p>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="w-4 h-4" /> <span>Organized</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Lock className="w-4 h-4" /> <span>Private</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="w-4 h-4" /> <span>Instant</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ⚠️ Clear All Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Confirm Data Deletion
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              This action will permanently delete <b>all your schedules and tasks</b>. This cannot
              be undone. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClear}
              disabled={isClearing}
              className="gap-2"
            >
              {isClearing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Yes, Delete All
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
