"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function useInstallState() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [showApkDownload, setShowApkDownload] = useState(false)

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    const isInstalled = localStorage.getItem("pwa-installed") === "true"

    if (isStandalone || isInstalled) {
      setIsInstallable(false)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setIsInstallable(true)
    }

    const installedHandler = () => {
      localStorage.setItem("pwa-installed", "true")
      setIsInstallable(false)
    }

    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", installedHandler)

    const userAgent = navigator.userAgent.toLowerCase()
    const isAndroid = userAgent.includes("android")
    setShowApkDownload(isAndroid)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", installedHandler)
    }
  }, [])

  return { isInstallable, showApkDownload }
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const { isInstallable, showApkDownload } = useInstallState()

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const installedHandler = () => {
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", installedHandler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", installedHandler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      localStorage.setItem("pwa-installed", "true")
    }

    setDeferredPrompt(null)
  }

  const handleApkDownload = () => {
    const apkUrl = "/downloads/schedule.apk"
    const link = document.createElement("a")
    link.href = apkUrl
    link.download = "schedule.apk"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isInstallable && !showApkDownload) return null

  return (
    <div className="space-y-3">
      {isInstallable && (
        <Button
          onClick={handleInstallClick}
          className="px-5 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition gap-2 w-full sm:w-auto"
        >
          <Download className="w-4 h-4" />
          Install App
        </Button>
      )}
      {showApkDownload && (
        <Button
          onClick={handleApkDownload}
          variant="outline"
          className="px-5 py-3 rounded-lg shadow-sm gap-2 w-full sm:w-auto bg-transparent"
        >
          <Smartphone className="w-4 h-4" />
          Download APK
        </Button>
      )}
    </div>
  )
}
