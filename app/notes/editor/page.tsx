"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Bold,
  Italic,
  Underline,
  ListOrdered,
  List,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Eraser,
  Table,
  Undo,
  Redo,
} from "lucide-react"
import { useNotesStore } from "@/lib/notesStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

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

  const [showLinkPopup, setShowLinkPopup] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")

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

  // selection utils
  function saveSelection() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0)
    }
  }

  function restoreSelection() {
    const range = savedRangeRef.current
    if (!range) return
    const sel = window.getSelection()
    if (!sel) return
    sel.removeAllRanges()
    sel.addRange(range)
  }

  function ensureSelection() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0)
      return
    }
    const el = editorRef.current
    if (!el) return
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
    savedRangeRef.current = range
  }

  // execute command
  function exec(cmd: Cmd) {
    ensureSelection()
    restoreSelection()
    document.execCommand(cmd, false)
    editorRef.current?.focus()
    saveSelection()
  }

  // custom toggle functions for lists & blockquote
  function toggleList(type: "ul" | "ol") {
    ensureSelection()
    restoreSelection()
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    let container = range.startContainer as HTMLElement
    while (container && container !== editorRef.current && container.nodeName !== "DIV" && container.nodeName !== "P" && container.nodeName !== "LI") {
      container = container.parentElement as HTMLElement
    }
    if (!container || container === editorRef.current) return
    if (container.parentElement?.nodeName.toLowerCase() !== type) {
      const list = document.createElement(type)
      const li = document.createElement("li")
      li.innerHTML = container.innerHTML
      list.appendChild(li)
      container.replaceWith(list)
    } else {
      const parentList = container.parentElement
      if (parentList) {
        const p = document.createElement("p")
        p.innerHTML = container.innerHTML
        parentList.replaceWith(p)
      }
    }
    saveSelection()
  }

  function toggleBlockquote() {
    ensureSelection()
    restoreSelection()
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    let container = range.startContainer as HTMLElement
    while (container && container !== editorRef.current && container.nodeName !== "DIV" && container.nodeName !== "P" && container.nodeName !== "BLOCKQUOTE") {
      container = container.parentElement as HTMLElement
    }
    if (!container || container === editorRef.current) return
    if (container.nodeName === "BLOCKQUOTE") {
      const p = document.createElement("p")
      p.innerHTML = container.innerHTML
      container.replaceWith(p)
    } else {
      const blockquote = document.createElement("blockquote")
      blockquote.innerHTML = container.innerHTML
      container.replaceWith(blockquote)
    }
    saveSelection()
  }

  function formatBlock(tag: "P") {
    ensureSelection()
    restoreSelection()
    document.execCommand("formatBlock", false, `<${tag.toLowerCase()}>`)
    editorRef.current?.focus()
    saveSelection()
  }

  // custom link popup
  function openLinkPopup() {
    setShowLinkPopup(true)
  }

  function applyLink() {
    if (!linkUrl.trim()) return
    ensureSelection()
    restoreSelection()
    document.execCommand("createLink", false, linkUrl)
    setLinkUrl("")
    setShowLinkPopup(false)
    editorRef.current?.focus()
    saveSelection()
  }

  function clearFormatting() {
    ensureSelection()
    restoreSelection()
    document.execCommand("removeFormat", false)
    document.execCommand("unlink", false)
    document.execCommand("formatBlock", false, "<p>")
    editorRef.current?.focus()
    saveSelection()
  }

  // table insertion
  function insertTable(rows = 3, cols = 3) {
    ensureSelection()
    const table = document.createElement("table")
    table.setAttribute("border", "1")
    table.className = "w-full border-collapse [&_td]:border [&_td]:p-2"
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
    const firstCell = table.querySelector("td")
    if (firstCell) {
      const r = document.createRange()
      r.selectNodeContents(firstCell)
      r.collapse(true)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(r)
      saveSelection()
    }
  }

  // autosave
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

  // delete
  function onDelete() {
    if (currentId) deleteNote(currentId)
    router.push("/notes")
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">{id ? "Edit your note" : "Create a new note"}</p>
        </div>
        <Button variant="secondary" asChild>
          <Link href="/notes">Back to Notes</Link>
        </Button>
      </header>

      {!hasHydrated ? (
        <div className="text-muted-foreground">Loading editor…</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="bg-background text-foreground"
              />
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <ToolbarButton onAction={() => exec("bold")}><Bold className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onAction={() => exec("italic")}><Italic className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onAction={() => exec("underline")}><Underline className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onAction={() => toggleList("ul")}><List className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onAction={() => toggleList("ol")}><ListOrdered className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onAction={toggleBlockquote}><Quote className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onAction={() => exec("justifyLeft")}><AlignLeft className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onAction={() => exec("justifyCenter")}><AlignCenter className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onAction={() => exec("justifyRight")}><AlignRight className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onAction={openLinkPopup}><LinkIcon className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onAction={clearFormatting}><Eraser className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onAction={() => insertTable(3, 3)}><Table className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onAction={() => exec("undo")}><Undo className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onAction={() => exec("redo")}><Redo className="h-4 w-4" /></ToolbarButton>
            </div>

            {/* Editor */}
            <div
              ref={editorRef}
              className="min-h-[320px] w-full rounded-md border bg-background p-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div>
                {status === "saving"
                  ? "Saving…"
                  : status === "saved" && lastSavedAt
                    ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
                    : " "}
              </div>
              <div className="flex items-center gap-2">
                <span>{wordCount(editorRef.current?.innerHTML || "")} words</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const text = stripHtml(editorRef.current?.innerHTML || "")
                    try {
                      await navigator.clipboard.writeText(text)
                    } catch {}
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between">
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

      {/* Link popup */}
      {showLinkPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-md shadow-lg w-[300px] space-y-3">
            <h3 className="font-semibold text-lg text-foreground">Insert Link</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full border p-2 rounded bg-background text-foreground"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowLinkPopup(false)}>Cancel</Button>
              <Button onClick={applyLink}>Apply</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

// helper components & utils
function ToolbarButton({ onAction, children }: { onAction: () => void; children: React.ReactNode }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="bg-background text-foreground"
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
