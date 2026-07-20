"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Calendar as CalendarIcon, Clock, MapPin, User, Trash2, Edit, Plus, CalendarRange, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useLandingStore, TimelineEvent } from "@/hooks/useLandingStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Form validation schema
const timelineSchema = zod
  .object({
    title: zod.string().min(1, "Nama kegiatan wajib diisi"),
    date: zod.string().min(1, "Tanggal wajib diisi"),
    start_time: zod.string().min(1, "Jam mulai wajib diisi"),
    end_time: zod.string().min(1, "Jam selesai wajib diisi"),
    location: zod.string().min(1, "Lokasi wajib diisi"),
    description: zod.string().min(1, "Deskripsi wajib diisi"),
    program_id: zod.string().min(1, "Hubungkan dengan Program Kerja"),
    pic: zod.string().min(1, "PIC wajib diisi"),
    category: zod.enum(["Umum", "Program Kerja", "Kesehatan", "Pendidikan", "Lingkungan"]),
  })
  .refine(
    (data) => {
      if (!data.start_time || !data.end_time) return true;
      const [startH, startM] = data.start_time.split(":").map(Number);
      const [endH, endM] = data.end_time.split(":").map(Number);
      return endH > startH || (endH === startH && endM > startM);
    },
    {
      message: "Jam selesai harus setelah jam mulai",
      path: ["end_time"],
    }
  );

type TimelineFormValues = zod.infer<typeof timelineSchema>;

