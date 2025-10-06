"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  BellOff,
  Flag,
  Calculator,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type ToolView = "clock" | "stopwatch" | "timer"

// WakeLockSentinel type for better type safety
interface WakeLockSentinel extends EventTarget {
  release(): Promise<void>
  readonly released: boolean
  type: "screen"
}

// Custom type to include experimental screen lock features
interface ScreenOrientationWithLock extends ScreenOrientation {
  lock(orientation: "landscape"): Promise<void>;
  unlock(): void;
}


// --- New, Stylish Time Scroller Component ---
const StylishTimeScroller = ({
  value,
  onValueChange,
  unit,
  range,
} : {
  value: number;
  onValueChange: (val: number) => void;
  unit: string;
  range: number[];
}) => {
  const touchStartY = useRef(0);
  const lastScrollTime = useRef(0);

  const handleDelta = (delta: number) => {
    const now = Date.now();
    if (now - lastScrollTime.current < 50) return; // throttle
    lastScrollTime.current = now;

    const currentIndex = range.indexOf(value);
    let nextIndex;

    if (delta < 0) { // Scrolling Up
      nextIndex = (currentIndex + 1) % range.length;
    } else { // Scrolling Down
      nextIndex = (currentIndex - 1 + range.length) % range.length;
    }
    onValueChange(range[nextIndex]);
  };
  
  const eventHandlers = {
      onWheel: (e: React.WheelEvent) => {
        e.preventDefault();
        handleDelta(e.deltaY);
      },
      onTouchStart: (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        document.body.style.overflow = 'hidden'; // Lock page scroll on touch
      },
      onTouchMove: (e: React.TouchEvent) => {
        e.preventDefault(); // Prevent page scroll during touch move
        const delta = touchStartY.current - e.touches[0].clientY;
        if (Math.abs(delta) > 10) { // Threshold to start scrolling
          handleDelta(delta);
          touchStartY.current = e.touches[0].clientY;
        }
      },
      onTouchEnd: () => {
        document.body.style.overflow = ''; // Unlock page scroll
      },
  };
  
  const getDisplayValues = () => {
      const currentIndex = range.indexOf(value);
      const prevIndex = (currentIndex - 1 + range.length) % range.length;
      const nextIndex = (currentIndex + 1) % range.length;
      return {
          prev: range[prevIndex],
          current: value,
          next: range[nextIndex],
      };
  };

  const { prev, current, next } = getDisplayValues();

  return (
    <div className="flex flex-col items-center text-center select-none" {...eventHandlers}>
        <span className="text-2xl text-muted-foreground/30 h-8">
          {String(prev).padStart(2, '0')}
        </span>
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="text-6xl font-bold text-foreground h-16"
        >
          {String(current).padStart(2, '0')}
        </motion.div>
        <span className="text-2xl text-muted-foreground/30 h-8">
          {String(next).padStart(2, '0')}
        </span>
        <span className="text-sm font-light text-muted-foreground tracking-widest mt-2">{unit}</span>
    </div>
  );
};


