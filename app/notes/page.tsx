"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NotebookPenIcon,
  MoreVertical,
  PinIcon,
  SearchIcon,
  PlusIcon,
  FileDownIcon,
  Trash2Icon,
  PinOffIcon,
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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [sortKey, setSortKey] = useState<
    "updated-desc" | "updated-asc" | "title-asc" | "created-desc"
  >("updated-desc");
  const [pinnedOnly, setPinnedOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = pinnedOnly ? notes.filter((n) => n.pinned) : notes;
    if (!q) return list;
    return list.filter((n) => {
      const inTitle = n.title.toLowerCase().includes(q);
      const inBody = stripHtml(n.contentHtml).toLowerCase().includes(q);
      return inTitle || inBody;
    });
  }, [notes, query, pinnedOnly]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const aUpdated = new Date(a.updatedAt).getTime();
      const bUpdated = new Date(b.updatedAt).getTime();
      const aCreated = new Date(a.createdAt).getTime();
      const bCreated = new Date(b.createdAt).getTime();
      switch (sortKey) {
        case "updated-asc":
          return aUpdated - bUpdated;
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "created-desc":
          return bCreated - aCreated;
        default:
          return bUpdated - aUpdated;
      }
    });
    return arr;
  }, [filtered, sortKey]);

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 md:px-6 lg:px-8 relative">
      {/* Header */}
      <nav className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <NotebookPenIcon className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Notes
          </h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">Back</Link>
        </Button>
      </nav>

      {/* Controls */}
      <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="pl-9 bg-background text-foreground w-full"
          />
        </div>

        <div className="flex items-center gap-3 rounded-lg border bg-card/60 px-3 py-2 shadow-sm backdrop-blur-md">
          <select
            className="rounded-md border bg-background px-2 py-1 text-foreground focus:ring-2 focus:ring-primary"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
          >
            <option value="updated-desc">Last updated</option>
            <option value="updated-asc">Oldest updated</option>
            <option value="title-asc">Title A–Z</option>
            <option value="created-desc">Newest created</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-foreground whitespace-nowrap">
            <input
              type="checkbox"
              checked={pinnedOnly}
              onChange={(e) => setPinnedOnly(e.target.checked)}
            />
            Pinned only
          </label>
        </div>
      </section>

      {/* Notes Section */}
      {!hasHydrated ? (
        <p className="text-muted-foreground">Loading your notes…</p>
      ) : sorted.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No notes found</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            {query ? "Try a different search." : "Create your first note!"}
          </CardContent>
        </Card>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </section>
      )}

      {/* Floating Button */}
      <Link
        href="/notes/editor"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl hover:scale-105 hover:shadow-2xl transition-transform"
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

  const excerpt = stripHtml(note.contentHtml).slice(0, 140);
  const updated = new Date(note.updatedAt).toLocaleString();

  // ✅ Super easy Print → Save as PDF
  const downloadPDF = (note: Note) => {
    const printWindow = window.open("", "_blank");
    printWindow!.document.write(`
      <html>
        <head>
          <title>${note.title || "Untitled Note"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #000; background: #fff; }
            h1 { text-align: center; font-size: 20px; margin-bottom: 8px; }
            p.meta { text-align: center; font-size: 12px; color: #555; }
            hr { margin: 10px 0; }
            .content { font-size: 13px; line-height: 1.6; word-break: break-word; }
          </style>
        </head>
        <body>
          <h1>${note.title || "Untitled Note"}</h1>
          <p class="meta">Updated: ${new Date(note.updatedAt).toLocaleString()}</p>
          <hr/>
          <div class="content">${note.contentHtml}</div>
        </body>
      </html>
    `);
    printWindow!.document.close();
    printWindow!.print();
  };

  const openEditor = () => {
    router.push(`/notes/editor?id=${encodeURIComponent(note.id)}`);
  };

  return (
    <Card
      className="group relative cursor-pointer rounded-xl border bg-card/80 shadow-md backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-1 hover:ring-primary/30"
      onClick={openEditor}
    >
      {/* Actions */}
      <div
        className="absolute right-3 top-3 flex items-center gap-1 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {note.pinned && <PinIcon className="h-4 w-4 text-primary" />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="hover:bg-accent/40"
              aria-label="More actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
              <FileDownIcon className="h-4 w-4 mr-2" /> Download / Print PDF
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

      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1 text-lg font-semibold text-foreground">
          {note.title || "Untitled"}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-2">
        <div
          className="line-clamp-3 text-sm leading-relaxed text-muted-foreground"
          dangerouslySetInnerHTML={{
            __html: note.contentHtml || "No content yet.",
          }}
        />
      </CardContent>

      {/* Footer aligned */}
      <CardFooter
        className="flex items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground bg-muted/30 rounded-b-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="whitespace-nowrap text-[11px] sm:text-xs">
          Updated {updated}
        </span>
        <Button size="sm" variant="secondary" asChild className="text-xs px-3">
          <Link href={`/notes/editor?id=${encodeURIComponent(note.id)}`}>
            Edit
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
