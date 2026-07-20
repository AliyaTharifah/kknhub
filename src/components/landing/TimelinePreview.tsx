"use client";

import Link from "next/link";
import { Calendar, ArrowRight, Clock, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { useLandingStore } from "@/hooks/useLandingStore";
import { buttonVariants } from "@/components/ui/button";

export default function TimelinePreview() {
  const events = useLandingStore((state) => state.timelineEvents);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Umum":
        return "bg-blue-500/10 text-blue-500 border-blue-200/40";
      case "Program Kerja":
        return "bg-purple-500/10 text-purple-500 border-purple-200/40";
      case "Kesehatan":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-200/40";
      case "Pendidikan":
        return "bg-orange-500/10 text-orange-500 border-orange-200/40";
      case "Lingkungan":
        return "bg-teal-500/10 text-teal-500 border-teal-200/40";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-200/40";
    }
  };

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } },
  } as const;

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Timeline Kegiatan Terdekat
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg">
            Berikut jadwal kegiatan terdekat Kelompok KKN 211 di Desa Sukaluyu. 
          </p>
        </div>
        <Link
          href="/timeline"
          className={buttonVariants({
            variant: "outline",
            className: "mt-4 md:mt-0 font-bold rounded-xl border-slate-200 hover:bg-slate-100/50 dark:border-slate-800 dark:hover:bg-slate-800/50 flex items-center gap-2",
          })}
        >
          <span>Lihat Semua Kegiatan</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Timeline track */}
      {events.length === 0 ? (
        <div className="text-center py-16 bg-white/5 backdrop-blur-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-450">
          <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-350" />
          <p className="font-bold text-slate-600 dark:text-slate-400">Belum ada agenda kegiatan terdekat</p>
          <p className="text-xs mt-1 text-slate-450 dark:text-slate-500">Timeline jadwal KKN akan muncul di sini setelah ditambahkan oleh Sekretaris.</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="relative border-l border-slate-200/60 dark:border-slate-800/60 ml-4 md:ml-6 pl-6 md:pl-8 space-y-8 py-2"
        >
          {events.map((event) => (
            <motion.div
              key={event.id}
              variants={itemVariants}
              className="relative flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
            >
              {/* Timeline bullet indicator */}
              <div className="absolute -left-[31px] md:-left-[39px] h-6 w-6 rounded-full border-4 border-white dark:border-slate-900 bg-kkn-blue flex items-center justify-center shadow-sm shadow-blue-500/35 z-10 animate-pulse duration-2000" />

              <div className="flex-1 space-y-2 bg-white dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${getCategoryColor(
                      event.category
                    )}`}
                  >
                    <Tag className="h-3 w-3" />
                    {event.category}
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-kkn-blue" />
                    {event.date}
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Clock className="h-3.5 w-3.5 text-kkn-purple" />
                    {event.time}
                  </span>
                </div>

                <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">
                  {event.title}
                </h3>

                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {event.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
