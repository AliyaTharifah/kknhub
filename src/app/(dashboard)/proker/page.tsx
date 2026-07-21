"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Briefcase, User, Calendar, CheckCircle2, PlayCircle, HelpCircle, Edit, Plus, Trash2, MapPin, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useLandingStore, Proker } from "@/hooks/useLandingStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Form validation schema
const prokerSchema = zod.object({
  status: zod.enum(["Belum Mulai", "Sedang Berjalan", "Selesai"]),
  progress: zod.number().min(0).max(100),
  name: zod.string().min(1, "Nama Program Kerja wajib diisi"),
  pic: zod.string().min(1, "Nama PIC wajib diisi"),
  deadline: zod.string().min(1, "Tanggal deadline wajib diisi"),
  location: zod.string().optional(),
  description: zod.string().optional(),
  members: zod.string().optional(),
});

type ProkerFormValues = zod.infer<typeof prokerSchema>;

export default function ProkerPage() {
  const { user } = useAuthStore();
  const { prokers, updateProker, addProker, deleteProker } = useLandingStore();

  const isSecretary = user?.role === "Sekretaris";

  const [selectedProker, setSelectedProker] = useState<Proker | null>(null);
  const [detailProker, setDetailProker] = useState<Proker | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Add Proker states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPic, setAddPic] = useState("");
  const [addDeadline, setAddDeadline] = useState("");
  const [addLocation, setAddLocation] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addMembers, setAddMembers] = useState("");

  // Delete Proker states
  const [prokerToDelete, setProkerToDelete] = useState<Proker | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleAddProkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addPic.trim() || !addDeadline.trim()) {
      toast.error("Semua input formulir proker wajib diisi.");
      return;
    }

    addProker({
      name: addName,
      pic: addPic,
      deadline: addDeadline,
      status: "Belum Mulai",
      progress: 0,
      location: addLocation,
      description: addDescription,
      members: addMembers,
    });

    setIsAddDialogOpen(false);
    setAddName("");
    setAddPic("");
    setAddDeadline("");
    setAddLocation("");
    setAddDescription("");
    setAddMembers("");
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProkerFormValues>({
    resolver: zodResolver(prokerSchema),
    defaultValues: {
      status: "Belum Mulai",
      progress: 0,
      name: "",
      pic: "",
      deadline: "",
      location: "",
      description: "",
      members: "",
    },
  });

  const watchedStatus = watch("status");

  const getStatusInfo = (status: Proker["status"]) => {
    switch (status) {
      case "Selesai":
        return {
          label: "Selesai",
          class: "bg-emerald-500/10 text-emerald-500 border-emerald-200/40 dark:border-emerald-800/40",
          icon: CheckCircle2,
          barColor: "bg-emerald-500",
        };
      case "Sedang Berjalan":
        return {
          label: "Berjalan",
          class: "bg-blue-500/10 text-blue-500 border-blue-200/40 dark:border-blue-800/40",
          icon: PlayCircle,
          barColor: "bg-blue-500",
        };
      default:
        return {
          label: "Belum Mulai",
          class: "bg-slate-500/10 text-slate-500 border-slate-200/40 dark:border-slate-800/40",
          icon: HelpCircle,
          barColor: "bg-slate-300 dark:bg-slate-700",
        };
    }
  };

  const openUpdateDialog = (proker: Proker) => {
    setSelectedProker(proker);
    setValue("status", proker.status === "Sedang Berjalan" ? "Sedang Berjalan" : proker.status);
    setValue("progress", proker.progress);
    setValue("name", proker.name);
    setValue("pic", proker.pic);
    setValue("deadline", proker.deadline);
    setValue("location", proker.location || "");
    setValue("description", proker.description || "");
    setValue("members", proker.members || "");
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (proker: Proker) => {
    setProkerToDelete(proker);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (prokerToDelete) {
      deleteProker(prokerToDelete.id);
      setIsDeleteOpen(false);
      setProkerToDelete(null);
    }
  };

  const onStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as Proker["status"];
    setValue("status", val);
    if (val === "Selesai") {
      setValue("progress", 100);
    } else if (val === "Belum Mulai") {
      setValue("progress", 0);
    }
  };

  const onSubmit = (data: ProkerFormValues) => {
    if (!selectedProker) return;
    updateProker(
      selectedProker.id,
      data.progress,
      data.status,
      data.name,
      data.pic,
      data.deadline,
      data.location,
      data.description,
      data.members
    );
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/80 dark:bg-purple-900/30 text-kkn-purple text-xs font-bold uppercase">
            <Briefcase className="h-3.5 w-3.5" />
            <span>Program Kerja</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Program Kerja (Proker) Kelompok
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {isSecretary
              ? "Kelola target pencapaian dan status eksekusi program pemberdayaan masyarakat Desa Sukaluyu."
              : "Pantau realisasi program kerja yang sedang dijalankan oleh kelompok KKN 211."
            }
          </p>
        </div>

        {isSecretary && (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-bold text-white px-5 rounded-xl shadow-md transition-transform hover:scale-102 cursor-pointer flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Proker</span>
          </Button>
        )}
      </div>

      {/* Cards list */}
      {prokers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl text-slate-400">
          <Briefcase className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-700 animate-pulse" />
          <p className="font-bold text-slate-655 dark:text-slate-400">Belum ada program kerja</p>
          <p className="text-xs mt-1 text-slate-405 dark:text-slate-500">Program kerja kelompok KKN Desa Sukaluyu akan tampil di sini setelah ditambahkan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prokers.map((proker) => {
            const statusInfo = getStatusInfo(proker.status);
            const StatusIcon = statusInfo.icon;
            return (
              <motion.div
                key={proker.id}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="relative"
              >
                <Card 
                  onClick={() => setDetailProker(proker)}
                  className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between cursor-pointer"
                >
                  {/* Status indicator line */}
                  <div className={`h-1 w-full ${statusInfo.barColor}`} />

                  <CardContent className="p-6 flex flex-col justify-between flex-grow space-y-4">
                    <div className="space-y-3.5">
                      {/* Badge and Action buttons row */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${statusInfo.class}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusInfo.label}
                        </span>

                        {isSecretary && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openUpdateDialog(proker)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openDeleteDialog(proker)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-white leading-snug">
                        {proker.name}
                      </h3>

                      {/* PIC & Deadline Info */}
                      <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-850 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <User className="h-4 w-4 text-slate-405" />
                          <span className="text-slate-700 dark:text-slate-200">PIC: {proker.pic}</span>
                        </div>
                        {proker.members && (
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <Users className="h-4 w-4 text-slate-405" />
                            <span className="text-slate-700 dark:text-slate-200 truncate">Anggota: {proker.members}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="h-4 w-4 text-slate-405" />
                          <span>Deadline: {proker.deadline}</span>
                        </div>
                        {proker.location && (
                          <div className="flex items-center gap-2 text-xs">
                            <MapPin className="h-4 w-4 text-slate-405" />
                            <span>Lokasi: {proker.location}</span>
                          </div>
                        )}
                        {proker.description && (
                          <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed pt-1.5 border-t border-slate-100/50 dark:border-slate-850/50 line-clamp-2">
                            {proker.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Line */}
                    <div className="pt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>Pencapaian</span>
                        <span className="text-slate-700 dark:text-slate-200">{proker.progress}%</span>
                      </div>
                      <Progress value={proker.progress} className="h-2" />
                      <div className="pt-1 text-right">
                        <span className="text-[11px] font-bold text-kkn-purple hover:underline">
                          Lihat Detail Proker &rarr;
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit/Update Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
              Perbarui Program Kerja KKN
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Ubah rincian target dan progress pengerjaan program kerja Desa Sukaluyu.
            </DialogDescription>
          </DialogHeader>

          {selectedProker && (
            <div className="py-2">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {/* Nama Proker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Nama Program Kerja</label>
                  <input
                    type="text"
                    {...register("name")}
                    className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-855 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                  />
                  {errors.name && (
                    <span className="text-[10px] text-red-450 font-bold block">{errors.name.message}</span>
                  )}
                </div>

                {/* PIC */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">PIC (Penanggung Jawab)</label>
                  <input
                    type="text"
                    {...register("pic")}
                    className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-855 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                  />
                  {errors.pic && (
                    <span className="text-[10px] text-red-450 font-bold block">{errors.pic.message}</span>
                  )}
                </div>

                {/* Deadline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Deadline Tanggal</label>
                  <input
                    type="date"
                    {...register("deadline")}
                    className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-855 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                  />
                  {errors.deadline && (
                    <span className="text-[10px] text-red-455 font-bold block">{errors.deadline.message}</span>
                  )}
                </div>

                {/* Lokasi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Lokasi Kegiatan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Balai RW 02"
                    {...register("location")}
                    className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-855 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                  />
                </div>

                {/* Anggota Terlibat */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Anggota yang Terlibat</label>
                  <input
                    type="text"
                    placeholder="Contoh: Rian, Hadi, Dina"
                    {...register("members")}
                    className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-855 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                  />
                </div>

                {/* Deskripsi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Deskripsi Program Kerja</label>
                  <textarea
                    rows={3}
                    placeholder="Jelaskan detail proker yang dikerjakan..."
                    {...register("description")}
                    className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-855 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none resize-none"
                  />
                </div>

                {/* Status Option */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-305">Status Pengerjaan</label>
                  <select
                    {...register("status")}
                    onChange={onStatusChange}
                    className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-855 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                  >
                    <option value="Belum Mulai">Belum Mulai</option>
                    <option value="Sedang Berjalan">Sedang Berjalan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                {/* Progress score */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-305">Persentase (%)</label>
                    <span className="text-xs font-bold text-kkn-blue">{watch("progress")}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    disabled={watchedStatus === "Selesai" || watchedStatus === "Belum Mulai"}
                    {...register("progress", { valueAsNumber: true })}
                    className="w-full accent-kkn-blue bg-slate-100 dark:bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
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
                    Simpan Perubahan
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Dialog Form */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
              Tambah Program Kerja KKN
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Buat sasaran program kerja pemberdayaan masyarakat posko KKN Desa Sukaluyu.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddProkerSubmit} className="space-y-4 py-2 max-h-[450px] overflow-y-auto pr-1">
            {/* Nama Proker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Nama Program Kerja</label>
              <input
                type="text"
                placeholder="Contoh: Penyuluhan Gizi Balita & Stunting"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
              />
            </div>

            {/* PIC */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Nama PIC (Penanggung Jawab)</label>
              <input
                type="text"
                placeholder="Contoh: Siti Aminah"
                value={addPic}
                onChange={(e) => setAddPic(e.target.value)}
                className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Tanggal Selesai (Deadline)</label>
              <input
                type="date"
                value={addDeadline}
                onChange={(e) => setAddDeadline(e.target.value)}
                className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
              />
            </div>

            {/* Lokasi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Lokasi Pelaksanaan</label>
              <input
                type="text"
                placeholder="Contoh: Posyandu Mawar RW 03"
                value={addLocation}
                onChange={(e) => setAddLocation(e.target.value)}
                className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
              />
            </div>

            {/* Anggota Terlibat */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Anggota yang Terlibat</label>
              <input
                type="text"
                placeholder="Contoh: Aminah, Fathur, Rizky"
                value={addMembers}
                onChange={(e) => setAddMembers(e.target.value)}
                className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
              />
            </div>

            {/* Deskripsi Proker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-655 dark:text-slate-350">Deskripsi Program Kerja</label>
              <textarea
                rows={3}
                placeholder="Rincian tujuan dan metode pelaksanaan..."
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                className="w-full text-sm text-slate-808 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none resize-none"
              />
            </div>

            <DialogFooter className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddDialogOpen(false)}
                className="rounded-xl font-bold border border-slate-250 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-bold text-white rounded-xl shadow-md cursor-pointer"
              >
                Simpan Proker
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
              Hapus Program Kerja?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Program kerja yang dihapus tidak dapat dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl font-bold border border-slate-250 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              className="bg-red-650 hover:bg-red-700 font-bold text-white rounded-xl shadow-md cursor-pointer"
            >
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Read-Only Detail Modal for Proker */}
      <Dialog open={!!detailProker} onOpenChange={(open) => !open && setDetailProker(null)}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              {detailProker && (() => {
                const info = getStatusInfo(detailProker.status);
                const Icon = info.icon;
                return (
                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${info.class}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {info.label}
                  </span>
                );
              })()}
            </div>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              {detailProker?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Detail target & progress pencapaian program kerja posko KKN Desa Sukaluyu.
            </DialogDescription>
          </DialogHeader>

          {detailProker && (
            <div className="space-y-5 py-3">
              {/* Progress Gauge */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-855 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>Realisasi Target Program Kerja</span>
                  <span className="text-kkn-blue font-extrabold text-sm">{detailProker.progress}%</span>
                </div>
                <Progress value={detailProker.progress} className="h-2.5" />
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-855 border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PIC Penanggung Jawab</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                    <User className="h-4 w-4 text-kkn-blue" />
                    <span>{detailProker.pic}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deadline Tanggal</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                    <Calendar className="h-4 w-4 text-kkn-purple" />
                    <span>{detailProker.deadline}</span>
                  </div>
                </div>

                {detailProker.location && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lokasi Pelaksanaan</span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      <span>{detailProker.location}</span>
                    </div>
                  </div>
                )}

                {detailProker.members && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Anggota Terlibat</span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                      <Users className="h-4 w-4 text-amber-500" />
                      <span>{detailProker.members}</span>
                    </div>
                  </div>
                )}
              </div>

              {detailProker.description && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Deskripsi Program Kerja</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-850/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                    {detailProker.description}
                  </p>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  onClick={() => setDetailProker(null)}
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl cursor-pointer"
                >
                  Tutup Detail
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
