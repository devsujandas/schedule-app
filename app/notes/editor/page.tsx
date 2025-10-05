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
} from "lucide-react"
import { useNotesStore } from "@/lib/notesStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"

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

  const [fontFamily, setFontFamily] = useState("Arial")
  const [fontSize, setFontSize] = useState("16px")
  const [copied, setCopied] = useState(false)

  // Load note content
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

  // Selection utils
  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0)
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

  // Exec Commands
  const exec = (cmd: Cmd) => {
    ensureFocus()
    restoreSelection()
    document.execCommand(cmd, false)
    saveSelection()
  }

  // Insert HR
  const insertHorizontalLine = () => {
    ensureFocus()
    restoreSelection()
    document.execCommand("insertHorizontalRule")
    saveSelection()
  }

  // Insert Checkbox
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

  // Font controls
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

  // Insert Table
  const insertTable = (rows = 3, cols = 3) => {
    ensureFocus()
    const table = document.createElement("table")
    table.setAttribute("border", "1")
    table.className =
      "w-full border-collapse border border-foreground/20 [&_td]:border [&_td]:border-foreground/20 [&_td]:p-2"
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement("tr")
      for (let c = 0; c < cols; c++) {
        const td = document.createElement("td")
        td.innerHTML = "&nbsp;"
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
    saveSelection()
  }

  // Clear Formatting
  const clearFormatting = () => {
    ensureFocus()
    restoreSelection()
    document.execCommand("removeFormat", false)
    document.execCommand("unlink", false)
    document.execCommand("formatBlock", false, "<p>")
    saveSelection()
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

  // ✅ Safe Copy Handler
  const handleCopy = async () => {
    const text = stripHtml(editorRef.current?.innerHTML || "")
    if (!text) return

    try {
      if (navigator?.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.opacity = "0"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch (e) {
      console.error("Copy failed:", e)
      alert("Copy failed. Please try again.")
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 transition-colors duration-300">
      <header className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{id ? "Edit your note" : "Create a new note"}</p>
        <Button variant="secondary" asChild>
          <Link href="/notes">Back to Notes</Link>
        </Button>
      </header>

      {!hasHydrated ? (
        <div className="text-muted-foreground">Loading editor…</div>
      ) : (
        <Card className="shadow-xl border rounded-2xl overflow-hidden bg-transparent">
          <CardHeader className="p-4 border-b">
            <CardTitle>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="bg-transparent text-lg font-semibold"
              />
            </CardTitle>
          </CardHeader>

          {/* Toolbar */}
          <div className="sticky top-0 z-10 flex flex-wrap items-center justify-center gap-2 border-b bg-background/70 backdrop-blur-md p-3">
            <ToolbarButton onAction={() => exec("bold")}><Bold className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={() => exec("italic")}><Italic className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={() => exec("underline")}><Underline className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={() => exec("justifyLeft")}><AlignLeft className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={() => exec("justifyCenter")}><AlignCenter className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={() => exec("justifyRight")}><AlignRight className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={insertHorizontalLine}><Minus className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={insertCheckbox}><CheckSquare className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={() => insertTable(3, 3)}><Table className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={clearFormatting}><Eraser className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={() => exec("undo")}><Undo className="h-4 w-4" /></ToolbarButton>
            <ToolbarButton onAction={() => exec("redo")}><Redo className="h-4 w-4" /></ToolbarButton>

            {/* Font Controls */}
            <div className="flex items-center gap-2">
              <select
                value={fontFamily}
                onChange={(e) => changeFontFamily(e.target.value)}
                className="rounded border bg-transparent p-1 text-sm"
              >
                <option>Arial</option>
                <option>Georgia</option>
                <option>Times New Roman</option>
                <option>Courier New</option>
                <option>Verdana</option>
                <option>Monospace</option>
              </select>

              <select
                value={fontSize}
                onChange={(e) => changeFontSize(e.target.value)}
                className="rounded border bg-transparent p-1 text-sm"
              >
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
              </select>
            </div>
          </div>

          <CardContent className="p-0">
            <div
              ref={editorRef}
              className="min-h-[340px] w-full border-y p-4 outline-none transition-all text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              style={{ fontFamily, fontSize }}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => {
                saveSelection()
                setContentHtmlState((e.currentTarget as HTMLDivElement).innerHTML)
              }}
              onFocus={saveSelection}
              onMouseUp={saveSelection}
              onKeyUp={saveSelection}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground p-3">
              <div>
                {status === "saving"
                  ? "Saving…"
                  : status === "saved" && lastSavedAt
                    ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
                    : ""}
              </div>
              <div className="flex items-center gap-2">
                <span>{wordCount(editorRef.current?.innerHTML || "")} words</span>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div className="text-xs text-muted-foreground">
              {currentId && note
                ? `Last updated ${new Date(note.updatedAt).toLocaleString()}`
                : "New note"}
            </div>
            <div className="flex items-center gap-2">
              {currentId && (
                <Button variant="destructive" onClick={onDelete}>
                  Delete
                </Button>
              )}
              <Button onClick={() => updateNote(currentId!, { title, contentHtml: editorRef.current?.innerHTML || "" })}>
                Save
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </main>
  )
}

function ToolbarButton({ onAction, children }: { onAction: () => void; children: React.ReactNode }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="bg-transparent hover:bg-primary/10 text-foreground rounded-md transition"
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
