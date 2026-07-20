"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/hooks/useAuthStore";
import { isSandboxMode } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const loginSchema = zod.object({
  email: zod.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: zod.string().min(5, "Password minimal 5 karakter"),
});

type LoginForm = zod.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, initializeAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize and check current session
  useEffect(() => {
    initializeAuth().then(() => {
      if (user) {
        const redirectTo = searchParams.get("redirect") || "/dashboard";
        router.push(redirectTo);
      }
    });
  }, [user, initializeAuth, router, searchParams]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setErrorMessage("");
    setIsSubmitting(true);
    const result = await login(data.email, data.password);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Berhasil masuk posko KKN!");
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      router.push(redirectTo);
    } else {
      setErrorMessage(result.error || "Email atau password salah.");
    }
  };

  const fillMockCredentials = (role: "sekretaris" | "anggota") => {
    if (role === "sekretaris") {
      setValue("email", "sekretaris@kkn211.com");
      setValue("password", "password123");
    } else {
      setValue("email", "anggota@kkn211.com");
      setValue("password", "password123");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl border border-white/10 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative animate-in"
    >
      {/* Branding header */}
      <div className="flex flex-col items-center text-center space-y-3 mb-8">
        <Link href="/" className="flex items-center gap-2 group mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-kkn-blue to-kkn-purple flex items-center justify-center shadow-md shadow-blue-500/25">
            <span className="text-white font-extrabold text-xl tracking-tight">K</span>
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-kkn-blue to-kkn-purple bg-clip-text text-transparent">
            KKNHub
          </span>
        </Link>
        <h2 className="text-lg font-bold text-white tracking-tight">Selamat Datang Kembali</h2>
        <p className="text-xs text-slate-400 max-w-xs">
          Masuk untuk mengelola seluruh agenda logbook, timeline, dan program kerja KKN Anda.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Error message */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium"
          >
            <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Email field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Email</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              placeholder="nama@email.com"
              {...register("email")}
              className="w-full text-sm text-white placeholder-slate-500 bg-slate-800/40 focus:bg-slate-800/80 border border-slate-700/60 focus:border-kkn-blue rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all focus:ring-1 focus:ring-kkn-blue"
            />
          </div>
          {errors.email && (
            <span className="text-[10px] text-red-400 font-bold block">{errors.email.message}</span>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">Password</label>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••"
              {...register("password")}
              className="w-full text-sm text-white placeholder-slate-500 bg-slate-800/40 focus:bg-slate-800/80 border border-slate-700/60 focus:border-kkn-blue rounded-xl py-2.5 pl-10 pr-10 outline-none transition-all focus:ring-1 focus:ring-kkn-blue"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <span className="text-[10px] text-red-400 font-bold block">{errors.password.message}</span>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-bold text-white py-6 rounded-xl shadow-lg mt-4 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          {isSubmitting ? "Memproses..." : "Masuk"}
        </Button>

      </form>

      {/* Sandbox credentials helpers */}
      {isSandboxMode && (
        <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase text-kkn-yellow tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gunakan Akun Simulasi</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Aplikasi berjalan dalam mode demo offline (tanpa koneksi Supabase). Pilih role untuk menguji hak akses:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillMockCredentials("sekretaris")}
              className="text-[10px] font-bold py-2 px-3 border border-slate-700 hover:border-slate-500 rounded-lg text-slate-300 text-left bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
            >
              🔑 Sekretaris
              <span className="block text-[8px] text-slate-500 font-medium">Full Access</span>
            </button>
            <button
              type="button"
              onClick={() => fillMockCredentials("anggota")}
              className="text-[10px] font-bold py-2 px-3 border border-slate-700 hover:border-slate-500 rounded-lg text-slate-300 text-left bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
            >
              👤 Anggota KKN
              <span className="block text-[8px] text-slate-500 font-medium">Limited Access</span>
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative p-4 overflow-hidden bg-gradient-to-tr from-slate-900 via-slate-955 to-indigo-955/80">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-1/10 left-1/10 w-80 h-80 bg-blue-600/10 rounded-full filter blur-3xl -z-10" />
      <div className="absolute bottom-1/10 right-1/10 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl -z-10" />
      
      <Suspense fallback={
        <div className="w-full max-w-md bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl border border-white/10 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center space-y-4 min-h-[300px]">
          <div className="h-8 w-8 border-4 border-t-kkn-blue border-slate-700 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-semibold tracking-wider">Menyiapkan Halaman Masuk...</span>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
