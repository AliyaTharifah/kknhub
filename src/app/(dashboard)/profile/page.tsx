"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import {
  User,
  Mail,
  Phone,
  Shield,
  FileText,
  Camera,
  Award,
  Upload,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useLandingStore } from "@/hooks/useLandingStore";
import { compressImage } from "@/lib/imageCompressor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const profileSchema = zod.object({
  full_name: zod.string().min(1, "Nama lengkap wajib diisi"),
  phone: zod.string().min(8, "Nomor HP minimal 8 angka").max(15, "Nomor HP maksimal 15 angka"),
});

type ProfileFormValues = zod.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const { logbooks } = useLandingStore();

  const [photoBase64, setPhotoBase64] = useState(user?.photo_url || "");
  const [isCompressing, setIsCompressing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || "",
      phone: user?.phone || "",
    },
  });

  if (!user) return null;

  // Calculate user-specific counts
  const personalLogsCount = logbooks.filter((l) => l.user_id === user.id).length;
  const personalDocsCount = logbooks.filter((l) => l.user_id === user.id && l.status === "Selesai")
    .reduce((acc, curr) => acc + (curr.photos?.length || 0), 0);

  const contributionScore = personalLogsCount * 10 + personalDocsCount * 5;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, 400, 0.6); // smaller dimensions for avatars
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      setSaveError("Gagal memproses gambar avatar.");
    } finally {
      setIsCompressing(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setSaveSuccess(false);
    setSaveError("");

    const result = await updateProfile({
      full_name: data.full_name,
      phone: data.phone,
      photo_url: photoBase64,
    });

    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(result.error || "Gagal memperbarui profil.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header bar */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-900/30 text-kkn-blue text-xs font-bold uppercase">
          <User className="h-3.5 w-3.5" />
          <span>Profil Pengguna</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
          Pengaturan Akun KKN
        </h2>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
          Ubah informasi kontak personal, WhatsApp, pasfoto avatar profil KKN Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Avatar Photo & Stats Card */}
        <div className="md:col-span-4 space-y-6">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center text-center">
            {/* Avatar container */}
            <div className="relative group h-28 w-28 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 bg-slate-100 shadow-inner flex items-center justify-center">
              {photoBase64 ? (
                <img src={photoBase64} alt={user.full_name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold text-slate-400">
                  {user.full_name.slice(0, 2).toUpperCase()}
                </span>
              )}

              {/* Upload trigger overlay */}
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                <Camera className="h-5 w-5" />
                <span className="text-[9px] font-bold mt-1 uppercase">Pilih Foto</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            {isCompressing && (
              <span className="text-[9px] text-kkn-blue font-bold mt-2 animate-pulse">Memproses foto...</span>
            )}

            {/* Name and badge */}
            <h3 className="text-sm font-black text-slate-850 dark:text-white mt-4 leading-tight">
              {user.full_name}
            </h3>
            <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-kkn-purple/20 bg-kkn-purple/10 text-kkn-purple">
              <Shield className="h-3 w-3" />
              {user.role}
            </span>

            <p className="text-[10px] text-slate-400 mt-2">{user.email}</p>
          </Card>

          {/* User statistics summary */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-6 space-y-4 shadow-sm">
            <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Statistik Kontribusi
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850">
                <span className="flex items-center gap-2 text-slate-500">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Total Logbook
                </span>
                <strong className="text-slate-800 dark:text-white">{personalLogsCount} Catatan</strong>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850">
                <span className="flex items-center gap-2 text-slate-500">
                  <Camera className="h-4 w-4 text-slate-400" />
                  Foto Terunggah
                </span>
                <strong className="text-slate-800 dark:text-white">{personalDocsCount} Foto</strong>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="flex items-center gap-2 text-slate-500">
                  <Award className="h-4 w-4 text-kkn-purple" />
                  Poin Keaktifan
                </span>
                <strong className="text-kkn-purple">{contributionScore} Poin</strong>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Editable Profile Form */}
        <div className="md:col-span-8">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-sm p-6 md:p-8">
            <h3 className="text-sm font-extrabold text-slate-850 dark:text-white uppercase tracking-wider mb-6">
              Detail Biodata Diri
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Alert notifications */}
              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-medium"
                >
                  <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>Profil berhasil diperbarui!</span>
                </motion.div>
              )}

              {saveError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium"
                >
                  <User className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>{saveError}</span>
                </motion.div>
              )}

              {/* Readonly Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Alamat Email (Tetap)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full text-sm text-slate-400 bg-slate-100/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2.5 pl-10 pr-4 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Full Name field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Nama Lengkap</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    {...register("full_name")}
                    className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-1 focus:ring-kkn-blue"
                  />
                </div>
                {errors.full_name && (
                  <span className="text-[10px] text-red-400 font-bold block">{errors.full_name.message}</span>
                )}
              </div>

              {/* Phone WhatsApp number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-350">Nomor HP / WhatsApp</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    {...register("phone")}
                    placeholder="+62 8xx-xxxx-xxxx"
                    className="w-full text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 focus:border-kkn-blue rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-1 focus:ring-kkn-blue"
                  />
                </div>
                {errors.phone && (
                  <span className="text-[10px] text-red-400 font-bold block">{errors.phone.message}</span>
                )}
              </div>

              {/* Form buttons */}
              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || isCompressing}
                  className="bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-bold text-white text-xs px-6 py-5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isSubmitting ? "Menyimpan..." : "Simpan Profil"}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
