"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eraser,
  Table,
  Undo,
  Redo,
  Minus,
  CheckSquare,
  Maximize2,
  Minimize2,
  Save,
  Copy,
  Trash2,
  ArrowLeft,
  Plus,
  X,
  Rows,
  Columns,
  CrossIcon,
  XCircle,
  CircleX,
} from "lucide-react"
import { useNotesStore } from "@/lib/notesStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"

// ✅ Google Fonts (Roboto, Poppins, Inter)
if (typeof document !== "undefined") {
  const fontLink = document.createElement("link")
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Poppins:wght@400;600&family=Roboto:wght@400;700&display=swap"
  fontLink.rel = "stylesheet"
  document.head.appendChild(fontLink)
}

type Cmd =
  | "bold"
  | "italic"
  | "underline"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "removeFormat"
  | "undo"
  | "redo"

export default function EditorPage() {
  const router = useRouter()
  const params = useSearchParams()
  const id = params.get("id") || undefined
  const { theme } = useTheme()

  const getNoteById = useNotesStore((s) => s.getNoteById)
  const addNote = useNotesStore((s) => s.addNote)
  const updateNote = useNotesStore((s) => s.updateNote)
  const deleteNote = useNotesStore((s) => s.deleteNote)
  const hasHydrated = useNotesStore((s) => s.hasHydrated)

  const note = useMemo(() => (id ? getNoteById(id) : undefined), [id, getNoteById, hasHydrated])

  const [title, setTitle] = useState(note?.title ?? "")
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [currentId, setCurrentId] = useState<string | undefined>(id || undefined)
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [contentHtmlState, setContentHtmlState] = useState<string>("")
  const savedRangeRef = useRef<Range | null>(null)
  const lastSnapshotRef = useRef<{ title: string; html: string } | null>(null)

  const [fontFamily, setFontFamily] = useState("Inter")
  const [fontSize, setFontSize] = useState("16px")
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showTablePopup, setShowTablePopup] = useState(false)
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
  })
  const [selectedTable, setSelectedTable] = useState<HTMLTableElement | null>(null)
  const [showTableTools, setShowTableTools] = useState(false)

  // Load note
  useEffect(() => {
    if (!hasHydrated) return
    if (editorRef.current && note) {
      editorRef.current.innerHTML = note.contentHtml || ""
      setContentHtmlState(note.contentHtml || "")
      setTitle(note.title || "")
    } else if (editorRef.current && !note) {
      editorRef.current.innerHTML = ""
      setContentHtmlState("")
      setTitle("")
    }
  }, [note, hasHydrated])

  // Selection handling
  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0)
      
      // Check if selection is inside a table
      const selectedElement = sel.anchorNode?.parentElement
      const table = selectedElement?.closest('table')
      if (table) {
        setSelectedTable(table as HTMLTableElement)
        setShowTableTools(true)
      } else {
        setSelectedTable(null)
        setShowTableTools(false)
      }
    }
  }
  
  const restoreSelection = () => {
    const range = savedRangeRef.current
    if (!range) return
    const sel = window.getSelection()
    if (!sel) return
    sel.removeAllRanges()
    sel.addRange(range)
  }
  
  const ensureFocus = () => editorRef.current?.focus()

  // Check active formats
  const checkActiveFormats = () => {
    if (!editorRef.current) return
    const isBold = document.queryCommandState("bold")
    const isItalic = document.queryCommandState("italic")
    const isUnderline = document.queryCommandState("underline")
    
    setActiveFormats({
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
    })
  }

  const exec = (cmd: Cmd) => {
    ensureFocus()
    restoreSelection()
    document.execCommand(cmd, false)
    saveSelection()
    checkActiveFormats()
  }

  const insertHorizontalLine = () => {
    ensureFocus()
    restoreSelection()
    document.execCommand("insertHorizontalRule")
    saveSelection()
  }

  const insertCheckbox = () => {
    ensureFocus()
    restoreSelection()
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.className = "inline-block mr-1 align-middle"
    const range = savedRangeRef.current
    if (range) {
      range.insertNode(checkbox)
    } else {
      editorRef.current?.appendChild(checkbox)
    }
    saveSelection()
  }

  const changeFontFamily = (family: string) => {
    setFontFamily(family)
    ensureFocus()
    restoreSelection()
    document.execCommand("fontName", false, family)
    saveSelection()
  }

  const changeFontSize = (size: string) => {
    setFontSize(size)
    ensureFocus()
    restoreSelection()
    document.execCommand("fontSize", false, "7")
    const fonts = editorRef.current?.getElementsByTagName("font")
    if (fonts) {
      Array.from(fonts).forEach((el) => {
        if (el.size === "7") {
          el.removeAttribute("size")
          el.style.fontSize = size
        }
      })
    }
    saveSelection()
  }

  // Enhanced table functionality
  const insertTable = (rows = tableRows, cols = tableCols) => {
    ensureFocus()
    restoreSelection()
    
    const table = document.createElement("table")
    table.setAttribute("border", "1")
    table.className = "w-full border-collapse border border-foreground/20 my-2 [&_td]:border [&_td]:border-foreground/20 [&_td]:p-2 [&_td]:min-w-[80px]"
    
    // Create data rows
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement("tr")
      for (let c = 0; c < cols; c++) {
        const td = document.createElement("td")
        td.innerHTML = "&nbsp;"
        td.contentEditable = "true"
        tr.appendChild(td)
      }
      table.appendChild(tr)
    }

    const range = savedRangeRef.current
    if (range) {
      range.deleteContents()
      range.insertNode(table)
    } else {
      editorRef.current?.appendChild(table)
    }
    
    // Select the new table
    setSelectedTable(table)
    setShowTableTools(true)
    saveSelection()
    setShowTablePopup(false)
  }

  // Table manipulation functions
  const addTableRow = () => {
    if (!selectedTable) return
    
    ensureFocus()
    const rows = selectedTable.getElementsByTagName("tr")
    const cols = rows[0].cells.length
    
    const newRow = document.createElement("tr")
    for (let c = 0; c < cols; c++) {
      const td = document.createElement("td")
      td.innerHTML = "&nbsp;"
      td.contentEditable = "true"
      newRow.appendChild(td)
    }
    
    selectedTable.appendChild(newRow)
    saveSelection()
  }

  const addTableColumn = () => {
    if (!selectedTable) return
    
    ensureFocus()
    const rows = selectedTable.getElementsByTagName("tr")
    
    for (let i = 0; i < rows.length; i++) {
      const newCell = document.createElement("td")
      newCell.innerHTML = "&nbsp;"
      newCell.contentEditable = "true"
      newCell.className = "p-2 border border-foreground/20"
      rows[i].appendChild(newCell)
    }
    
    saveSelection()
  }

  const deleteTableRow = () => {
    if (!selectedTable) return
    
    ensureFocus()
    const rows = selectedTable.getElementsByTagName("tr")
    if (rows.length > 1) {
      const lastRow = rows[rows.length - 1]
      lastRow.remove()
    }
    
    saveSelection()
  }

  const deleteTableColumn = () => {
    if (!selectedTable) return
    
    ensureFocus()
    const rows = selectedTable.getElementsByTagName("tr")
    
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].cells
      if (cells.length > 1) {
        cells[cells.length - 1].remove()
      }
    }
    
    saveSelection()
  }

  const deleteTable = () => {
    if (!selectedTable) return
    selectedTable.remove()
    setSelectedTable(null)
    setShowTableTools(false)
    saveSelection()
  }

  const clearFormatting = () => {
    ensureFocus()
    restoreSelection()
    document.execCommand("removeFormat", false)
    document.execCommand("unlink", false)
    saveSelection()
    checkActiveFormats()
  }

  // Apply formatting to selection
  const applyFormatToSelection = (format: string, value?: string) => {
  ensureFocus()
  restoreSelection()

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  if (format === "fontSize" && value) {
    document.execCommand("fontSize", false, "7")

    const range = selection.getRangeAt(0)
    const parent = range.commonAncestorContainer as HTMLElement

    // find affected <font> elements safely
    const fontElements =
      parent.nodeType === Node.ELEMENT_NODE
        ? (parent as HTMLElement).querySelectorAll('font[size="7"]')
        : parent.parentElement?.querySelectorAll('font[size="7"]')

    if (fontElements && fontElements.length > 0) {
      fontElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.removeAttribute("size")
          el.style.fontSize = value
        }
      })
    }
  } 
  else if (format === "fontFamily" && value) {
    document.execCommand("fontName", false, value)
  } 
  else {
    document.execCommand(format, false, value)
  }

  saveSelection()
  checkActiveFormats()
}


  // Autosave
  useEffect(() => {
    if (!hasHydrated) return
    const tick = () => {
      const html = editorRef.current?.innerHTML || ""
      const snapshot = lastSnapshotRef.current
      const nextSnap = { title, html }
      if (!currentId && !title.trim() && !stripHtml(html).trim()) return
      if (snapshot && snapshot.title === nextSnap.title && snapshot.html === nextSnap.html) return
      setStatus("saving")
      if (currentId) {
        updateNote(currentId, { title, contentHtml: html })
      } else {
        const newId = addNote({ title, contentHtml: html })
        setCurrentId(newId)
        router.replace(`/notes/editor?id=${encodeURIComponent(newId)}`)
      }
      lastSnapshotRef.current = nextSnap
      setStatus("saved")
      setLastSavedAt(Date.now())
    }
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [title, contentHtmlState, hasHydrated])

  const onDelete = () => {
    if (currentId) deleteNote(currentId)
    router.push("/notes")
  }

  const handleCopy = async () => {
    const text = stripHtml(editorRef.current?.innerHTML || "")
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      alert("Copy failed.")
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev)
    const el = document.documentElement
    if (!document.fullscreenElement) {
      el.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Close table tools when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!editorRef.current?.contains(e.target as Node)) {
        setShowTableTools(false)
        setSelectedTable(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <main
      className={`mx-auto w-full transition-all duration-300 ${
        isFullscreen 
          ? "fixed inset-0 z-50 bg-background p-0 m-0 h-screen" 
          : "max-w-5xl px-4 py-6"
      }`}
    >
      {!hasHydrated ? (
        <div className="text-muted-foreground">Loading editor…</div>
      ) : (
        <Card className={`rounded-2xl shadow-xl border overflow-hidden bg-transparent ${
          isFullscreen ? "h-screen rounded-none" : ""
        }`}>
          <CardHeader className={`p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isFullscreen ? "sticky top-0 bg-background z-10" : ""
          }`}>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isFullscreen && (
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/notes">
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                </Button>
              )}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title..."
                className="bg-transparent text-lg font-semibold border-none focus-visible:ring-0 flex-1 sm:w-80"
              />
            </div>

            {/* ✅ Responsive Button Row */}
            <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <Button variant="outline" size="icon" onClick={handleCopy}>
                <Copy className={`h-4 w-4 ${copied ? "text-green-500" : ""}`} />
              </Button>
              {currentId && (
                <Button variant="destructive" size="icon" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="default"
                onClick={() =>
                  updateNote(currentId!, {
                    title,
                    contentHtml: editorRef.current?.innerHTML || "",
                  })
                }
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>

          {/* Toolbar - Fixed in fullscreen */}
          <div className={`flex flex-wrap items-center justify-center gap-2 border-b bg-background/95 backdrop-blur-md p-3 ${
            isFullscreen ? "sticky top-[73px] z-10" : ""
          }`}>
            {/* Main Formatting Tools */}
            <ToolbarButton 
              onAction={() => exec("bold")} 
              isActive={activeFormats.bold}
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton 
              onAction={() => exec("italic")} 
              isActive={activeFormats.italic}
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton 
              onAction={() => exec("underline")} 
              isActive={activeFormats.underline}
            >
              <Underline className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onAction={() => exec("justifyLeft")}><AlignLeft className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={() => exec("justifyCenter")}><AlignCenter className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={() => exec("justifyRight")}><AlignRight className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={insertHorizontalLine}><Minus className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={insertCheckbox}><CheckSquare className="h-4 w-4" /></ToolbarButton>
            
            {/* Table Insert Button */}
            <div className="relative">
              <ToolbarButton onAction={() => setShowTablePopup(!showTablePopup)}>
                <Table className="h-4 w-4" />
              </ToolbarButton>
              
              {showTablePopup && (
                <div className="absolute top-full left-0 mt-2 bg-background border rounded-lg shadow-lg z-20 p-4 min-w-[200px]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Insert Table</h4>
                    <Button variant="ghost" size="icon" onClick={() => setShowTablePopup(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Rows</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={tableRows}
                        onChange={(e) => setTableRows(Number(e.target.value))}
                        className="w-full h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Columns</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={tableCols}
                        onChange={(e) => setTableCols(Number(e.target.value))}
                        className="w-full h-8"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => insertTable(tableRows, tableCols)}
                    className="w-full"
                  >
                    Insert Table
                  </Button>
                </div>
              )}
            </div>

            {/* Table Tools - Show when table is selected */}
            {showTableTools && selectedTable && (
              <>
                <div className="h-6 w-px bg-border mx-1"></div>
                <span className="text-xs text-muted-foreground font-medium">Table:</span>
                <ToolbarButton onAction={addTableRow}>
                  <Rows className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Add Row</span>
                </ToolbarButton>
                <ToolbarButton onAction={addTableColumn}>
                  <Columns className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Add Column</span>
                </ToolbarButton>
                <ToolbarButton onAction={deleteTableRow}>
                  <Rows className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Delete Row</span>
                </ToolbarButton>
                <ToolbarButton onAction={deleteTableColumn}>
                  <Columns className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Delete Column</span>
                </ToolbarButton>
                <ToolbarButton onAction={deleteTable}>
                  <Trash2 className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Delete Table</span>
                </ToolbarButton>
              </>
            )}

            <ToolbarButton onAction={clearFormatting}><Eraser className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={() => exec("undo")}><Undo className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={() => exec("redo")}><Redo className="h-4 w-4" /></ToolbarButton>

            {/* ✅ Updated Font Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={fontFamily}
                onChange={(e) => changeFontFamily(e.target.value)}
                className="rounded border p-1 text-sm bg-background text-foreground focus:outline-none"
              >
                <option>Arial</option>
                <option>Georgia</option>
                <option>Times New Roman</option>
                <option>Courier New</option>
                <option>Verdana</option>
                <option>Monospace</option>
                <option>Roboto</option>
                <option>Poppins</option>
                <option>Inter</option>
                <option>Comic Sans MS</option>
              </select>

              <select
                value={fontSize}
                onChange={(e) => applyFormatToSelection("fontSize", e.target.value)}
                className="rounded border p-1 text-sm bg-background text-foreground focus:outline-none"
              >
                {["12px", "14px", "16px", "18px", "20px", "22px", "24px", "28px", "32px"].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Editor - Scrollable in fullscreen */}
          <CardContent className="p-0">
            <div
              ref={editorRef}
              className={`w-full border-y p-5 text-base leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all ${
                isFullscreen ? "h-[calc(100vh-140px)] overflow-y-auto" : "min-h-[500px]"
              }`}
              style={{ fontFamily, fontSize }}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => {
                saveSelection()
                setContentHtmlState((e.currentTarget as HTMLDivElement).innerHTML)
                checkActiveFormats()
              }}
              onFocus={saveSelection}
              onMouseUp={() => {
                saveSelection()
                checkActiveFormats()
              }}
              onKeyUp={() => {
                saveSelection()
                checkActiveFormats()
              }}
              onClick={checkActiveFormats}
            />
          </CardContent>

          {(status === "saving" || status === "saved") && (
  <div
    className={`
      fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2
      rounded-full shadow-lg border backdrop-blur-md transition-all duration-300
      ${status === "saving"
        ? "bg-yellow-500/90 border-yellow-400 text-white"
        : "bg-emerald-500/90 border-emerald-400 text-white"}
    `}
  >
    <span>
      {status === "saving"
        ? "Saving…"
        : lastSavedAt
        ? `Saved at ${new Date(lastSavedAt).toLocaleTimeString()}`
        : "Saved"}
    </span>

  <button
  type="button"
  onMouseDown={(e) => {
    e.preventDefault()
    setStatus("idle")
  }}
  aria-label="Close notification"
  className="
    ml-2 flex items-center justify-center
    p-1.5 rounded-full
    bg-white/10 hover:bg-white/20
    transition-all duration-200
    text-red-400 hover:text-red-500
    backdrop-blur-sm shadow-sm hover:shadow-md
    border border-white/10 hover:border-white/20
  "
>
  <CircleX className="h-4 w-4" strokeWidth={2.5} />
</button>


  </div>
)}

        </Card>
      )}
    </main>
  )
}

function ToolbarButton({ 
  onAction, 
  children, 
  isActive = false 
}: { 
  onAction: () => void; 
  children: React.ReactNode;
  isActive?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={isActive ? "default" : "outline"}
      size="sm"
      className={`rounded-md transition ${
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "bg-transparent hover:bg-primary/10"
      }`}
      onMouseDown={(e) => {
        e.preventDefault()
        onAction()
      }}
    >
      {children}
    </Button>
  )
}

function stripHtml(html: string): string {
  if (!html) return ""
  const tmp = typeof window !== "undefined" ? document.createElement("div") : null
  if (!tmp) return html
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ""
}

function wordCount(html: string): number {
  const text = stripHtml(html)
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.length
}