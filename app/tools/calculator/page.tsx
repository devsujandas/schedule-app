"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trash2, History, Clock } from "lucide-react";
import { useCalculatorStore } from "@/lib/calculator-store";

const safeTransform = (input: string) =>
  input
    .replace(/÷/g, "/")
    .replace(/×/g, "*")
    .replace(/−/g, "-")
    .replace(/√/g, "Math.sqrt")
    .replace(/\^/g, "**")
    .replace(/π/g, "Math.PI");

const safeEvaluate = (input: string): string => {
  try {
    const transformed = safeTransform(input);
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${transformed})`);
    const res = fn();
    if (typeof res !== "number" || !isFinite(res)) return "Error";
    const rounded = parseFloat(res.toFixed(12));
    return rounded.toString();
  } catch {
    return "Error";
  }
};

export default function CalculatorPage() {
  const { history, addHistory, clearHistory } = useCalculatorStore();
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [showHistory, setShowHistory] = useState(false);
  const [lastWasResult, setLastWasResult] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const buttons = useMemo(
    () => [
      "C", "(", ")", "⌫",
      "7", "8", "9", "÷",
      "4", "5", "6", "×",
      "1", "2", "3", "−",
      "0", ".", "√", "+",
      "^",  "%","=",
    ],
    []
  );

  // live update result
  useEffect(() => {
    if (!expression) {
      setResult("0");
      setLastWasResult(false);
      return;
    }
    setResult(safeEvaluate(expression));
  }, [expression]);

  // Close drawer on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    if (showHistory) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [showHistory]);

  const handleClick = (val: string) => {
    if (val === "C") {
      setExpression("");
      setResult("0");
      return;
    }
    if (val === "⌫") {
      setExpression((prev) => prev.slice(0, -1));
      return;
    }
    if (val === "=") {
      const res = safeEvaluate(expression);
      if (res !== "Error") {
        addHistory(`${expression} = ${res}`);
        setExpression(res);
        setResult(res);
        setLastWasResult(true);
      } else setResult("Error");
      return;
    }

    const operators = ["+", "-", "×", "÷", "*", "/", "^", "%", "−"];
    if (lastWasResult && operators.includes(val)) {
      setExpression((prev) => prev + val);
      setLastWasResult(false);
      return;
    }
    setExpression((prev) => prev + val);
    setLastWasResult(false);
  };

  const handleHistoryClick = (item: string) => {
    const expr = item.split("=")[0].trim();
    setExpression(expr);
    setResult(safeEvaluate(expr));
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/80 flex flex-col items-center relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/70 backdrop-blur-lg border-b border-border/60 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center h-14">
          <Link href="/tools">
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-accent/40 transition-all">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 hover:bg-primary/20 transition-all"
            onClick={() => setShowHistory((prev) => !prev)}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </Button>
        </div>
      </header>

      {/* Sliding History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <>
            {/* Background overlay */}
            <motion.div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Drawer panel */}
            <motion.div
              ref={drawerRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-[90%] sm:w-[400px] bg-card/95 backdrop-blur-xl border-l border-border/60 shadow-2xl z-50 p-5 flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Calculation History
                </h2>
                <Button size="sm" variant="ghost" onClick={clearHistory}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {history.length === 0 ? (
                  <div className="text-muted-foreground text-center text-sm mt-20">
                    No history yet
                  </div>
                ) : (
                  history.map((item, i) => {
                    const [expr, res] = item.split("=");
                    return (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleHistoryClick(item)}
                        className="cursor-pointer bg-gradient-to-br from-secondary/40 to-background/60 border border-border/50 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground font-mono truncate">
                            {expr.trim()}
                          </div>
                          <div className="text-xs text-primary/70">tap to reuse</div>
                        </div>
                        <div className="text-right text-lg font-semibold text-primary mt-1">
                          {res?.trim()}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              <div className="mt-4">
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                  onClick={() => setShowHistory(false)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Calculator */}
      <main className="flex-1 w-full flex justify-center items-center p-4">
        <Card className="w-full max-w-md p-6 shadow-2xl bg-card/80 backdrop-blur-xl rounded-3xl border border-border/70">
          <div className="mb-5">
            <input
              type="text"
              readOnly
              value={expression || ""}
              placeholder="0"
              className="w-full text-right text-lg sm:text-2xl bg-background/60 rounded-lg p-3 border border-border/50 font-mono focus:outline-none"
            />
            <div className="text-right text-3xl sm:text-4xl font-bold mt-2 text-primary break-words">
              {result}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {buttons.map((btn) => (
              <Button
                key={btn}
                onClick={() => handleClick(btn)}
                className={`h-12 sm:h-14 text-base sm:text-lg rounded-xl font-medium transition-all ${
                  btn === "="
                    ? "col-span-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                    : btn === "C"
                    ? "bg-red-500/80 text-white hover:bg-red-600"
                    : "bg-secondary/70 text-secondary-foreground hover:bg-secondary/90"
                }`}
              >
                {btn}
              </Button>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
