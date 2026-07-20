"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Briefcase, Calendar, FolderDot, ScrollText, Users, X } from "lucide-react";
import { useLandingStore } from "@/hooks/useLandingStore";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: "Program Kerja" | "Timeline" | "Logbook" | "Dokumen" | "Notulen";
  link: string;
}

export default function GlobalSearch() {
  const router = useRouter();
  const { prokers, timelineEvents, logbooks, documents, notulen } = useLandingStore();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close search panel on outside clicks
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Keyboard shortcut Command+K or Ctrl+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    const list: SearchResult[] = [];

    // 1. Scan Prokers
    prokers.forEach((p) => {
      if (p.name.toLowerCase().includes(q) || p.pic.toLowerCase().includes(q)) {
        list.push({
          id: p.id,
          title: p.name,
          subtitle: `PIC: ${p.pic} | Progress: ${p.progress}%`,
          category: "Program Kerja",
          link: "/proker",
        });
      }
    });

    // 2. Scan Timeline Events
    timelineEvents.forEach((t) => {
      if (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
        list.push({
          id: t.id,
          title: t.title,
          subtitle: `${t.date} - PIC: ${t.pic || "Kelompok"}`,
          category: "Timeline",
          link: "/timeline",
        });
      }
    });

    // 3. Scan Logbooks
    logbooks.forEach((l) => {
      if (l.timeline_title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.user_name.toLowerCase().includes(q)) {
        list.push({
          id: l.id,
          title: l.timeline_title,
          subtitle: `Oleh: ${l.user_name} | ${l.date} - ${l.location}`,
          category: "Logbook",
          link: "/logbook",
        });
      }
    });

    // 4. Scan Documents
    documents.forEach((d) => {
      if (d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)) {
        list.push({
          id: d.id,
          title: d.name,
          subtitle: `Kategori: ${d.category} | Ukuran: ${d.size}`,
          category: "Dokumen",
          link: "/dokumen",
        });
      }
    });

    // 5. Scan Notulen
    notulen.forEach((n) => {
      if (n.title.toLowerCase().includes(q) || n.agenda.toLowerCase().includes(q) || n.attendees.toLowerCase().includes(q)) {
        list.push({
          id: n.id,
          title: n.title,
          subtitle: `${n.date} | Lokasi: ${n.location}`,
          category: "Notulen",
          link: "/notulen",
        });
      }
    });

    return list.slice(0, 8); // Max 8 results
  }, [query, prokers, timelineEvents, logbooks, documents, notulen]);



  const getCategoryIcon = (category: SearchResult["category"]) => {
    switch (category) {
      case "Program Kerja":
        return Briefcase;
      case "Timeline":
        return Calendar;
      case "Logbook":
        return FileText;
      case "Dokumen":
        return FolderDot;
      case "Notulen":
        return ScrollText;
    }
  };

  const handleResultClick = (link: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(link);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs z-30">
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 hover:bg-slate-200/60 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800/80 rounded-xl text-xs text-slate-405 font-bold cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <span>Pencarian KKN...</span>
        </div>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400 shadow-sm dark:border-slate-800 dark:bg-slate-900 leading-none">
          ⌘K
        </kbd>
      </button>

      {/* Floating results overlay dropdown */}
      {isOpen && (
        <div className="absolute top-12 left-0 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-xl p-3 space-y-3 z-50">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Pencarian Cepat KKNHub
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              placeholder="Ketik kata kunci pencarian..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2 pl-9 pr-4 outline-none focus:border-kkn-blue"
            />
          </div>

          {/* Results list */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {query.trim() === "" ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Ketik nama anggota, dokumen, proker, atau agenda logbook...
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Tidak ada hasil yang cocok.
              </div>
            ) : (
              results.map((res) => {
                const Icon = getCategoryIcon(res.category);
                return (
                  <button
                    key={`${res.category}-${res.id}`}
                    onClick={() => handleResultClick(res.link)}
                    className="flex gap-3 items-start w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-left transition-colors"
                  >
                    <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-grow space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[150px]">
                          {res.title}
                        </span>
                        <span className="text-[8px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                          {res.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate leading-relaxed">
                        {res.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
