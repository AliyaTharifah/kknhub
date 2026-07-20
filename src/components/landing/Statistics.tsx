"use client";

import { useEffect, useState, useRef } from "react";
import { Users, Briefcase, FileText, Camera, BarChart3 } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useLandingStore } from "@/hooks/useLandingStore";

function CountUp({ end, suffix = "", duration = 1000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    
    let start = 0;
    const endValue = end;
    if (endValue === 0) return;

    const stepTime = Math.max(Math.floor(duration / endValue), 10);
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= endValue) {
        clearInterval(timer);
        setCount(endValue);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [end, duration, isInView]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function Statistics() {
  const { totalMembers, totalLogbooks, totalDocs, prokers, getAverageProgress } = useLandingStore();
  const averageProgress = getAverageProgress();

  const stats = [
    {
      label: "Total Anggota",
      value: totalMembers,
      suffix: " Mhs",
      icon: Users,
      color: "from-blue-500/10 to-indigo-500/10 text-blue-500",
      description: "Anggota aktif kelompok 211",
    },
    {
      label: "Program Kerja",
      value: prokers.length,
      suffix: " Proker",
      icon: Briefcase,
      color: "from-purple-500/10 to-pink-500/10 text-purple-500",
      description: "Rencana program utama desa",
    },
    {
      label: "Total Logbook",
      value: totalLogbooks,
      suffix: " Laporan",
      icon: FileText,
      color: "from-emerald-500/10 to-teal-500/10 text-emerald-500",
      description: "Catatan kegiatan harian",
    },
    {
      label: "Dokumentasi",
      value: totalDocs,
      suffix: " Foto",
      icon: Camera,
      color: "from-amber-500/10 to-orange-500/10 text-orange-500",
      description: "Foto kegiatan lapangan",
    },
    {
      label: "Progress KKN",
      value: averageProgress,
      suffix: "%",
      icon: BarChart3,
      color: "from-rose-500/10 to-red-500/10 text-rose-500",
      description: "Rata-rata kesiapan proker",
    },
  ];

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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
      >
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              variants={cardVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`glass-panel rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 ${
                idx === 4 ? "col-span-2 md:col-span-3 lg:col-span-1" : ""
              }`}
            >
              {/* Decorative visual glow */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full filter blur-xl -z-10" />

              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    {item.label}
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mt-1.5 tracking-tight">
                    <CountUp end={item.value} suffix={item.suffix} />
                  </h3>
                </div>

                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/60 mt-4 pt-3">
                <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {item.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
