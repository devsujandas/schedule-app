"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calculator, ArrowLeft, Trash2, Repeat, History } from "lucide-react";
import { useCalculatorStore } from "@/lib/calculator-store";

type UnitCategory = "Length" | "Temperature" | "Weight" | "Time";
type LengthUnit = "m" | "km" | "cm" | "mm" | "mile" | "ft";
type TemperatureUnit = "C" | "F" | "K";
type WeightUnit = "kg" | "g" | "lb" | "oz";
type TimeUnit = "sec" | "min" | "hr";

const UNIT_OPTIONS: Record<UnitCategory, string[]> = {
  Length: ["m", "km", "cm", "mm", "mile", "ft"],
  Temperature: ["C", "F", "K"],
  Weight: ["kg", "g", "lb", "oz"],
  Time: ["sec", "min", "hr"],
};

const LENGTH_MAP: Record<LengthUnit, number> = {
  m: 1,
  km: 1000,
  cm: 0.01,
  mm: 0.001,
  mile: 1609.34,
  ft: 0.3048,
};
const WEIGHT_MAP: Record<WeightUnit, number> = {
  kg: 1,
  g: 0.001,
  lb: 0.453592,
  oz: 0.0283495,
};
const TIME_MAP: Record<TimeUnit, number> = {
  sec: 1,
  min: 60,
  hr: 3600,
};

