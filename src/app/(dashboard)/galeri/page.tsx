"use client";

import { useState, useMemo } from "react";
import { Camera, Search, Filter, Calendar, MapPin, User, Tag, Eye, X, Download, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLandingStore, LogbookEntry } from "@/hooks/useLandingStore";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface GalleryPhoto {
  logbookId: string;
  photoUrl: string;
  title: string;
  uploader: string;
  date: string;
  location: string;
  prokerName: string;
  description: string;
}

export default function GaleriPage() {
  const { logbooks, prokers } = useLandingStore();

  // 1. Flatten all photos from logbooks with status 'Selesai'
  const allPhotos = useMemo(() => {
    const photosList: GalleryPhoto[] = [];
    logbooks.forEach((log) => {
      if (log.status === "Selesai" && log.photos && log.photos.length > 0) {
        log.photos.forEach((photoUrl) => {
          // Find associated program of work if possible
          const proker = prokers.find((p) => log.timeline_title.toLowerCase().includes(p.name.toLowerCase()));
          const prokerName = proker ? proker.name : "Kegiatan Kelompok";

          photosList.push({
            logbookId: log.id,
            photoUrl,
            title: log.timeline_title,
            uploader: log.user_name,
            date: log.date,
            location: log.location,
            prokerName,
            description: log.description,
          });
        });
      }
    });
    return photosList;
  }, [logbooks, prokers]);

  // 2. Filters state
  const [search, setSearch] = useState("");
  const [prokerFilter, setProkerFilter] = useState("All");
  const [memberFilter, setMemberFilter] = useState("All");
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  // Get list of unique uploaders and prokers for filter options
  const uniqueMembers = useMemo(() => {
    const membersSet = new Set<string>();
    allPhotos.forEach((p) => membersSet.add(p.uploader));
    return Array.from(membersSet);
  }, [allPhotos]);

  const uniqueProkers = useMemo(() => {
    const prokersSet = new Set<string>();
    allPhotos.forEach((p) => prokersSet.add(p.prokerName));
    return Array.from(prokersSet);
  }, [allPhotos]);

  // 3. Filtered Photos
  const filteredPhotos = useMemo(() => {
    return allPhotos.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.uploader.toLowerCase().includes(search.toLowerCase()) ||
        p.location.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());

      const matchesProker = prokerFilter === "All" || p.prokerName === prokerFilter;
      const matchesMember = memberFilter === "All" || p.uploader === memberFilter;

      return matchesSearch && matchesProker && matchesMember;
    });
  }, [allPhotos, search, prokerFilter, memberFilter]);

  return (
    <div className="space-y-8">
      {/* Top Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-900/30 text-kkn-blue text-xs font-bold uppercase">
            <Camera className="h-3.5 w-3.5" />
            <span>Dokumentasi KKN</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Galeri Kegiatan Sukaluyu 211
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Koleksi foto kegiatan dan dokumentasi pengabdian masyarakat yang terunggah via logbook anggota.
          </p>
        </div>
      </div>

      {/* Filter and Search Action Row */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm">
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari dokumentasi kegiatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs md:text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2 pl-10 pr-4 outline-none focus:border-kkn-blue"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Program Kerja Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={prokerFilter}
              onChange={(e) => setProkerFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 outline-none text-xs"
            >
              <option value="All">Semua Program Kerja</option>
              {uniqueProkers.map((pr) => (
                <option key={pr} value={pr}>
                  {pr.length > 30 ? `${pr.slice(0, 30)}...` : pr}
                </option>
              ))}
            </select>
          </div>

          {/* Member/Uploader Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <User className="h-4 w-4 text-slate-400" />
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 outline-none text-xs"
            >
              <option value="All">Semua Anggota</option>
              {uniqueMembers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Masonry Pinterest-style Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
          <Camera className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p className="font-bold">Belum ada foto dokumentasi</p>
          <p className="text-xs mt-1">Foto otomatis terangkum di sini dari logbook yang diselesaikan anggota.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filteredPhotos.map((photo, index) => (
            <motion.div
              key={`${photo.logbookId}-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSelectedPhoto(photo)}
              className="break-inside-avoid relative overflow-hidden group rounded-2xl border border-slate-200/40 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm cursor-pointer"
            >
              {/* Hover effect container */}
              <div className="relative overflow-hidden">
                <img
                  src={photo.photoUrl}
                  alt={photo.title}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Photo Description Card */}
              <div className="p-4 space-y-2">
                <span className="inline-flex items-center gap-1 text-[8px] font-extrabold uppercase bg-slate-500/10 text-slate-550 border border-slate-250/20 px-2 py-0.5 rounded-full">
                  <Tag className="h-2.5 w-2.5" />
                  {photo.prokerName.length > 20 ? `${photo.prokerName.slice(0, 20)}...` : photo.prokerName}
                </span>

                <h3 className="text-xs font-black text-slate-850 dark:text-white leading-snug">
                  {photo.title}
                </h3>

                <div className="flex justify-between items-center text-[10px] text-slate-450 dark:text-slate-500 font-semibold pt-2 border-t border-slate-100 dark:border-slate-850">
                  <span className="flex items-center gap-1 truncate max-w-[120px]">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {photo.uploader}
                  </span>
                  <span>{photo.date}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox Pop-up Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl bg-slate-900 border-none rounded-3xl overflow-hidden p-0 gap-0 text-white shadow-2xl">
          {selectedPhoto && (
            <div className="flex flex-col md:flex-row h-full">
              {/* Photo viewport */}
              <div className="flex-1 bg-black flex items-center justify-center p-2 relative min-h-[300px]">
                <img
                  src={selectedPhoto.photoUrl}
                  alt={selectedPhoto.title}
                  className="max-h-[500px] w-full object-contain"
                />
                
                {/* Close Button overlay */}
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 rounded-full hover:bg-black/80 transition-colors border border-white/10"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Sidebar metadata panel */}
              <div className="w-full md:w-80 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10">
                <div className="space-y-4">
                  {/* Category Tag */}
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
                    <Tag className="h-3 w-3" />
                    {selectedPhoto.prokerName.length > 25 ? `${selectedPhoto.prokerName.slice(0, 25)}...` : selectedPhoto.prokerName}
                  </span>

                  <h3 className="text-base font-black leading-snug">
                    {selectedPhoto.title}
                  </h3>

                  {/* Metadata info grid */}
                  <div className="space-y-2 pt-2 border-y border-white/5 py-4 text-xs text-slate-350">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-500" />
                      <span>Oleh: <strong className="text-white">{selectedPhoto.uploader}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span>Tanggal: <strong className="text-white">{selectedPhoto.date}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span>Lokasi: <strong className="text-white">{selectedPhoto.location}</strong></span>
                    </div>
                  </div>

                  {/* Log description */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Deskripsi Kegiatan</span>
                    <p className="text-xs text-slate-350 leading-relaxed">
                      {selectedPhoto.description}
                    </p>
                  </div>
                </div>

                {/* Exporter triggers */}
                <div className="pt-6">
                  <a
                    href={selectedPhoto.photoUrl}
                    download={`dokumentasi_${selectedPhoto.logbookId}.jpg`}
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 text-white font-bold py-2.5 rounded-xl text-xs transition-opacity"
                  >
                    <Download className="h-4 w-4" />
                    <span>Unduh Gambar</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