export default function ToolsPage() {
  const [activeView, setActiveView] = useState<ToolView>("clock")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const alarmSoundNodesRef = useRef<{ oscillator: OscillatorNode, gainNode: GainNode, intervalId: number | null } | null>(null)

  // Wake Lock setup
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen")
        console.log("🔋 Wake lock active")
      }
    } catch (err: any) {
      console.error(`Wake lock failed: ${err.name}, ${err.message}`)
    }
  }

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        console.log("🔓 Wake lock released")
      } catch (err: any) {
        console.error(`Release wake lock failed: ${err.name}, ${err.message}`)
      }
    }
  }

  // Effect for the live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Effect for handling fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // State for Stopwatch
  const [stopwatchTime, setStopwatchTime] = useState(0)
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false)
  const [laps, setLaps] = useState<number[]>([])

  // State for Timer
  const [timerHours, setTimerHours] = useState(0)
  const [timerMinutes, setTimerMinutes] = useState(5)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRemaining, setTimerRemaining] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [initialTimerDuration, setInitialTimerDuration] = useState(0)
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false)

  const stopNotificationSound = () => {
    if (alarmSoundNodesRef.current) {
      const { oscillator, gainNode, intervalId } = alarmSoundNodesRef.current
      if (intervalId) clearInterval(intervalId)
      if (audioContextRef.current) {
          gainNode.gain.cancelScheduledValues(audioContextRef.current.currentTime)
          oscillator.stop()
      }
      alarmSoundNodesRef.current = null
    }
    setIsAlarmPlaying(false)
  }

  const playNotificationSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    stopNotificationSound() // Stop any previous sound

    const audioContext = audioContextRef.current
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.type = 'sine'
    oscillator.frequency.value = 880 // High pitch for alarm
    oscillator.start()

    let intervalId: number | null = null
    const pulse = () => {
      gainNode.gain.cancelScheduledValues(audioContext.currentTime)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4)
    }
    
    pulse() // Initial pulse
    intervalId = window.setInterval(pulse, 800) // Pulse every 0.8s

    alarmSoundNodesRef.current = { oscillator, gainNode, intervalId }
    setIsAlarmPlaying(true)

    // Alarm duration extended to 60 seconds
    setTimeout(() => {
      stopNotificationSound()
    }, 60000)
  }


  const showTimerEndNotification = () => {
    // Enhanced vibration pattern
    if ("vibrate" in navigator) navigator.vibrate([500, 100, 500, 100, 500, 300, 200, 100, 200, 100, 200])
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Timer Finished!", {
        body: "Your timer has ended.",
        icon: "https://placehold.co/192x192/orange/white?text=!",
      })
    }
  }
  
  // Web Worker for background timer
  useEffect(() => {
    const workerCode = `
      let timerInterval = null, stopwatchInterval = null;
      let timerTime = 0, stopwatchTime = 0;
      const stopwatchTick = () => { stopwatchTime += 10; self.postMessage({ type: 'stopwatch-tick', time: stopwatchTime }); };
      const timerTick = () => {
          timerTime -= 100;
          if (timerTime < 0) timerTime = 0;
          if (timerTime === 0) { clearInterval(timerInterval); timerInterval = null; }
          self.postMessage({ type: 'timer-tick', time: timerTime });
      };
      self.onmessage = ({ data: { command, value } }) => {
          switch (command) {
              case 'start-stopwatch': if (!stopwatchInterval) stopwatchInterval = setInterval(stopwatchTick, 10); break;
              case 'pause-stopwatch': clearInterval(stopwatchInterval); stopwatchInterval = null; break;
              case 'reset-stopwatch': clearInterval(stopwatchInterval); stopwatchInterval = null; stopwatchTime = 0; self.postMessage({ type: 'stopwatch-tick', time: 0 }); break;
              case 'start-timer': if (!timerInterval) { if (value) timerTime = value; if (timerTime > 0) timerInterval = setInterval(timerTick, 100); } break;
              case 'pause-timer': clearInterval(timerInterval); timerInterval = null; break;
              case 'reset-timer': clearInterval(timerInterval); timerInterval = null; timerTime = 0; self.postMessage({ type: 'timer-tick', time: 0 }); break;
          }
      };`
    const blob = new Blob([workerCode], { type: "application/javascript" })
    const workerUrl = URL.createObjectURL(blob)
    const worker = new Worker(workerUrl)
    workerRef.current = worker

    worker.onmessage = (event) => {
      const { type, time } = event.data
      if (type === "stopwatch-tick") setStopwatchTime(time)
      else if (type === "timer-tick") {
        setTimerRemaining(time)
        if (time === 0 && !isAlarmPlaying) { // Ensure alarm logic only runs once
          setIsTimerRunning(false)
          releaseWakeLock()
          showTimerEndNotification()
          playNotificationSound()
        }
      }
    }
    return () => { worker.terminate(); URL.revokeObjectURL(workerUrl); }
  }, [isAlarmPlaying])

  const formatStopwatchTime = (ms: number) => {
    const mins = Math.floor(ms / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    const millis = Math.floor((ms % 1000) / 10)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${millis.toString().padStart(2, "0")}`
  }

  const formatTimerTime = (ms: number) => {
    const hrs = Math.floor(ms / 3600000)
    const mins = Math.floor((ms % 3600000) / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const toggleFullscreen = async () => {
    try {
        const orientation = window.screen?.orientation as ScreenOrientationWithLock | undefined;
        if (!document.fullscreenElement) {
            await fullscreenRef.current?.requestFullscreen();
            if (orientation?.lock && window.innerWidth < 1024) {
                try {
                    await orientation.lock('landscape');
                } catch (e) {
                    console.warn("Could not lock screen orientation:", e);
                }
            }
        } else {
            if (orientation?.unlock) {
                orientation.unlock();
            }
            await document.exitFullscreen();
        }
    } catch (err) {
        console.error("Fullscreen API error:", err);
        console.warn("Could not enter fullscreen. This might be due to the environment's security policy.");
    }
  }

  const handleStopwatchToggle = () => {
    const newIsRunning = !isStopwatchRunning
    setIsStopwatchRunning(newIsRunning)
    if (newIsRunning) { workerRef.current?.postMessage({ command: "start-stopwatch" }); requestWakeLock() } 
    else { workerRef.current?.postMessage({ command: "pause-stopwatch" }); releaseWakeLock() }
  }
  
  const handleStopwatchLap = () => {
    if(isStopwatchRunning) {
      setLaps(prevLaps => [...prevLaps, stopwatchTime]);
    }
  }

  const handleStopwatchReset = () => { 
    setIsStopwatchRunning(false); 
    setStopwatchTime(0); 
    setLaps([]);
    workerRef.current?.postMessage({ command: "reset-stopwatch" }); 
    releaseWakeLock() 
  }
  
  const startTimerWithDuration = (duration: number) => {
    if (duration <= 0) return
    Notification.requestPermission()
    setInitialTimerDuration(duration)
    setIsTimerRunning(true)
    setTimerRemaining(duration)
    workerRef.current?.postMessage({ command: "start-timer", value: duration })
    requestWakeLock()
  }

  const handleTimerStart = () => startTimerWithDuration(timerHours * 3600000 + timerMinutes * 60000 + timerSeconds * 1000)
  const handleTimerPause = () => { setIsTimerRunning(false); workerRef.current?.postMessage({ command: "pause-timer" }); releaseWakeLock() }
  const handleTimerReset = () => { stopNotificationSound(); setIsTimerRunning(false); setTimerRemaining(0); workerRef.current?.postMessage({ command: "reset-timer" }); releaseWakeLock() }
  const handlePresetTimerClick = (minutes: number) => { 
    setTimerHours(0); 
    setTimerMinutes(minutes); 
    setTimerSeconds(0); 
    startTimerWithDuration(minutes * 60000);
  }
  const handleStopAlarm = () => { stopNotificationSound(); handleTimerReset(); }
  
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutesAndSeconds = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {!isFullscreen && (<>
          <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
              <div className="flex items-center justify-between h-14 sm:h-16">
                <div className="flex items-center gap-2 sm:gap-3">
                  <a href="/"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Back</span></Button></a>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-foreground rounded-lg flex items-center justify-center flex-shrink-0"><Timer className="w-4 h-4 sm:w-5 sm:h-5 text-background" /></div>
                  <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Tools</h1>
                </div>
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-medium">{currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">{currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            </div>
          </header>
          {/* --- NAVBAR SECTION: MODIFIED FOR RESPONSIVENESS --- */}
          <nav className="border-b border-border bg-card/30 sticky top-14 sm:top-16 z-40">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
              <div className="grid grid-cols-4 gap-2 py-2 sm:flex sm:gap-1 sm:overflow-x-auto sm:scrollbar-hide">
                <Button variant={activeView === "clock" ? "default" : "ghost"} size="sm" onClick={() => setActiveView("clock")} className="gap-1.5 sm:gap-2 flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4 w-full sm:w-auto">
                  <Clock className="w-4 h-4" /> Clock
                </Button>

                <Button variant={activeView === "stopwatch" ? "default" : "ghost"} size="sm" onClick={() => setActiveView("stopwatch")} className="gap-1.5 sm:gap-2 flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4 w-full sm:w-auto">
                  <Stopwatch className="w-4 h-4" /> Stopwatch
                </Button>

                <Button variant={activeView === "timer" ? "default" : "ghost"} size="sm" onClick={() => setActiveView("timer")} className="gap-1.5 sm:gap-2 flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4 w-full sm:w-auto">
                  <Timer className="w-4 h-4" /> Timer
                </Button>

                {/* 🔹 নতুন Calculator বাটন */}
                <a href="/tools/calculator">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 sm:gap-2 flex-shrink-0 h-9 sm:h-10 px-3 sm:px-4 w-full sm:w-auto"
                  >
                    <Calculator className="w-4 h-4" /> Calculator
                  </Button>
                </a>
              </div>
            </div>
          </nav>
      </>)}
      <main ref={fullscreenRef} className={`${ isFullscreen ? "fixed inset-0 z-[100] bg-background" : "max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8"}`}>
        <AnimatePresence mode="wait">
          {activeView === "clock" && (
            <motion.div key="clock" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className={`flex items-center justify-center ${ isFullscreen ? "h-screen" : "min-h-[60vh]"}`}>
                <Card className={`${ isFullscreen ? "border-0 shadow-none bg-background w-full h-full flex items-center justify-center" : "p-8 sm:p-12 lg:p-16"}`}><div className="text-center space-y-4 relative">
                  <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4">{isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</Button>
                  <div className={`font-bold font-mono tracking-tight ${ isFullscreen ? "text-8xl sm:text-9xl lg:text-[12rem]" : "text-6xl sm:text-7xl lg:text-8xl"}`}>{currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit"})}</div>
                  <div className={`text-muted-foreground ${ isFullscreen ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"}`}>{currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric"})}</div>
                </div></Card>
            </motion.div>
          )}
          {activeView === "stopwatch" && (
            <motion.div key="stopwatch" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className={`flex items-center justify-center ${ isFullscreen ? "h-screen" : "min-h-[60vh]"}`}>
                <Card className={`${ isFullscreen ? "border-0 shadow-none bg-background w-full h-full flex flex-col items-center justify-center" : "p-8 sm:p-12 lg:p-16 w-full max-w-2xl"}`}><div className="text-center space-y-8 relative w-full">
                  <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="absolute top-0 right-0 sm:top-2 sm:right-2">{isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</Button>
                  <div className={`font-bold font-mono tracking-tight ${ isFullscreen ? "text-8xl sm:text-9xl lg:text-[12rem]" : "text-6xl sm:text-7xl lg:text-8xl"}`}>{formatStopwatchTime(stopwatchTime)}</div>
                  <div className="flex items-center justify-center gap-4">
                      <Button size="lg" variant="outline" onClick={handleStopwatchReset} className="gap-2 px-8 bg-transparent"><RotateCcw className="w-5 h-5" /> Reset</Button>
                      <Button size="lg" onClick={handleStopwatchToggle} className="gap-2 px-8">{isStopwatchRunning ? ( <> <Pause className="w-5 h-5" /> Pause </> ) : ( <> <Play className="w-5 h-5" /> Start </>)}</Button>
                      <Button size="lg" variant="outline" onClick={handleStopwatchLap} disabled={!isStopwatchRunning && laps.length === 0} className="gap-2 px-8 bg-transparent"><Flag className="w-5 h-5" /> Lap</Button>
                  </div>
                  <AnimatePresence>
                    {laps.length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="w-full max-w-sm mx-auto pt-4">
                        <div className="h-48 overflow-y-auto rounded-lg border bg-card/50 p-2 scrollbar-hide text-left">
                          {[...laps].reverse().map((lap, index) => {
                            const reversedIndex = laps.length - 1 - index;
                            const previousLapTime = reversedIndex > 0 ? laps[reversedIndex - 1] : 0;
                            const lapDuration = lap - previousLapTime;
                            return (
                              <motion.div key={reversedIndex} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex justify-between items-center p-2.5 font-mono text-base border-b last:border-b-0">
                                <span className="text-muted-foreground">Lap {reversedIndex + 1}</span>
                                <span className="font-medium">+{formatStopwatchTime(lapDuration)}</span>
                                <span className="text-foreground/80">{formatStopwatchTime(lap)}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div></Card>
            </motion.div>
          )}
          {activeView === "timer" && (
            <motion.div key="timer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className={`flex items-center justify-center ${ isFullscreen ? "h-screen" : "min-h-[60vh]"}`}>
                <Card className={`${ isFullscreen ? "border-0 shadow-none bg-background w-full h-full flex flex-col items-center justify-center" : "p-8 sm:p-12 lg:p-16 w-full max-w-2xl"}`}><div className="text-center space-y-8 relative w-full">
                  <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="absolute top-0 right-0 sm:top-2 sm:right-2">{isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</Button>
                  {(timerRemaining > 0 || isTimerRunning || isAlarmPlaying) ? (
                    <div className="flex flex-col items-center justify-center space-y-8">
                      <div className="relative flex items-center justify-center">
                          <svg width="250" height="250" viewBox="0 0 250 250" className="transform -rotate-90"><circle stroke="hsl(var(--muted))" fill="transparent" strokeWidth="12" r="119" cx="125" cy="125" /><circle stroke="hsl(var(--primary))" fill="transparent" strokeWidth="12" strokeLinecap="round" strokeDasharray={2 * Math.PI * 119} strokeDashoffset={2 * Math.PI * 119 * (1 - (timerRemaining / initialTimerDuration))} r="119" cx="125" cy="125" className="transition-all duration-200"/></svg>
                          <div className={`absolute font-bold font-mono tracking-tight ${ isFullscreen ? "text-7xl" : "text-6xl"}`}>{formatTimerTime(timerRemaining)}</div>
                      </div>
                       <div className="flex items-center justify-center gap-4">
                         {isAlarmPlaying ? (
                           <Button size="lg" onClick={handleStopAlarm} className="gap-2 px-8 bg-destructive text-destructive-foreground hover:bg-destructive/90"><BellOff className="w-5 h-5" /> Stop Alarm</Button>
                         ) : (
                           <>
                             <Button size="lg" onClick={isTimerRunning ? handleTimerPause : () => startTimerWithDuration(timerRemaining)} className="gap-2 px-8">{isTimerRunning ? ( <> <Pause className="w-5 h-5" /> Pause </> ) : ( <> <Play className="w-5 h-5" /> Resume </>)}</Button>
                             <Button size="lg" variant="outline" onClick={handleTimerReset} className="gap-2 px-8 bg-transparent"><RotateCcw className="w-5 h-5" /> Reset</Button>
                           </>
                         )}
                       </div>
                    </div>
                    ) : (
                      <div className="w-full flex flex-col items-center justify-center space-y-6 sm:space-y-10">
                        <div className="flex items-center justify-center gap-4 sm:gap-8 cursor-grab active:cursor-grabbing">
                          <StylishTimeScroller value={timerHours} onValueChange={setTimerHours} unit="HOURS" range={hours} />
                          <StylishTimeScroller value={timerMinutes} onValueChange={setTimerMinutes} unit="MINUTES" range={minutesAndSeconds} />
                          <StylishTimeScroller value={timerSeconds} onValueChange={setTimerSeconds} unit="SECONDS" range={minutesAndSeconds} />
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                          {[5, 10, 15, 30, 45, 60].map((min) => (<Button key={min} variant="outline" className="rounded-full px-4 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-base hover:bg-primary/10 hover:border-primary/50 transition-colors" onClick={() => handlePresetTimerClick(min)}>{min} min</Button>))}
                        </div>

                        <div className="w-full pt-4">
                          <Button size="lg" onClick={handleTimerStart} disabled={timerHours === 0 && timerMinutes === 0 && timerSeconds === 0} className="w-full max-w-xs mx-auto h-12 sm:h-14 text-lg sm:text-xl rounded-full"><Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2" /> Start</Button>
                        </div>
                      </div>
                    )}
                </div></Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
