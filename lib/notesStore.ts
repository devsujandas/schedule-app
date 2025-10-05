"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type Note = {
  id: string
  title: string
  contentHtml: string
  createdAt: number
  updatedAt: number
  pinned: boolean
}

type NotesState = {
  notes: Note[]
  hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
  addNote: (data: { title: string; contentHtml: string }) => string
  updateNote: (id: string, data: Partial<Pick<Note, "title" | "contentHtml">>) => void
  deleteNote: (id: string) => void
  getNoteById: (id: string) => Note | undefined
  togglePin: (id: string) => void
  duplicateNote: (id: string) => string | undefined
}

function now() {
  return Date.now()
}

function createId() {
  // Use native UUID; avoids extra deps
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      addNote: ({ title, contentHtml }) => {
        const id = createId()
        const ts = now()
        const note: Note = {
          id,
          title: title.trim() || "Untitled",
          contentHtml,
          createdAt: ts,
          updatedAt: ts,
          pinned: false,
        }
        set((s) => ({ notes: [note, ...s.notes] }))
        return id
      },
      updateNote: (id, data) => {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  ...data,
                  title: (data.title ?? n.title).trim() || "Untitled",
                  updatedAt: now(),
                }
              : n,
          ),
        }))
      },
      deleteNote: (id) => {
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
      },
      getNoteById: (id) => {
        return get().notes.find((n) => n.id === id)
      },
      togglePin: (id) => {
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: now() } : n)),
        }))
      },
      duplicateNote: (id) => {
        const src = get().notes.find((n) => n.id === id)
        if (!src) return undefined
        const newId = createId()
        const ts = now()
        const copy: Note = {
          ...src,
          id: newId,
          title: `${src.title} (Copy)`,
          createdAt: ts,
          updatedAt: ts,
          pinned: false,
        }
        set((s) => ({ notes: [copy, ...s.notes] }))
        return newId
      },
    }),
    {
      name: "notes-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      version: 2,
      migrate: (persisted: any, version) => {
        if (version < 2 && persisted?.notes) {
          return {
            ...persisted,
            notes: persisted.notes.map((n: any) => ({
              pinned: false,
              ...n,
            })),
          }
        }
        return persisted
      },
      partialize: (s) => ({ notes: s.notes }),
    },
  ),
)
