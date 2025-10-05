"use client"

import type React from "react"
import {
  Bold as IconBold,
  Italic as IconItalic,
  Underline as IconUnderline,
  ListOrdered as IconListOrdered,
  ListOrdered as IconListUnordered,
  Icon as IconH1,
  Icon as IconH2,
  GitCompareArrows as IconParagraph,
  Quote as IconQuote,
  AlignLeft as IconAlignLeft,
  AlignCenter as IconAlignCenter,
  AlignRight as IconAlignRight,
  ScanLine as IconLinkLucide,
  IceCream as IconClear,
  Cable as IconTable,
  Columns as IconColumns,
  DiamondPlus as IconPlus,
  BookMinus as IconMinus,
  Heading1Icon,
  Heading2Icon,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useNotesStore } from "@/lib/notesStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Cmd =
  | "bold"
  | "italic"
  | "underline"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "undo"
  | "redo"
  | "removeFormat"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"

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

  useEffect(() => {
    if (id) setCurrentId(id)
  }, [id])

  function exec(cmd: Cmd) {
    ensureSelection()
    document.execCommand(cmd, false)
    editorRef.current?.focus()
    saveSelection()
  }

  function formatBlock(tag: "P" | "H1" | "H2" | "BLOCKQUOTE") {
    ensureSelection()
    document.execCommand("formatBlock", false, `<${tag.toLowerCase()}>`)
    editorRef.current?.focus()
    saveSelection()
  }

  function createLink() {
    ensureSelection()
    const url = prompt("Enter URL")
    if (!url) return
    document.execCommand("createLink", false, url)
    editorRef.current?.focus()
    saveSelection()
  }

  function clearFormatting() {
    ensureSelection()
    document.execCommand("removeFormat", false)
    document.execCommand("formatBlock", false, "<p>")
    editorRef.current?.focus()
    saveSelection()
  }

  function getSelectionContainer(): HTMLElement | null {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    let node = sel.getRangeAt(0).startContainer as Node | null
    while (node && node.nodeType !== 1) node = node.parentNode
    return node as HTMLElement | null
  }

  function closest(el: HTMLElement | null, selector: string): HTMLElement | null {
    if (!el) return null
    if (el.closest) return el.closest(selector) as HTMLElement | null
    while (el) {
      if ((el as any).matches && (el as any).matches(selector)) return el
      el = el.parentElement as HTMLElement | null
    }
    return null
  }

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

  function getActiveTable(): HTMLTableElement | null {
    const container = getSelectionContainer()
    const table = closest(container, "table") as HTMLTableElement | null
    return table
  }

  function addRow(after = true) {
    const table = getActiveTable()
    if (!table) return
    const container = getSelectionContainer()
    const currentRow = closest(container, "tr") as HTMLTableRowElement | null
    if (!currentRow) return
    const newRow = currentRow.cloneNode(true) as HTMLTableRowElement
    newRow.querySelectorAll("td").forEach((td) => (td.innerHTML = "&nbsp;"))
    currentRow.parentElement?.insertBefore(newRow, after ? currentRow.nextSibling : currentRow)
  }

  function removeRow() {
    const table = getActiveTable()
    if (!table) return
    const container = getSelectionContainer()
    const currentRow = closest(container, "tr") as HTMLTableRowElement | null
    if (!currentRow) return
    currentRow.remove()
  }

  function addColumn(after = true) {
    const table = getActiveTable()
    if (!table) return
    const container = getSelectionContainer()
    const currentCell = closest(container, "td,th") as HTMLTableCellElement | null
    if (!currentCell) return
    const cellIndex = Array.from(currentCell.parentElement!.children).indexOf(currentCell)
    table.querySelectorAll("tr").forEach((tr) => {
      const cells = Array.from(tr.children)
      const newCell = (
        currentCell.tagName === "TH" ? document.createElement("th") : document.createElement("td")
      ) as HTMLTableCellElement
      newCell.innerHTML = "&nbsp;"
      tr.insertBefore(newCell, after ? cells[cellIndex].nextSibling : cells[cellIndex])
    })
  }

  function removeColumn() {
    const table = getActiveTable()
    if (!table) return
    const container = getSelectionContainer()
    const currentCell = closest(container, "td,th") as HTMLTableCellElement | null
    if (!currentCell) return
    const cellIndex = Array.from(currentCell.parentElement!.children).indexOf(currentCell)
    table.querySelectorAll("tr").forEach((tr) => {
      const cells = Array.from(tr.children)
      if (cells[cellIndex]) cells[cellIndex].remove()
    })
  }

  function deleteTable() {
    const table = getActiveTable()
    if (!table) return
    table.remove()
  }

  function onSave() {
    const contentHtml = editorRef.current?.innerHTML || ""
    if (currentId && note) {
      updateNote(currentId, { title, contentHtml })
      setStatus("saved")
      setLastSavedAt(Date.now())
      return
    }
    const newId = addNote({ title, contentHtml })
    setCurrentId(newId)
    setStatus("saved")
    setLastSavedAt(Date.now())
    router.replace(`/notes/editor?id=${encodeURIComponent(newId)}`)
  }

  function onDelete() {
    if (currentId) {
      deleteNote(currentId)
    }
    router.push("/notes")
  }

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
        setStatus("saved")
        setLastSavedAt(Date.now())
      } else {
        const newId = addNote({ title, contentHtml: html })
        setCurrentId(newId)
        setStatus("saved")
        setLastSavedAt(Date.now())
        router.replace(`/notes/editor?id=${encodeURIComponent(newId)}`)
      }
      lastSnapshotRef.current = nextSnap
    }
    const interval = setInterval(tick, 3000)
    return () => clearInterval(interval)
  }, [title, contentHtmlState, hasHydrated])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        onSave()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [title, contentHtmlState, hasHydrated])

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

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-pretty text-2xl font-semibold text-foreground">Editor</h1>
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
            <CardTitle className="text-foreground">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="bg-background text-foreground"
                aria-label="Note title"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <ToolbarButton ariaLabel="Bold" onAction={() => exec("bold")}>
                <IconBold className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Italic" onAction={() => exec("italic")}>
                <IconItalic className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Underline" onAction={() => exec("underline")}>
                <IconUnderline className="h-4 w-4" />
              </ToolbarButton>
              <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
              <ToolbarButton ariaLabel="Bulleted list" onAction={() => exec("insertUnorderedList")}>
                <IconListUnordered className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Numbered list" onAction={() => exec("insertOrderedList")}>
                <IconListOrdered className="h-4 w-4" />
              </ToolbarButton>
              <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
              <ToolbarButton ariaLabel="Heading 1" onAction={() => formatBlock("H1")}>
                <Heading1Icon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Heading 2" onAction={() => formatBlock("H2")}>
                <Heading2Icon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Paragraph" onAction={() => formatBlock("P")}>
                <IconParagraph className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Blockquote" onAction={() => formatBlock("BLOCKQUOTE")}>
                <IconQuote className="h-4 w-4" />
              </ToolbarButton>
              <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
              <ToolbarButton ariaLabel="Align left" onAction={() => exec("justifyLeft")}>
                <IconAlignLeft className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Align center" onAction={() => exec("justifyCenter")}>
                <IconAlignCenter className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Align right" onAction={() => exec("justifyRight")}>
                <IconAlignRight className="h-4 w-4" />
              </ToolbarButton>
              <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
              <ToolbarButton ariaLabel="Insert link" onAction={createLink}>
                <IconLinkLucide className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Clear formatting" onAction={clearFormatting}>
                <IconClear className="h-4 w-4" />
              </ToolbarButton>
              <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
              <ToolbarButton ariaLabel="Insert table" onAction={() => insertTable(3, 3)}>
                <IconTable className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Add row" onAction={() => addRow(true)}>
                <IconTable className="h-4 w-4" />
                <IconPlus className="ml-1 h-3 w-3" />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Remove row" onAction={removeRow}>
                <IconTable className="h-4 w-4" />
                <IconMinus className="ml-1 h-3 w-3" />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Add column" onAction={() => addColumn(true)}>
                <IconColumns className="h-4 w-4" />
                <IconPlus className="ml-1 h-3 w-3" />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Remove column" onAction={removeColumn}>
                <IconColumns className="h-4 w-4" />
                <IconMinus className="ml-1 h-3 w-3" />
              </ToolbarButton>
              <ToolbarButton ariaLabel="Delete table" onAction={deleteTable}>
                <IconTable className="h-4 w-4" />
                <IconClear className="ml-1 h-3 w-3" />
              </ToolbarButton>
            </div>

            <div
              ref={editorRef}
              className="min-h-[320px] w-full rounded-md border bg-background p-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              contentEditable
              role="textbox"
              aria-multiline="true"
              aria-label="Note content editor"
              suppressContentEditableWarning
              onMouseUp={saveSelection}
              onKeyUp={saveSelection}
              onInput={(e) => {
                saveSelection()
                setContentHtmlState((e.currentTarget as HTMLDivElement).innerHTML)
              }}
              onFocus={saveSelection}
            />

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
            <div className="text-muted-foreground text-xs">
              {currentId && note ? `Last updated ${new Date(note.updatedAt).toLocaleString()}` : "New note"}
            </div>
            <div className="flex items-center gap-2">
              {currentId ? (
                <Button variant="destructive" onClick={onDelete}>
                  Delete
                </Button>
              ) : null}
              <Button onClick={onSave}>Save</Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </main>
  )
}

function ToolbarButton({
  onAction,
  children,
  ariaLabel,
}: {
  onAction: () => void
  children: React.ReactNode
  ariaLabel?: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={ariaLabel}
      onMouseDown={(e) => {
        e.preventDefault()
        onAction()
      }}
      className="bg-background text-foreground"
    >
      {children}
    </Button>
  )
}

function ToolbarIcon({ children }: { children: React.ReactNode }) {
  return <span className="text-sm">{children}</span>
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
