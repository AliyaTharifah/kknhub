"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import {
  ScrollText,
  Search,
  Plus,
  Trash2,
  Edit,
  Calendar,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useLandingStore, NotulenItem } from "@/hooks/useLandingStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const notulenSchema = zod.object({
  title: zod.string().min(1, "Judul rapat wajib diisi"),
  date: zod.string().min(1, "Tanggal rapat wajib diisi"),
  time: zod.string().min(1, "Waktu rapat wajib diisi (contoh: 19:00 - 21:00)"),
  location: zod.string().min(1, "Lokasi rapat wajib diisi"),
  attendees: zod.string().min(1, "Daftar peserta wajib diisi"),
  agenda: zod.string().min(5, "Agenda rapat minimal 5 karakter"),
  results: zod.string().min(5, "Hasil diskusi minimal 5 karakter"),
  decisions: zod.string().min(5, "Keputusan rapat minimal 5 karakter"),
  actions: zod.string().min(5, "Tindak lanjut rapat minimal 5 karakter"),
});

type NotulenFormValues = zod.infer<typeof notulenSchema>;

export default function NotulenPage() {
  const { user } = useAuthStore();
  const { notulen, addNotulen, updateNotulen, deleteNotulen } = useLandingStore();

  const isSecretary = user?.role === "Sekretaris";

  const [search, setSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState<NotulenItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NotulenItem | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NotulenFormValues>({
    resolver: zodResolver(notulenSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      location: "",
      attendees: "",
      agenda: "",
      results: "",
      decisions: "",
      actions: "",
    },
  });

  const filteredNotes = useMemo(() => {
    return notulen.filter(
      (note) =>
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.agenda.toLowerCase().includes(search.toLowerCase()) ||
        note.attendees.toLowerCase().includes(search.toLowerCase())
    );
  }, [notulen, search]);



  const openAddDialog = () => {
    setEditingNote(null);
    reset({
      title: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      location: "",
      attendees: "",
      agenda: "",
      results: "",
      decisions: "",
      actions: "",
    });
    setIsFormOpen(true);
  };

  const openEditDialog = (e: React.MouseEvent, note: NotulenItem) => {
    e.stopPropagation(); // Avoid triggering details modal click!
    setEditingNote(note);
    reset({
      title: note.title,
      date: note.date,
      time: note.time,
      location: note.location,
      attendees: note.attendees,
      agenda: note.agenda,
      results: note.results,
      decisions: note.decisions,
      actions: note.actions,
    });
    setIsFormOpen(true);
  };

  const openDetails = (note: NotulenItem) => {
    setSelectedNote(note);
    setIsDetailOpen(true);
  };

  const onSubmit = (data: NotulenFormValues) => {
    const payload = {
      title: data.title,
      date: data.date,
      time: data.time.includes("WIB") ? data.time : `${data.time} WIB`,
      location: data.location,
      attendees: data.attendees,
      agenda: data.agenda,
      results: data.results,
      decisions: data.decisions,
      actions: data.actions,
    };

    if (editingNote) {
      updateNotulen(editingNote.id, payload);
    } else {
      addNotulen(payload);
    }

    setIsFormOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-900/30 text-kkn-blue text-xs font-bold uppercase">
            <ScrollText className="h-3.5 w-3.5" />
            <span>Notulen Rapat</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Notulensi Rapat Posko KKN
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {isSecretary
              ? "Catat, edit, dan bagikan ringkasan hasil rapat, daftar keputusan, serta rencana tindak lanjut kelompok."
              : "Lihat hasil diskusi rapat koordinasi mingguan KKN 211 Desa Sukaluyu."
            }
          </p>
        </div>

        {isSecretary && (
          <Button
            onClick={openAddDialog}
            className="bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-bold text-white px-5 rounded-xl shadow-md transition-transform hover:scale-102 cursor-pointer flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Notulen</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Action Row */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm">
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari notulen berdasarkan judul rapat, agenda, atau peserta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs md:text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2 pl-10 pr-4 outline-none focus:border-kkn-blue"
          />
        </div>
      </div>

      {/* Cards list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-3xl text-slate-400">
            <ScrollText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="font-bold">Belum ada notulen rapat</p>
            <p className="text-xs mt-1">Tekan tombol Tambah Notulen untuk mencatat rapat pertama.</p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              whileHover={{ y: -5 }}
              onClick={() => openDetails(note)}
              className="cursor-pointer relative"
            >
              <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  {/* Category badging and actions */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-kkn-blue/20 bg-kkn-blue/10 text-kkn-blue">
                      <Users className="h-3 w-3" />
                      Rapat Koordinasi
                    </span>

                    {isSecretary && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => openEditDialog(e, note)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-105 dark:hover:bg-slate-850 transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotulen(note.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm md:text-base font-black text-slate-805 dark:text-white leading-snug truncate">
                    {note.title}
                  </h3>

                  {/* Agenda summary snippet */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {note.agenda}
                  </p>

                  {/* Date, Time & Location row */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-850 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{note.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{note.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{note.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Form Dialog Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
              {editingNote ? "Perbarui Notulen Rapat" : "Catat Notulen Rapat Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Isi data detail agenda rapat posko dan poin-poin keputusan yang dihasilkan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1 max-h-[460px] overflow-y-auto pr-1">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-350">Judul Rapat</label>
              <input
                type="text"
                placeholder="Contoh: Rapat Evaluasi Minggu ke-2"
                {...register("title")}
                className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
              />
              {errors.title && (
                <span className="text-[10px] text-red-400 font-bold block">{errors.title.message}</span>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Tanggal Rapat</label>
                <input
                  type="date"
                  {...register("date")}
                  className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                />
                {errors.date && (
                  <span className="text-[10px] text-red-400 font-bold block">{errors.date.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Waktu (Jam)</label>
                <input
                  type="text"
                  placeholder="Contoh: 19:30 - 21:00"
                  {...register("time")}
                  className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                />
                {errors.time && (
                  <span className="text-[10px] text-red-400 font-bold block">{errors.time.message}</span>
                )}
              </div>
            </div>

            {/* Location & Attendees */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Lokasi Rapat</label>
              <input
                type="text"
                placeholder="Contoh: Posko KKN 211 / Balai Desa"
                {...register("location")}
                className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
              />
              {errors.location && (
                <span className="text-[10px] text-red-400 font-bold block">{errors.location.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Peserta Rapat</label>
              <textarea
                rows={2}
                placeholder="Aliya, Fathur, Rian, Kades Sukaluyu (pisahkan dengan koma)"
                {...register("attendees")}
                className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none resize-none"
              />
              {errors.attendees && (
                <span className="text-[10px] text-red-400 font-bold block">{errors.attendees.message}</span>
              )}
            </div>

            {/* Agenda & Results */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Agenda Rapat</label>
              <textarea
                rows={2}
                placeholder="Pembahasan mengenai..."
                {...register("agenda")}
                className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none resize-none"
              />
              {errors.agenda && (
                <span className="text-[10px] text-red-400 font-bold block">{errors.agenda.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Hasil Diskusi</label>
              <textarea
                rows={3}
                placeholder="Pembahasan detail hasil rapat..."
                {...register("results")}
                className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none resize-none"
              />
              {errors.results && (
                <span className="text-[10px] text-red-400 font-bold block">{errors.results.message}</span>
              )}
            </div>

            {/* Decisions & Action Items */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Keputusan Hasil Rapat</label>
              <textarea
                rows={3}
                placeholder="1. Menyepakati kegiatan A..."
                {...register("decisions")}
                className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none resize-none"
              />
              {errors.decisions && (
                <span className="text-[10px] text-red-400 font-bold block">{errors.decisions.message}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Tindak Lanjut & Pembagian Tugas (Action Items)</label>
              <textarea
                rows={2}
                placeholder="Aliya menyusun TOR, Fathur membuat website..."
                {...register("actions")}
                className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none resize-none"
              />
              {errors.actions && (
                <span className="text-[10px] text-red-400 font-bold block">{errors.actions.message}</span>
              )}
            </div>

            <DialogFooter className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                className="rounded-xl font-bold border border-slate-250 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-bold text-white rounded-xl shadow-md cursor-pointer"
              >
                Simpan Notulen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details View Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          {selectedNote && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-kkn-blue/20 bg-kkn-blue/10 text-kkn-blue">
                    <Users className="h-3 w-3" />
                    Notulen Rapat Resmi
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{selectedNote.date}</span>
                </div>
                <DialogTitle className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
                  {selectedNote.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Berikut merupakan lembar hasil rapat koordinasi resmi kelompok KKN 211 Desa Sukaluyu.
                </DialogDescription>
              </DialogHeader>

              {/* Detail meta row */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Waktu</span>
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-white">
                    <Clock className="h-3.5 w-3.5 text-kkn-purple" />
                    <span>{selectedNote.time}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Lokasi Rapat</span>
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-white">
                    <MapPin className="h-3.5 w-3.5 text-kkn-blue" />
                    <span className="truncate">{selectedNote.location}</span>
                  </div>
                </div>
                <div className="space-y-1 col-span-1">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Peserta Rapat</span>
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-white">
                    <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate" title={selectedNote.attendees}>
                      {selectedNote.attendees.split(",").length} Anggota
                    </span>
                  </div>
                </div>
              </div>

              {/* Main notes segments */}
              <div className="space-y-5 text-xs md:text-sm text-slate-650 dark:text-slate-350 max-h-[300px] overflow-y-auto pr-1">
                {/* 1. Attendees list detail */}
                <div className="space-y-1 pt-1.5">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Daftar Peserta
                  </h4>
                  <p className="leading-relaxed bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 text-slate-500 font-medium">
                    {selectedNote.attendees}
                  </p>
                </div>

                {/* 2. Agenda */}
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Agenda Utama Rapat
                  </h4>
                  <p className="leading-relaxed whitespace-pre-wrap">{selectedNote.agenda}</p>
                </div>

                {/* 3. Discussion Results */}
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Hasil Diskusi & Pembahasan
                  </h4>
                  <p className="leading-relaxed whitespace-pre-wrap">{selectedNote.results}</p>
                </div>

                {/* 4. Decisions */}
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-emerald-500">
                    Keputusan Rapat
                  </h4>
                  <p className="leading-relaxed whitespace-pre-wrap bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl">
                    {selectedNote.decisions}
                  </p>
                </div>

                {/* 5. Action Items */}
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-kkn-blue">
                    Tindak Lanjut & Pembagian Tugas (Action Items)
                  </h4>
                  <p className="leading-relaxed whitespace-pre-wrap bg-blue-500/5 border border-blue-500/10 p-3 rounded-2xl">
                    {selectedNote.actions}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Tutup Notulensi
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
