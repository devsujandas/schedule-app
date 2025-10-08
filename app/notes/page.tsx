"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NotebookPenIcon,
  MoreVertical,
  PinIcon,
  PlusIcon,
  FileDownIcon,
  Trash2Icon,
  PinOffIcon,
  SearchIcon,
} from "lucide-react";
import { useNotesStore, type Note } from "@/lib/notesStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

// 🧹 Helper — remove HTML tags
function stripHtml(html: string): string {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export default function NotesPage() {
  const notes = useNotesStore((s) => s.notes);
  const hasHydrated = useNotesStore((s) => s.hasHydrated);
  const [query, setQuery] = useState("");

  // ✅ Auto-sorted + filtered notes
  const filteredNotes = useMemo(() => {
    const search = query.toLowerCase();
    const arr = [...notes]
      .filter(
        (note) =>
          note.title.toLowerCase().includes(search) ||
          stripHtml(note.contentHtml).toLowerCase().includes(search)
      )
      .sort((a, b) => {
        // Pinned first
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        // Then by most recently updated
        const aUpdated = new Date(a.updatedAt).getTime();
        const bUpdated = new Date(b.updatedAt).getTime();
        return bUpdated - aUpdated;
      });
    return arr;
  }, [notes, query]);

  return (
    <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 lg:px-10 relative">
      {/* Header */}
      <nav className="mb-4 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <NotebookPenIcon className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Notes Gallery
          </h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">Back</Link>
        </Button>
      </nav>

      {/* 🔍 Search Bar */}
      <div className="mb-6 flex items-center gap-2 rounded-xl border bg-muted/40 p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/40 transition">
        <SearchIcon className="h-5 w-5 text-muted-foreground ml-2" />
        <Input
          type="text"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-none bg-transparent focus-visible:ring-0 text-sm"
        />
      </div>

      {/* Notes Gallery */}
      {!hasHydrated ? (
        <p className="text-muted-foreground text-center">Loading notes…</p>
      ) : filteredNotes.length === 0 ? (
        <Card className="border-dashed text-center py-10">
          <CardHeader>
            <CardTitle>No matching notes</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Try a different search term or create a new note!
          </CardContent>
        </Card>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </section>
      )}

      {/* Floating Add Button */}
      <Link
        href="/notes/editor"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform"
      >
        <PlusIcon className="h-6 w-6" />
      </Link>
    </main>
  );
}

// ================== NOTE CARD ==================
function NoteCard({ note }: { note: Note }) {
  const router = useRouter();
  const togglePin = useNotesStore((s) => s.togglePin);
  const deleteNote = useNotesStore((s) => s.deleteNote);

  const excerpt = stripHtml(note.contentHtml).slice(0, 120);
  const updated = new Date(note.updatedAt).toLocaleString();

  // ✅ Simple Print → Save as PDF
  const downloadPDF = (note: Note) => {
    const win = window.open("", "_blank");
    win!.document.write(`
      <html>
        <head>
          <title>${note.title || "Untitled Note"}</title>
          <style>
            body { font-family: Arial; padding: 20px; line-height: 1.6; background: #fff; color: #000; }
            h1 { text-align: center; font-size: 22px; }
            p.meta { text-align: center; font-size: 12px; color: #555; }
            hr { margin: 12px 0; }
            .content { font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>${note.title || "Untitled"}</h1>
          <p class="meta">Updated: ${new Date(note.updatedAt).toLocaleString()}</p>
          <hr/>
          <div class="content">${note.contentHtml}</div>
        </body>
      </html>
    `);
    win!.document.close();
    win!.print();
  };

  const openEditor = () => {
    router.push(`/notes/editor?id=${encodeURIComponent(note.id)}`);
  };

  return (
    <Card
      onClick={openEditor}
      className="group relative flex flex-col justify-between h-full rounded-2xl border border-border/40 bg-gradient-to-br from-card/90 to-background/60 backdrop-blur-md shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
    >
      {/* Top Action Buttons */}
      <div
        className="absolute right-3 top-3 flex items-center gap-1 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        {note.pinned && (
          <PinIcon className="h-4 w-4 text-primary drop-shadow-sm" />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="hover:bg-accent/30"
              aria-label="More actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="backdrop-blur-md">
            <DropdownMenuItem onClick={() => togglePin(note.id)}>
              {note.pinned ? (
                <>
                  <PinOffIcon className="h-4 w-4 mr-2" /> Unpin
                </>
              ) : (
                <>
                  <PinIcon className="h-4 w-4 mr-2" /> Pin
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadPDF(note)}>
              <FileDownIcon className="h-4 w-4 mr-2" /> Export / Print
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => deleteNote(note.id)}
            >
              <Trash2Icon className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Note Content */}
      <div className="flex flex-col flex-1 px-4 pt-5 pb-2">
        <CardHeader className="pb-2 px-0">
          <CardTitle className="line-clamp-1 text-lg font-semibold text-foreground">
            {note.title || "Untitled"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 px-0">
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
            {excerpt || "No content yet."}
          </p>
        </CardContent>
      </div>

      {/* Footer */}
      <CardFooter
        className="mt-auto flex items-center justify-between border-t px-4 py-2 bg-muted/40 rounded-b-2xl text-xs text-muted-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="truncate text-[11px] sm:text-xs"> {updated}</span>
        <Button
          size="sm"
          variant="secondary"
          asChild
          className="text-xs px-3 rounded-lg"
        >
          <Link href={`/notes/editor?id=${encodeURIComponent(note.id)}`}>
            Edit
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