const safeEvaluate = (input: string) => {
  try {
    const transformed = input
      .replace(/√/g, "Math.sqrt")
      .replace(/\^/g, "**")
      .replace(/π/g, "Math.PI");

    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${transformed})`);
    const res = fn();
    if (typeof res !== "number" || !isFinite(res)) return "Error";
    return res.toPrecision(10).replace(/\.?0+$/, "");
  } catch {
    return "Error";
  }
};

const convertTemperature = (val: number, from: TemperatureUnit, to: TemperatureUnit) => {
  if (from === to) return val;
  let celsius = val;
  if (from === "F") celsius = (val - 32) * (5 / 9);
  else if (from === "K") celsius = val - 273.15;

  if (to === "F") return celsius * (9 / 5) + 32;
  if (to === "K") return celsius + 273.15;
  return celsius;
};

export default function CalculatorPage() {
  const { history, addHistory, clearHistory } = useCalculatorStore();

  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [tab, setTab] = useState<"calc" | "convert">("calc");
  const [showHistory, setShowHistory] = useState(false);

  const [category, setCategory] = useState<UnitCategory>("Length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("km");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");

  const buttons = useMemo(
    () => [
      "Clear", "(", ")", "⌫",
      "7", "8", "9", "/",
      "4", "5", "6", "*",
      "1", "2", "3", "-",
      "0", ".", "√", "+",
      "^", "=", "%",
    ],
    []
  );

  useEffect(() => {
    if (!expression) setResult("0");
    else {
      const res = safeEvaluate(expression);
      if (res !== "Error") setResult(res);
    }
  }, [expression]);

  const handleClick = (val: string) => {
    if (val === "Clear") return setExpression(""), setResult("0");
    if (val === "⌫") return setExpression(expression.slice(0, -1));
    if (val === "=") {
      const res = safeEvaluate(expression);
      if (res !== "Error") {
        setResult(res);
        addHistory(`calc:${expression}=${res}`);
        setExpression(res);
      } else setResult("Error");
      return;
    }
    setExpression(expression + val);
  };

  const convert = (value: string, from: string, to: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "";

    let result = num;
    if (category === "Length") result = num * (LENGTH_MAP[from as LengthUnit] / LENGTH_MAP[to as LengthUnit]);
    else if (category === "Weight") result = num * (WEIGHT_MAP[from as WeightUnit] / WEIGHT_MAP[to as WeightUnit]);
    else if (category === "Time") result = num * (TIME_MAP[from as TimeUnit] / TIME_MAP[to as TimeUnit]);
    else if (category === "Temperature") result = convertTemperature(num, from as TemperatureUnit, to as TemperatureUnit);

    addHistory(`conv:${value}${from}→${to}=${result}`);
    return parseFloat(result.toPrecision(10)).toString();
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setFromValue(toValue);
    setToValue(fromValue);
  };

  const handleHistoryClick = (item: string) => {
    if (item.startsWith("calc:")) {
      setTab("calc");
      const expr = item.replace("calc:", "").split("=")[0];
      setExpression(expr);
      const res = safeEvaluate(expr);
      setResult(res);
    } else if (item.startsWith("conv:")) {
      setTab("convert");
      const match = item.match(/conv:(\d+\.?\d*)([a-zA-Z]+)→([a-zA-Z]+)=(\d+\.?\d*)/);
      if (match) {
        setFromValue(match[1]);
        setFromUnit(match[2]);
        setToUnit(match[3]);
        setToValue(match[4]);
      }
    }
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-background/80 flex flex-col items-center justify-start relative">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/70 backdrop-blur-lg border-b border-border/60 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center h-14">
          <div className="flex items-center gap-2">
            <Link href="/tools">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-accent/50 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
          </div>

          <div className="flex gap-2">
            <Button
              variant={tab === "calc" ? "default" : "ghost"}
              onClick={() => setTab("calc")}
              className="transition-all"
            >
              Calculator
            </Button>
            <Button
              variant={tab === "convert" ? "default" : "ghost"}
              onClick={() => setTab("convert")}
              className="transition-all"
            >
              Converter
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="w-4 h-4" /> History
            </Button>
          </div>
        </div>
      </header>

      {/* History Popup */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 bg-card/90 backdrop-blur-lg border border-border rounded-2xl shadow-xl p-4 w-72 z-50"
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold">History</h2>
              <Button size="sm" variant="ghost" onClick={clearHistory}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <ul className="max-h-60 overflow-y-auto text-sm space-y-1">
              {history.length === 0 ? (
                <li className="text-muted-foreground text-center">No history yet</li>
              ) : (
                history.map((item, i) => (
                  <li
                    key={i}
                    className="cursor-pointer hover:bg-accent/60 px-2 py-1 rounded-md transition-colors"
                    onClick={() => handleHistoryClick(item)}
                  >
                    {item}
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 w-full flex justify-center items-center p-4">
        <Card className="w-full max-w-md p-6 shadow-2xl bg-card/80 backdrop-blur-xl rounded-3xl border border-border/70 transition-all hover:shadow-lg">
          <AnimatePresence mode="wait">
            {tab === "calc" ? (
              <motion.div
                key="calc"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-5">
                  <input
                    type="text"
                    readOnly
                    value={expression}
                    placeholder="0"
                    className="w-full text-right text-lg sm:text-xl bg-background/60 rounded-lg p-3 border border-border/50 focus:outline-none font-mono"
                  />
                  <div className="text-right text-2xl sm:text-3xl font-bold mt-2 text-primary">
                    {result}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {buttons.map((btn) => (
                    <Button
                      key={btn}
                      onClick={() => handleClick(btn)}
                      className={`h-12 text-lg rounded-xl font-medium transition-all
                        ${
                          btn === "="
                            ? "col-span-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                            : btn === "Clear"
                            ? "bg-red-500/80 text-white hover:bg-red-600 dark:bg-red-600/80 dark:hover:bg-red-700"
                            : "bg-secondary/70 text-secondary-foreground hover:bg-secondary/90"
                        }`}
                    >
                      {btn}
                    </Button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="convert"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calculator className="w-4 h-4" /> Unit Converter
                </h2>
                <div className="mb-4">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as UnitCategory)}
                    className="w-full mt-1 p-2 rounded-lg border bg-background/60 focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    {Object.keys(UNIT_OPTIONS).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <div className="flex-1">
                    <label className="text-sm font-medium">From</label>
                    <select
                      value={fromUnit}
                      onChange={(e) => {
                        setFromUnit(e.target.value);
                        if (fromValue) setToValue(convert(fromValue, e.target.value, toUnit));
                      }}
                      className="w-full mt-1 p-2 rounded-lg border bg-background/60 focus:ring-2 focus:ring-primary/50 transition-all"
                    >
                      {UNIT_OPTIONS[category].map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={fromValue}
                      onChange={(e) => {
                        setFromValue(e.target.value);
                        setToValue(convert(e.target.value, fromUnit, toUnit));
                      }}
                      placeholder="Enter value"
                      className="w-full mt-2 p-2 rounded-lg border bg-background/60 focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={swapUnits}
                    className="mt-2 sm:mt-7 shadow-sm hover:bg-accent/50 transition-colors"
                  >
                    <Repeat className="w-4 h-4" /> Swap
                  </Button>

                  <div className="flex-1">
                    <label className="text-sm font-medium">To</label>
                    <select
                      value={toUnit}
                      onChange={(e) => {
                        setToUnit(e.target.value);
                        if (fromValue) setToValue(convert(fromValue, fromUnit, e.target.value));
                      }}
                      className="w-full mt-1 p-2 rounded-lg border bg-background/60 focus:ring-2 focus:ring-primary/50 transition-all"
                    >
                      {UNIT_OPTIONS[category].map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      readOnly
                      value={toValue}
                      placeholder="Result"
                      className="w-full mt-2 p-2 rounded-lg border bg-background/60 font-semibold text-primary"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </main>
    </div>
  );
}
