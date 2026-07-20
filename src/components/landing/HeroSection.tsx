"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";

const slides = [
  { src: "/kkn_hero1.jpg", alt: "Kolaborasi KKN Sukaluyu 211 - 1" },
  { src: "/kkn_hero2.jpg", alt: "Kolaborasi KKN Sukaluyu 211 - 2" },
  { src: "/kkn_hero3.jpg", alt: "Kolaborasi KKN Sukaluyu 211 - 3" },
  { src: "/kkn_hero4.jpg", alt: "Kolaborasi KKN Sukaluyu 211 - 4" },
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[90vh] pt-32 pb-16 flex items-center overflow-hidden bg-gradient-to-b from-blue-50/50 via-purple-50/20 to-transparent dark:from-slate-900 dark:via-purple-950/10 dark:to-transparent">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/10 w-72 h-72 bg-blue-400/20 dark:bg-blue-600/10 rounded-full filter blur-3xl -z-10 animate-pulse duration-5000" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full filter blur-3xl -z-10 animate-pulse duration-7000" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Text Left Column */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/30 text-kkn-blue text-xs font-semibold tracking-wide uppercase"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Kelompok KKN 211 Desa Sukaluyu</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]"
            >
              Kelola Kegiatan KKN dengan{" "}
              <span className="bg-gradient-to-r from-kkn-blue via-indigo-500 to-kkn-purple bg-clip-text text-transparent">
                KKNHub
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed"
            >
              Satu platform untuk mengelola seluruh aktivitas KKN Kelompok 211 Desa Sukaluyu. Mulai dari timeline kegiatan, program kerja, logbook harian, dokumentasi, notulen rapat, hingga ekspor laporan akhir.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link
                href="/login"
                className={buttonVariants({
                  size: "lg",
                  className: "relative group bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-bold text-white px-8 py-6 rounded-2xl shadow-xl shadow-blue-500/25 transition-all duration-300 hover:scale-[1.03] w-full sm:w-auto text-base flex items-center justify-center gap-2",
                })}
              >
                <span>Masuk Aplikasi</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 duration-200" />
              </Link>
              <Link
                href="#features"
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                  className: "font-bold text-slate-700 dark:text-slate-200 px-8 py-6 rounded-2xl border-slate-200 hover:bg-slate-100/50 dark:border-slate-800 dark:hover:bg-slate-800/50 hover:scale-[1.01] transition-all duration-200 w-full sm:w-auto text-base flex items-center justify-center gap-2",
                })}
              >
                <BookOpen className="h-5 w-5" />
                <span>Pelajari Fitur</span>
              </Link>
            </motion.div>
          </div>

          {/* Illustration Right Column */}
          <div className="lg:col-span-6 flex justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative w-full max-w-[600px] aspect-[16/9]"
            >
              {/* Outer decorative ring */}
              <div className="absolute -inset-3 rounded-[2.25rem] border border-dashed border-slate-300/40 dark:border-slate-700/40" />

              {/* Floating Animation Layer */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{
                  y: {
                    repeat: Infinity,
                    duration: 5,
                    ease: "easeInOut",
                  },
                }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <div className="relative w-11/12 h-11/12 rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 dark:shadow-black/30 border border-white/40 dark:border-slate-800/40 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm group/slider">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="relative w-full h-full"
                    >
                      <Image
                        src={slides[currentSlide].src}
                        alt={slides[currentSlide].alt}
                        fill
                        sizes="(max-w-768px) 100vw, 500px"
                        priority
                        className="object-cover"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Manual Navigation Arrows */}
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-black/50 border border-white/10 backdrop-blur-sm z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-black/50 border border-white/10 backdrop-blur-sm z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-slate-950/40 dark:bg-slate-900/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    {slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                          }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>


              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
