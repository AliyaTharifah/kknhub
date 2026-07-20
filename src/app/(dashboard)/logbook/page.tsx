"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import {
  FileText,
  Search,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Edit,
  CheckCircle,
  HelpCircle,
  Filter,
  ArrowUpDown,
  Upload,
  X,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useLandingStore, LogbookEntry } from "@/hooks/useLandingStore";
import { compressImage } from "@/lib/imageCompressor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Form validation schema
const logbookSchema = zod
  .object({
    date: zod
      .string()
      .min(1, "Tanggal wajib diisi")
      .refine((dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(dateStr);
        selectedDate.setHours(0, 0, 0, 0);
        return selectedDate <= today;
      }, "Tanggal tidak boleh melebihi hari ini"),
    start_time: zod.string().min(1, "Jam mulai wajib diisi"),
    end_time: zod.string().min(1, "Jam selesai wajib diisi"),
    timeline_id: zod.string().min(1, "Pilih agenda kegiatan terkait"),
    description: zod.string().min(10, "Deskripsi kegiatan minimal 10 karakter"),
    location: zod.string().min(1, "Lokasi kegiatan wajib diisi"),
    status: zod.enum(["Draft", "Selesai"]),
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

type LogbookFormValues = zod.infer<typeof logbookSchema>;

export default function LogbookPage() {
  const { user } = useAuthStore();
  const { logbooks, timelineEvents, addLogbook, updateLogbook, deleteLogbook } = useLandingStore();

  const isSecretary = user?.role === "Sekretaris";

  // List State Filter/Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Draft" | "Selesai">("All");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Dialog Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLogbook, setEditingLogbook] = useState<LogbookEntry | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LogbookFormValues>({
    resolver: zodResolver(logbookSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      start_time: "",
      end_time: "",
      timeline_id: "",
      description: "",
      location: "",
      status: "Draft",
    },
  });

  // Filtering logs
  const filteredLogbooks = useMemo(() => {
    let result = [...logbooks];

    // Anggota can only view their own logs
    if (!isSecretary && user) {
      result = result.filter((log) => log.user_id === user.id);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (log) =>
          log.description.toLowerCase().includes(q) ||
          log.location.toLowerCase().includes(q) ||
          log.user_name.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter((log) => log.status === statusFilter);
    }

    // Sort order
    result.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.start_time}`);
      const dateB = new Date(`${b.date}T${b.start_time}`);
      return sortOrder === "desc" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

    return result;
  }, [logbooks, search, statusFilter, sortOrder, isSecretary, user]);

  // Paginated elements
  const paginatedLogs = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredLogbooks.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredLogbooks, currentPage]);

  const totalPages = Math.ceil(filteredLogbooks.length / itemsPerPage);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError("");
    const files = e.target.files;
    if (!files) return;

    if (uploadedPhotos.length + files.length > 3) {
      setPhotoError("Maksimal unggah 3 foto dokumentasi.");
      return;
    }

    setIsCompressing(true);
    const newBase64s: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Client-side image compression
        const compressedFile = await compressImage(file);
        
        // Convert Blob/File to base64 for local client storage simulation
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
        });
        reader.readAsDataURL(compressedFile);
        const base64String = await base64Promise;
        newBase64s.push(base64String);
      }
      setUploadedPhotos((prev) => [...prev, ...newBase64s]);
    } catch {
      setPhotoError("Gagal mengompres gambar.");
    } finally {
      setIsCompressing(false);
    }
  };

  const removePhoto = (idx: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const openAddDialog = () => {
    setEditingLogbook(null);
    setUploadedPhotos([]);
    setPhotoError("");
    reset({
      date: new Date().toISOString().split("T")[0],
      start_time: "",
      end_time: "",
      timeline_id: timelineEvents[0]?.id || "",
      description: "",
      location: "",
      status: "Draft",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (log: LogbookEntry) => {
    setEditingLogbook(log);
    setUploadedPhotos(log.photos || []);
    setPhotoError("");
    reset({
      date: log.date,
      start_time: log.start_time,
      end_time: log.end_time,
      timeline_id: log.timeline_id,
      description: log.description,
      location: log.location,
      status: log.status,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: LogbookFormValues) => {
    setPhotoError("");

    // Photo is mandatory if status is Selesai
    if (data.status === "Selesai" && uploadedPhotos.length === 0) {
      setPhotoError("Foto dokumentasi wajib diunggah jika status kegiatan Selesai.");
      return;
    }

    const matchedTimeline = timelineEvents.find((t) => t.id === data.timeline_id);
    const timelineTitle = matchedTimeline ? matchedTimeline.title : "Kegiatan Mandiri";

    const payload = {
      user_id: user?.id || "mock-uuid-anggota",
      user_name: user?.full_name || "Fathur Rahman",
      timeline_id: data.timeline_id,
      timeline_title: timelineTitle,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      description: data.description,
      location: data.location,
      status: data.status,
      photos: uploadedPhotos,
    };

    if (editingLogbook) {
      updateLogbook(editingLogbook.id, payload);
      toast.success("Logbook berhasil diperbarui!");
    } else {
      addLogbook(payload);
      toast.success("Logbook harian berhasil ditambahkan!");
    }

    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-900/30 text-kkn-blue text-xs font-bold uppercase">
            <FileText className="h-3.5 w-3.5" />
            <span>Logbook Harian</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Pencatatan Logbook Kegiatan
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {isSecretary
              ? "Pantau dan kelola seluruh logbook pengabdian kelompok 211 Desa Sukaluyu."
              : "Catat setiap aktivitas KKN harian Anda secara teratur dan unggah bukti dokumentasi."
            }
          </p>
        </div>

        <Button
          onClick={openAddDialog}
          className="bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-bold text-white px-5 rounded-xl shadow-md transition-transform hover:scale-102 cursor-pointer flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Isi Logbook</span>
        </Button>
      </div>

      {/* Filter and Search Action Row */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-4 rounded-2xl shadow-sm">
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Cari deskripsi kegiatan atau lokasi..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs md:text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800/80 rounded-xl py-2 pl-10 pr-4 outline-none focus:border-kkn-blue"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "All" | "Draft" | "Selesai");
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 outline-none text-xs"
            >
              <option value="All">Semua Status</option>
              <option value="Draft">Draft</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          {/* Sort button */}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="text-xs font-bold text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl"
          >
            <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
            <span>Urut: {sortOrder === "desc" ? "Terbaru" : "Terlama"}</span>
          </Button>
        </div>
      </div>

      {/* Logbook Grid List Cards */}
      <div className="space-y-4">
        {paginatedLogs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
            <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="font-bold">Belum ada catatan logbook</p>
            <p className="text-xs mt-1">Gunakan tombol Isi Logbook untuk mencatat aktivitas baru.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedLogs.map((log) => (
              <motion.div key={log.id} layout>
                <Card className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-5 md:p-6 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        {/* Title and user meta row */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-800 dark:text-white leading-tight">
                            {log.timeline_title}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                              log.status === "Selesai"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-200/40"
                                : "bg-slate-500/10 text-slate-500 border-slate-200/40"
                            }`}
                          >
                            {log.status === "Selesai" ? <CheckCircle className="h-3 w-3" /> : <HelpCircle className="h-3 w-3" />}
                            {log.status}
                          </span>
                        </div>
                        {isSecretary && (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            Oleh: {log.user_name}
                          </span>
                        )}
                      </div>

                      {/* Action buttons (only owner can modify) */}
                      {log.user_id === user?.id && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditDialog(log)}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              deleteLogbook(log.id);
                              toast.success("Logbook berhasil dihapus!");
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-350 leading-relaxed max-w-4xl">
                      {log.description}
                    </p>

                    {/* Image documentation display row */}
                    {log.photos && log.photos.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto py-1">
                        {log.photos.map((photo, i) => (
                          <div key={i} className="relative h-20 w-28 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0">
                            <img src={photo} alt="Dokumentasi KKN" className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Meta info bottom row */}
                    <div className="flex flex-wrap gap-4 pt-3.5 border-t border-slate-100 dark:border-slate-850 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-slate-450" />
                        <span>{log.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-slate-450" />
                        <span>{log.start_time} - {log.end_time} WIB</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-slate-450" />
                        <span>{log.location}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination component */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
            className="rounded-xl px-3 py-1.5 text-xs cursor-pointer border-slate-200 dark:border-slate-800 disabled:opacity-50"
          >
            Sebelumnya
          </Button>
          <span className="text-xs text-slate-500 font-semibold">
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
            className="rounded-xl px-3 py-1.5 text-xs cursor-pointer border-slate-200 dark:border-slate-800 disabled:opacity-50"
          >
            Berikutnya
          </Button>
        </div>
      )}

      {/* Submission dialog modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
              {editingLogbook ? "Edit Catatan Logbook" : "Isi Logbook Harian KKN"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Isi data aktivitas KKN harian Anda secara akurat. Data berstatus selesai wajib disertai minimal 1 foto.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1 max-h-[460px] overflow-y-auto pr-1">
            {/* Timeline dropdown picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Hubungkan Kegiatan Agenda</label>
              <select
                {...register("timeline_id")}
                className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
              >
                <option value="">Pilih Agenda Kegiatan</option>
                {timelineEvents.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.date})
                  </option>
                ))}
              </select>
              {errors.timeline_id && (
                <span className="text-[10px] text-red-400 font-bold block">{errors.timeline_id.message}</span>
              )}
            </div>

            {/* Date and Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Tanggal Pelaksanaan</label>
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
                <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Lokasi Posko</label>
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

            {/* Start and End Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Jam Mulai</label>
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
                <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Jam Selesai</label>
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

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Deskripsi Kegiatan</label>
              <textarea
                rows={3}
                placeholder="Rincikan mengenai aktivitas yang telah Anda jalankan secara detail..."
                {...register("description")}
                className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none resize-none"
              />
              {errors.description && (
                <span className="text-[10px] text-red-400 font-bold block">{errors.description.message}</span>
              )}
            </div>

            {/* Photo Uploader Component with local compression */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Unggah Dokumentasi (Maks 3)</label>
                <span className="text-[10px] font-bold text-slate-400">Terunggah: {uploadedPhotos.length}/3</span>
              </div>

              {/* Photo selector area */}
              <div className="grid grid-cols-4 gap-2">
                {uploadedPhotos.map((photo, index) => (
                  <div key={index} className="relative h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img src={photo} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full hover:bg-black/75"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {uploadedPhotos.length < 3 && (
                  <label className="h-16 flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-850 text-slate-400 hover:text-slate-650 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-[8px] font-bold mt-1 uppercase">Pilih</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      disabled={isCompressing}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              {isCompressing && (
                <div className="text-[10px] font-semibold text-kkn-blue flex items-center gap-1">
                  <Sparkles className="h-3 w-3 animate-spin" />
                  <span>Mengompres gambar agar hemat bandwidth...</span>
                </div>
              )}
              {photoError && (
                <span className="text-[10px] text-red-400 font-bold block">{photoError}</span>
              )}
            </div>

            {/* Status Option */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Status Kegiatan</label>
              <select
                {...register("status")}
                className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
              >
                <option value="Draft">Draft (Bisa diubah/hapus)</option>
                <option value="Selesai">Selesai (Kunci catatan)</option>
              </select>
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
                disabled={isCompressing}
                className="bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-bold text-white rounded-xl shadow-md cursor-pointer"
              >
                Simpan Logbook
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
