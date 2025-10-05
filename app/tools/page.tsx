"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Clock,
  Timer,
  StepBack as Stopwatch,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  Maximize,
  Minimize,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type ToolView = "clock" | "stopwatch" | "timer"

// Define WakeLockSentinel type for better type safety
interface WakeLockSentinel extends EventTarget {
  release(): Promise<void>
  readonly released: boolean
  type: "screen"
}

export default function ToolsPage() {
  const [activeView, setActiveView] = useState<ToolView>("clock")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const workerRef = useRef<Worker | null>(null)

  // 💤 Wake Lock setup
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen")
        console.log("🔋 Wake lock active")
      } else {
        console.log("⚠️ Wake Lock API not supported")
      }
    } catch (err: any) {
      console.error(`Wake lock failed: ${err.name}, ${err.message}`)
    }
  }

  const releaseWakeLock = async () => {
    if (!wakeLockRef.current) return
    try {
      await wakeLockRef.current.release()
      wakeLockRef.current = null
      console.log("🔓 Wake lock released")
    } catch (err: any) {
      console.error(`Release wake lock failed: ${err.name}, ${err.message}`)
    }
  }

  // Effect for the live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Effect for handling fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // State for Stopwatch
  const [stopwatchTime, setStopwatchTime] = useState(0)
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false)

  // State for Timer
  const [timerHours, setTimerHours] = useState(0)
  const [timerMinutes, setTimerMinutes] = useState(5)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRemaining, setTimerRemaining] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // This is the core change: using a Web Worker for timers.
  useEffect(() => {
    // The worker code is created as a string and then a Blob URL.
    // This allows it to run in the background without being paused by the browser.
    const workerCode = `
      let stopwatchInterval = null;
      let stopwatchTime = 0;

      let timerInterval = null;
      let timerTime = 0;

      const stopwatchTick = () => {
          stopwatchTime += 10;
          self.postMessage({ type: 'stopwatch-tick', time: stopwatchTime });
      };

      const timerTick = () => {
          timerTime -= 100;
          if (timerTime <= 0) {
              timerTime = 0;
              clearInterval(timerInterval);
              timerInterval = null;
          }
          self.postMessage({ type: 'timer-tick', time: timerTime });
      };

      self.onmessage = (e) => {
          const { command, value } = e.data;

          switch (command) {
              case 'start-stopwatch':
                  if (!stopwatchInterval) {
                      stopwatchInterval = setInterval(stopwatchTick, 10);
                  }
                  break;
              case 'pause-stopwatch':
                  clearInterval(stopwatchInterval);
                  stopwatchInterval = null;
                  break;
              case 'reset-stopwatch':
                  clearInterval(stopwatchInterval);
                  stopwatchInterval = null;
                  stopwatchTime = 0;
                  self.postMessage({ type: 'stopwatch-tick', time: 0 });
                  break;

              case 'start-timer':
                  if (!timerInterval) {
                      if (value) {
                        timerTime = value;
                      }
                      if(timerTime > 0){
                         timerInterval = setInterval(timerTick, 100);
                      }
                  }
                  break;
              case 'pause-timer':
                  clearInterval(timerInterval);
                  timerInterval = null;
                  break;
              case 'reset-timer':
                  clearInterval(timerInterval);
                  timerInterval = null;
                  timerTime = 0;
                  self.postMessage({ type: 'timer-tick', time: 0 });
                  break;
          }
      };
    `
    const blob = new Blob([workerCode], { type: "application/javascript" })
    const workerUrl = URL.createObjectURL(blob)
    const worker = new Worker(workerUrl)
    workerRef.current = worker

    // Listen for messages from the worker and update the state
    worker.onmessage = (event) => {
      const { type, time } = event.data
      if (type === "stopwatch-tick") {
        setStopwatchTime(time)
      } else if (type === "timer-tick") {
        setTimerRemaining(time)
        if (time === 0) {
          setIsTimerRunning(false)
          releaseWakeLock()
          // Optionally, play a sound here
        }
      }
    }

    // Cleanup: terminate the worker when the component unmounts
    return () => {
      worker.terminate()
      URL.revokeObjectURL(workerUrl)
    }
  }, [])

  const formatStopwatchTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const milliseconds = Math.floor((ms % 1000) / 10)
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
  }

  const formatTimerTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await fullscreenRef.current?.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  // --- Handler functions now post messages to the worker ---

  const handleStopwatchToggle = () => {
    const newIsRunning = !isStopwatchRunning
    setIsStopwatchRunning(newIsRunning)
    if (newIsRunning) {
      workerRef.current?.postMessage({ command: "start-stopwatch" })
      requestWakeLock()
    } else {
      workerRef.current?.postMessage({ command: "pause-stopwatch" })
      releaseWakeLock()
    }
  }

  const handleStopwatchReset = () => {
    setIsStopwatchRunning(false)
    setStopwatchTime(0) // Immediate UI update
    workerRef.current?.postMessage({ command: "reset-stopwatch" })
    releaseWakeLock()
  }

  const handleTimerStart = () => {
    if (!isTimerRunning) {
      setIsTimerRunning(true)
      let duration = timerRemaining
      // If starting fresh, calculate total duration
      if (duration === 0) {
        duration = timerHours * 3600000 + timerMinutes * 60000 + timerSeconds * 1000
        setTimerRemaining(duration)
      }
      workerRef.current?.postMessage({ command: "start-timer", value: duration })
      requestWakeLock()
    }
  }

  const handleTimerPause = () => {
    setIsTimerRunning(false)
    workerRef.current?.postMessage({ command: "pause-timer" })
    releaseWakeLock()
  }

  const handleTimerReset = () => {
    setIsTimerRunning(false)
    setTimerRemaining(0)
    workerRef.current?.postMessage({ command: "reset-timer" })
    releaseWakeLock()
  }

  // --- UI remains the same ---
  return (
    <div className="min-h-screen bg-background">
      {!isFullscreen && (
        <>
          <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
              <div className="flex items-center justify-between h-14 sm:h-16">
                <div className="flex items-center gap-2 sm:gap-3">
                  <a href="/">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Back</span>
                    </Button>
                  </a>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-foreground rounded-lg flex items-center justify-center flex-shrink-0">
                    <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-background" />
                  </div>
                  <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Tools</h1>
                </div>

                <div className="text-right">
                  <div className="text-xs sm:text-sm font-medium">
                    {currentTime.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    {currentTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <nav className="border-b border-border bg-card/30 sticky top-14 sm:top-16 z-40">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
              <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
                <Button
                  variant={activeView === "clock" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView("clock")}
                  className="gap-1.5 sm:gap-2 flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4"
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Clock</span>
                </Button>
                <Button
                  variant={activeView === "stopwatch" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView("stopwatch")}
                  className="gap-1.5 sm:gap-2 flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4"
                >
                  <Stopwatch className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Stopwatch</span>
                </Button>
                <Button
                  variant={activeView === "timer" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView("timer")}
                  className="gap-1.5 sm:gap-2 flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4"
                >
                  <Timer className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Timer</span>
                </Button>
              </div>
            </div>
          </nav>
        </>
      )}

      <main
        ref={fullscreenRef}
        className={`${
          isFullscreen
            ? "fixed inset-0 z-[100] bg-background"
            : "max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8"
        }`}
      >
        <AnimatePresence mode="wait">
          {activeView === "clock" && (
            <motion.div
              key="clock"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center justify-center ${
                isFullscreen ? "h-screen" : "min-h-[60vh]"
              }`}
            >
              <Card
                className={`${
                  isFullscreen
                    ? "border-0 shadow-none bg-background w-full h-full flex items-center justify-center"
                    : "p-8 sm:p-12 lg:p-16"
                }`}
              >
                <div className="text-center space-y-4 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-5 h-5" />
                    ) : (
                      <Maximize className="w-5 h-5" />
                    )}
                  </Button>
                  <div
                    className={`font-bold font-mono tracking-tight ${
                      isFullscreen
                        ? "text-8xl sm:text-9xl lg:text-[12rem]"
                        : "text-6xl sm:text-7xl lg:text-8xl"
                    }`}
                  >
                    {currentTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                  <div
                    className={`text-muted-foreground ${
                      isFullscreen ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"
                    }`}
                  >
                    {currentTime.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {activeView === "stopwatch" && (
            <motion.div
              key="stopwatch"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center justify-center ${
                isFullscreen ? "h-screen" : "min-h-[60vh]"
              }`}
            >
              <Card
                className={`${
                  isFullscreen
                    ? "border-0 shadow-none bg-background w-full h-full flex items-center justify-center"
                    : "p-8 sm:p-12 lg:p-16 w-full max-w-2xl"
                }`}
              >
                <div className="text-center space-y-8 relative w-full">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-5 h-5" />
                    ) : (
                      <Maximize className="w-5 h-5" />
                    )}
                  </Button>
                  <div
                    className={`font-bold font-mono tracking-tight ${
                      isFullscreen
                        ? "text-8xl sm:text-9xl lg:text-[12rem]"
                        : "text-6xl sm:text-7xl lg:text-8xl"
                    }`}
                  >
                    {formatStopwatchTime(stopwatchTime)}
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <Button size="lg" onClick={handleStopwatchToggle} className="gap-2 px-8">
                      {isStopwatchRunning ? (
                        <>
                          <Pause className="w-5 h-5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleStopwatchReset}
                      className="gap-2 px-8 bg-transparent"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Reset
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {activeView === "timer" && (
            <motion.div
              key="timer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center justify-center ${
                isFullscreen ? "h-screen" : "min-h-[60vh]"
              }`}
            >
              <Card
                className={`${
                  isFullscreen
                    ? "border-0 shadow-none bg-background w-full h-full flex items-center justify-center"
                    : "p-8 sm:p-12 lg:p-16 w-full max-w-2xl"
                }`}
              >
                <div className="text-center space-y-8 relative w-full">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-5 h-5" />
                    ) : (
                      <Maximize className="w-5 h-5" />
                    )}
                  </Button>
                  {timerRemaining > 0 || isTimerRunning ? (
                    <div
                      className={`font-bold font-mono tracking-tight ${
                        isFullscreen
                          ? "text-8xl sm:text-9xl lg:text-[12rem]"
                          : "text-6xl sm:text-7xl lg:text-8xl"
                      }`}
                    >
                      {formatTimerTime(timerRemaining)}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div
                        className={`font-semibold text-muted-foreground ${
                          isFullscreen ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"
                        }`}
                      >
                        Set Timer
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                        <div className="space-y-2 w-full sm:w-auto">
                          <label className="text-xs sm:text-sm text-muted-foreground block">
                            Hours
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={timerHours}
                            onChange={(e) =>
                              setTimerHours(
                                Math.max(0, Math.min(23, Number.parseInt(e.target.value) || 0))
                              )
                            }
                            className={`text-center font-mono ${
                              isFullscreen
                                ? "w-full sm:w-32 text-4xl h-20"
                                : "w-full sm:w-20 text-xl sm:text-2xl h-14"
                            }`}
                          />
                        </div>
                        <div
                          className={`font-bold ${
                            isFullscreen ? "text-6xl" : "text-3xl sm:text-4xl"
                          } hidden sm:block`}
                        >
                          :
                        </div>
                        <div className="space-y-2 w-full sm:w-auto">
                          <label className="text-xs sm:text-sm text-muted-foreground block">
                            Minutes
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={timerMinutes}
                            onChange={(e) =>
                              setTimerMinutes(
                                Math.max(0, Math.min(59, Number.parseInt(e.target.value) || 0))
                              )
                            }
                            className={`text-center font-mono ${
                              isFullscreen
                                ? "w-full sm:w-32 text-4xl h-20"
                                : "w-full sm:w-20 text-xl sm:text-2xl h-14"
                            }`}
                          />
                        </div>
                        <div
                          className={`font-bold ${
                            isFullscreen ? "text-6xl" : "text-3xl sm:text-4xl"
                          } hidden sm:block`}
                        >
                          :
                        </div>
                        <div className="space-y-2 w-full sm:w-auto">
                          <label className="text-xs sm:text-sm text-muted-foreground block">
                            Seconds
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={timerSeconds}
                            onChange={(e) =>
                              setTimerSeconds(
                                Math.max(0, Math.min(59, Number.parseInt(e.target.value) || 0))
                              )
                            }
                            className={`text-center font-mono ${
                              isFullscreen
                                ? "w-full sm:w-32 text-4xl h-20"
                                : "w-full sm:w-20 text-xl sm:text-2xl h-14"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-4">
                    {timerRemaining === 0 && !isTimerRunning ? (
                      <Button
                        size="lg"
                        onClick={handleTimerStart}
                        disabled={timerHours === 0 && timerMinutes === 0 && timerSeconds === 0}
                        className="gap-2 px-8"
                      >
                        <Play className="w-5 h-5" />
                        Start
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="lg"
                          onClick={isTimerRunning ? handleTimerPause : handleTimerStart}
                          className="gap-2 px-8"
                        >
                          {isTimerRunning ? (
                            <>
                              <Pause className="w-5 h-5" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5" />
                              Resume
                            </>
                          )}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={handleTimerReset}
                          className="gap-2 px-8 bg-transparent"
                        >
                          <RotateCcw className="w-5 h-5" />
                          Reset
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

