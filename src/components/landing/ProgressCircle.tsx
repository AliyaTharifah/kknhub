"use client";

import { useMemo } from "react";
import { Award } from "lucide-react";
import { motion } from "framer-motion";
import { useLandingStore } from "@/hooks/useLandingStore";

export default function ProgressCircle() {
  const getAverageProgress = useLandingStore((state) => state.getAverageProgress);
  const progress = getAverageProgress();

  const motivationSlogan = useMemo(() => {
    if (progress < 25) return "Semangat!";
    if (progress < 50) return "Terus Semangat!";
    if (progress < 75) return "Setengah jalan terlewati. Sukaluyu menanti baktimu!";
    if (progress < 90) return "Sempurnakan pekerjaan kita. KKN hampir selesai!";
    return "keren! Seluruh proker KKN Sukaluyu sukses terlaksana.";
  }, [progress]);

  // SVG Circular stroke dimensions
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-panel-strong rounded-3xl p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Soft background light */}
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full filter blur-xl -z-10" />

        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-kkn-blue animate-bounce" />
          <span className="text-sm font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            Progress KKN Kelompok 211
          </span>
        </div>

        {/* Circular Progress Gauge */}
        <div className="relative flex items-center justify-center w-40 h-40">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress circle */}
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              className="stroke-kkn-blue"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              whileInView={{ strokeDashoffset }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              strokeLinecap="round"
            />
          </svg>

          {/* Centered Percentage */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white">
              {progress}%
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Tercapai
            </span>
          </div>
        </div>

        <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white mt-5">
          {motivationSlogan}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm">
          Akumulasi penyelesaian program kerja.
        </p>
      </motion.div>
    </div>
  );
}
