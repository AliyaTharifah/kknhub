"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Camera, X, ZoomIn, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLandingStore, GalleryItem } from "@/hooks/useLandingStore";

export default function GalleryPreview() {
  const logbooks = useLandingStore((state) => state.logbooks);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  const items = useMemo(() => {
    const list: GalleryItem[] = [];
    logbooks.forEach((log) => {
      if (log.status === "Selesai" && log.photos) {
        log.photos.forEach((photoUrl, idx) => {
          list.push({
            id: `${log.id}-photo-${idx}`,
            title: log.timeline_title,
            description: log.description,
            imageUrl: photoUrl
          });
        });
      }
    });
    return list;
  }, [logbooks]);

  return (
    <div className="w-full">
      <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/80 dark:bg-orange-900/30 border border-orange-200/40 text-kkn-orange text-xs font-bold uppercase">
          <Camera className="h-3.5 w-3.5" />
          <span>Dokumentasi Kegiatan</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Galeri Aktivitas KKN
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Kumpulan momen pengabdian Kelompok KKN 211
        </p>
      </div>

      {/* Grid Layout */}
      {items.length === 0 ? (
        <div className="text-center py-16 bg-white/5 backdrop-blur-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-450">
          <Camera className="h-10 w-10 mx-auto mb-3 text-slate-350" />
          <p className="font-bold text-slate-600 dark:text-slate-400">Belum ada foto galeri</p>
          <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">Foto dokumentasi kegiatan KKN otomatis terangkum di sini dari logbook yang diselesaikan anggota.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              onClick={() => setSelectedItem(item)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-md aspect-[4/3] sm:aspect-square md:aspect-[4/3]"
            >
              {/* Image Wrap */}
              <div className="relative w-full h-full">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-w-768px) 100vw, 350px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Blur Hover Layer */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform duration-300">
                    <ZoomIn className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Title info overlay bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/80 via-slate-950/50 to-transparent p-4 text-white">
                <h3 className="text-sm font-bold truncate">{item.title}</h3>
                <p className="text-[10px] text-slate-300 truncate mt-0.5">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox Modal Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/90 backdrop-blur-md p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border border-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12">
                {/* Photo Side */}
                <div className="md:col-span-8 relative aspect-[4/3] bg-black">
                  <Image
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    fill
                    sizes="(max-w-768px) 100vw, 800px"
                    className="object-contain"
                  />
                </div>

                {/* Description Side */}
                <div className="md:col-span-4 p-6 flex flex-col justify-between bg-slate-50 dark:bg-slate-900/60 border-l border-slate-100 dark:border-slate-800">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      Dokumentasi Lapangan
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                      {selectedItem.title}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {selectedItem.description}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50 flex items-start gap-2.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    <Info className="h-4 w-4 flex-shrink-0 text-kkn-blue mt-0.5" />
                    <span>Diambil langsung oleh divisi dokumentasi Kelompok KKN 211 Sukaluyu.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