export default function TimelinePage() {
  const { user } = useAuthStore();
  const { timelineEvents, prokers, addTimelineEvent, updateTimelineEvent, deleteTimelineEvent } = useLandingStore();

  const isSecretary = user?.role === "Sekretaris";

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TimelineFormValues>({
    resolver: zodResolver(timelineSchema),
    defaultValues: {
      title: "",
      date: "",
      start_time: "",
      end_time: "",
      location: "",
      description: "",
      program_id: "",
      pic: "",
      category: "Umum",
    },
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Umum":
        return "bg-blue-500/10 text-blue-500 border-blue-200/40 dark:border-blue-800/40";
      case "Program Kerja":
        return "bg-purple-500/10 text-purple-500 border-purple-200/40 dark:border-purple-800/40";
      case "Kesehatan":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-200/40 dark:border-emerald-800/40";
      case "Pendidikan":
        return "bg-orange-500/10 text-orange-500 border-orange-200/40 dark:border-orange-800/40";
      case "Lingkungan":
        return "bg-teal-500/10 text-teal-500 border-teal-200/40 dark:border-teal-800/40";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-200/40 dark:border-slate-800/40";
    }
  };

  const openAddDialog = () => {
    setEditingEvent(null);
    reset({
      title: "",
      date: "",
      start_time: "",
      end_time: "",
      location: "",
      description: "",
      program_id: prokers[0]?.id || "",
      pic: "",
      category: "Umum",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (event: TimelineEvent) => {
    setEditingEvent(event);
    reset({
      title: event.title,
      date: event.date,
      start_time: event.time.split(" - ")[0] || "",
      end_time: event.time.split(" - ")[1]?.replace(" WIB", "") || "",
      location: event.location || "Sukaluyu",
      description: event.description,
      program_id: prokers.find((p) => event.title.includes(p.name))?.id || prokers[0]?.id || "",
      pic: event.pic || "Mhs KKN",
      category: event.category,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: TimelineFormValues) => {
    const formattedTime = `${data.start_time} - ${data.end_time} WIB`;

    const payload = {
      title: data.title,
      date: data.date,
      time: formattedTime,
      description: data.description,
      category: data.category,
      pic: data.pic,
      location: data.location,
      program_id: data.program_id,
    };

    if (editingEvent) {
      updateTimelineEvent(editingEvent.id, payload);
      toast.success("Agenda berhasil diperbarui!");
    } else {
      addTimelineEvent(payload);
      toast.success("Agenda baru berhasil ditambahkan!");
    }

    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-900/30 text-kkn-blue text-xs font-bold uppercase">
            <CalendarRange className="h-3.5 w-3.5" />
            <span>Timeline</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Timeline & Jadwal KKN
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {isSecretary 
              ? "Kelola semua rincian jadwal kunjungan, kerja bakti, rapat, dan sosialisasi program kelompok."
              : "Lihat agenda kegiatan kelompok KKN 211 Desa Sukaluyu."
            }
          </p>
        </div>

        {isSecretary && (
          <Button
            onClick={openAddDialog}
            className="bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-bold text-white px-5 rounded-xl shadow-md transition-transform hover:scale-102 cursor-pointer flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Agenda</span>
          </Button>
        )}
      </div>

      {/* Timeline items list */}
      <div className="space-y-6">
        {timelineEvents.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="font-bold">Belum ada agenda terdaftar</p>
            <p className="text-xs mt-1">Gunakan tombol di atas untuk menambahkan agenda baru.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-6 pl-6 md:pl-8 space-y-6 py-2">
            {timelineEvents.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div className="absolute -left-[31px] md:-left-[39px] h-5 w-5 rounded-full border-4 border-white dark:border-slate-955 bg-kkn-blue flex items-center justify-center shadow-sm" />

                <Card className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-5 md:p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      {/* Left Info Badges */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getCategoryColor(
                            event.category
                          )}`}
                        >
                          <Tag className="h-3 w-3" />
                          {event.category}
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                          <CalendarIcon className="h-3.5 w-3.5 text-kkn-blue" />
                          {event.date}
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                          <Clock className="h-3.5 w-3.5 text-kkn-purple" />
                          {event.time}
                        </span>
                      </div>

                      {/* Right Admin buttons */}
                      {isSecretary && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditDialog(event)}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              deleteTimelineEvent(event.id);
                              toast.success("Agenda berhasil dihapus!");
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white">
                      {event.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                      {event.description}
                    </p>

                    {/* Info rows (PIC & Location) */}
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-slate-850 text-slate-500 dark:text-slate-400">
                      {event.pic && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <User className="h-4 w-4 text-slate-400" />
                          <span>PIC: {event.pic}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span>Lokasi: {event.location}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
              {editingEvent ? "Edit Agenda Kegiatan" : "Tambah Agenda KKN Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Isi formulir berikut secara lengkap. Semua data akan disinkronisasikan ke timeline kelompok.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Nama Kegiatan</label>
              <input
                type="text"
                placeholder="Contoh: Rapat Koordinasi Posyandu"
                {...register("title")}
                className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
              />
              {errors.title && (
                <span className="text-[10px] text-red-400 font-bold block">{errors.title.message}</span>
              )}
            </div>

            {/* Date and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Tanggal</label>
                <input
                  type="date"
                  {...register("date")}
                  className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                />
                {errors.date && (
                  <span className="text-[10px] text-red-400 font-bold block">{errors.date.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Kategori</label>
                <select
                  {...register("category")}
                  className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                >
                  <option value="Umum">Umum</option>
                  <option value="Program Kerja">Program Kerja</option>
                  <option value="Kesehatan">Kesehatan</option>
                  <option value="Pendidikan">Pendidikan</option>
                  <option value="Lingkungan">Lingkungan</option>
                </select>
              </div>
            </div>

            {/* Start and End Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Jam Mulai</label>
                <input
                  type="time"
                  {...register("start_time")}
                  className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                />
                {errors.start_time && (
                  <span className="text-[10px] text-red-400 font-bold block">{errors.start_time.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Jam Selesai</label>
                <input
                  type="time"
                  {...register("end_time")}
                  className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                />
                {errors.end_time && (
                  <span className="text-[10px] text-red-400 font-bold block">{errors.end_time.message}</span>
                )}
              </div>
            </div>

            {/* PIC & Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Penanggung Jawab (PIC)</label>
                <input
                  type="text"
                  placeholder="Nama Penanggung Jawab"
                  {...register("pic")}
                  className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                />
                {errors.pic && (
                  <span className="text-[10px] text-red-400 font-bold block">{errors.pic.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Lokasi Pos</label>
                <input
                  type="text"
                  placeholder="Contoh: Balai RW 02"
                  {...register("location")}
                  className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                />
                {errors.location && (
                  <span className="text-[10px] text-red-400 font-bold block">{errors.location.message}</span>
                )}
              </div>
            </div>

            {/* Associated Program Kerja */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Hubungkan Program Kerja</label>
              <select
                {...register("program_id")}
                className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
              >
                {prokers.map((proker) => (
                  <option key={proker.id} value={proker.id}>
                    {proker.name}
                  </option>
                ))}
              </select>
              {errors.program_id && (
                <span className="text-[10px] text-red-400 font-bold block">{errors.program_id.message}</span>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Deskripsi Kegiatan</label>
              <textarea
                rows={3}
                placeholder="Rincian mengenai jalannya agenda kegiatan..."
                {...register("description")}
                className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none resize-none"
              />
              {errors.description && (
                <span className="text-[10px] text-red-400 font-bold block">{errors.description.message}</span>
              )}
            </div>

            <DialogFooter className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl font-bold border border-slate-250 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-bold text-white rounded-xl shadow-md cursor-pointer"
              >
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
