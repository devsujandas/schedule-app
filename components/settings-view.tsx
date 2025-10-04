"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useScheduleStore } from "@/lib/store"
import { Download, Upload, Trash2, RotateCcw, Loader2, Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export function SettingsView() {
  const { scheduleItems, importSchedule, clearAllData, resetToDefault } = useScheduleStore()
  const { theme, setTheme } = useTheme()
  const [importError, setImportError] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  // --- APK Download Handler ---
  const handleApkDownload = () => {
    const apkUrl = "/downloads/Schedule.apk" // must be in public folder
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
    window.location.href = "/"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your schedule data and preferences</p>
      </div>

      {/* APK Download */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Download App</h3>
        <div className="space-y-4">
          <Button onClick={handleApkDownload} className="gap-2 w-full sm:w-auto">
            <Download className="w-4 h-4" />
            Download APK
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Download and install the APK version of this app
          </p>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Appearance</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Theme</p>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
                className="gap-2 flex-1"
              >
                <Sun className="w-4 h-4" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                className="gap-2 flex-1"
              >
                <Moon className="w-4 h-4" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                onClick={() => setTheme("system")}
                className="gap-2 flex-1"
              >
                <Monitor className="w-4 h-4" />
                System
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {theme === "system" ? "Following system preferences" : `Using ${theme} theme`}
            </p>
          </div>
        </div>
      </Card>

      {/* Export/Import */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Data Management</h3>
        <div className="space-y-4">
          <div>
            <Button onClick={handleExport} className="gap-2 w-full sm:w-auto" disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Schedule
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Download your schedule as a JSON file</p>
          </div>

          <div>
            <label htmlFor="import-file">
              <Button asChild className="gap-2 w-full sm:w-auto" disabled={isImporting}>
                <span>
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import Schedule
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
            <p className="text-xs text-muted-foreground mt-2">Upload a previously exported schedule file</p>
            {importError && <p className="text-xs text-red-500 mt-1">{importError}</p>}
          </div>
        </div>
      </Card>

      {/* Reset Options */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Reset Options</h3>
        <div className="space-y-4">
          <div>
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2 w-full sm:w-auto bg-transparent"
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Reset to Default Schedule
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Restore the original default schedule</p>
          </div>

          <div>
            <Button
              variant="destructive"
              onClick={handleClear}
              className="gap-2 w-full sm:w-auto"
              disabled={isClearing}
            >
              {isClearing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Delete all schedule items and tasks (cannot be undone)</p>
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">About</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Schedule App v2.3</p>
          <p>All data is stored locally in your browser</p>
          <p>Current schedule items: {scheduleItems.length}</p>
        </div>
      </Card>
    </div>
  )
}
