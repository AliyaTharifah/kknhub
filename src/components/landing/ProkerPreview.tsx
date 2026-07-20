"use client";

import Link from "next/link";
import { User, Calendar, Award, CheckCircle2, PlayCircle, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLandingStore, Proker } from "@/hooks/useLandingStore";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function ProkerPreview() {
  const prokers = useLandingStore((state) => state.prokers);

  const getStatusBadge = (status: Proker["status"]) => {
    switch (status) {
      case "Selesai":
        return {
          label: "Selesai",
          class: "bg-emerald-500/10 text-emerald-500 border-emerald-200/40 dark:border-emerald-800/40",
          icon: CheckCircle2,
        };
      case "Sedang Berjalan":
        return {
          label: "Berjalan",
          class: "bg-blue-500/10 text-blue-500 border-blue-200/40 dark:border-blue-800/40",
          icon: PlayCircle,
        };
      default:
        return {
          label: "Belum Mulai",
          class: "bg-slate-500/10 text-slate-500 border-slate-200/40 dark:border-slate-800/40",
          icon: HelpCircle,
        };
    }
  };

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  } as const;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  } as const;

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Program Kerja Utama
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg">
            Daftar inisiatif pembangunan, edukasi, dan pemberdayaan yang sedang dan telah dijalankan oleh Kelompok 211.
          </p>
        </div>
        <Link
          href="/proker"
          className={buttonVariants({
            variant: "outline",
            className: "mt-4 md:mt-0 font-bold rounded-xl border-slate-200 hover:bg-slate-100/50 dark:border-slate-800 dark:hover:bg-slate-800/50 flex items-center gap-2",
          })}
        >
          <span>Detail Semua Proker</span>
        </Link>
      </div>

      {prokers.length === 0 ? (
        <div className="text-center py-16 bg-white/5 backdrop-blur-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-450">
          <Award className="h-10 w-10 mx-auto mb-3 text-slate-350" />
          <p className="font-bold text-slate-600 dark:text-slate-400">Belum ada program kerja</p>
          <p className="text-xs mt-1 text-slate-450 dark:text-slate-500">Program kerja kelompok KKN Desa Sukaluyu akan tampil di sini setelah ditambahkan oleh Sekretaris.</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {prokers.map((proker) => {
            const statusInfo = getStatusBadge(proker.status);
            const StatusIcon = statusInfo.icon;
            return (
              <motion.div
                key={proker.id}
                variants={cardVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="glass-panel rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300"
              >
                {/* Decorative top indicator bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    proker.status === "Selesai"
                      ? "bg-emerald-500"
                      : proker.status === "Sedang Berjalan"
                      ? "bg-blue-500"
                      : "bg-slate-300 dark:bg-slate-700"
                  }`}
                />

                <div className="space-y-4">
                  {/* Status Badges */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${statusInfo.class}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </span>
                    
                    {proker.status === "Selesai" && (
                      <Award className="h-4.5 w-4.5 text-emerald-500" />
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug min-h-[50px]">
                    {proker.name}
                  </h3>

                  {/* Info Fields */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2 text-xs">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        PIC: {proker.pic}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>Target: {proker.deadline}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Area */}
                <div className="mt-6 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Penyelesaian</span>
                    <span className="text-slate-700 dark:text-slate-200">{proker.progress}%</span>
                  </div>
                  <Progress value={proker.progress} className="h-2 rounded-full" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
