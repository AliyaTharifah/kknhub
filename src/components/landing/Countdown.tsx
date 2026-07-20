"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useLandingStore } from "@/hooks/useLandingStore";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Countdown() {
  const targetStartDate = useLandingStore((state) => state.targetStartDate);
  const targetEndDate = useLandingStore((state) => state.targetEndDate);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [statusText, setStatusText] = useState<string>("Perjalanan KKN Sukaluyu");
  const [subText, setSubText] = useState<string>("*Dihitung mundur menuju hari terakhir pelaksanaan KKN Kelompok 211");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const startDate = new Date(targetStartDate);
      const endDate = new Date(targetEndDate);

      let difference = 0;
      let newStatus = "";
      let newSub = "";

      if (now < startDate) {
        difference = +startDate - +now;
        newStatus = "Menuju Pembukaan KKN";
        newSub = "*Dihitung mundur menuju hari pertama pelaksanaan KKN Kelompok 211";
      } else if (now < endDate) {
        difference = +endDate - +now;
        newStatus = "Pelaksanaan KKN Sukaluyu";
        newSub = "*Dihitung mundur menuju hari terakhir pelaksanaan KKN Kelompok 211";
      } else {
        difference = 0;
        newStatus = "KKN Sukaluyu Selesai";
        newSub = "*Pelaksanaan KKN Kelompok 211 Desa Sukaluyu telah berakhir";
      }

      let newTimeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      setTimeLeft(newTimeLeft);
      setStatusText(newStatus);
      setSubText(newSub);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetStartDate, targetEndDate]);

  if (!timeLeft) return null;

  const timeBlocks = [
    { label: "Hari", value: timeLeft.days },
    { label: "Jam", value: timeLeft.hours },
    { label: "Menit", value: timeLeft.minutes },
    { label: "Detik", value: timeLeft.seconds },
  ];

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="glass-panel-strong rounded-3xl p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Soft background light */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full filter blur-xl -z-10" />

        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-kkn-purple animate-pulse" />
          <span className="text-sm font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            {statusText}
          </span>
        </div>

        {/* Countdown Grid */}
        <div className="grid grid-cols-4 gap-3 md:gap-5 w-full">
          {timeBlocks.map((block) => (
            <div
              key={block.label}
              className="flex flex-col items-center justify-center bg-white/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-3 md:p-4 shadow-sm"
            >
              <span className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-br from-kkn-blue to-kkn-purple bg-clip-text text-transparent">
                {String(block.value).padStart(2, "0")}
              </span>
              <span className="text-[10px] md:text-xs font-semibold text-slate-400 mt-1 uppercase">
                {block.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[11px] md:text-xs font-medium text-slate-500 dark:text-slate-400 mt-5 italic">
          {subText}
        </p>
      </motion.div>
    </div>
  );
}
