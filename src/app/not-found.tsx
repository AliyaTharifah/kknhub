"use client";

import Link from "next/link";
import { Compass, MoveLeft, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-center select-none font-sans">
      <div className="max-w-md w-full space-y-6">
        {/* Animated Compass Icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="h-24 w-24 mx-auto bg-gradient-to-tr from-kkn-blue/10 to-kkn-purple/10 text-kkn-blue flex items-center justify-center rounded-3xl border border-kkn-blue/20 shadow-lg shadow-blue-500/5"
        >
          <Compass className="h-12 w-12" />
        </motion.div>

        {/* 404 Text */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full">
            Halaman Tidak Ditemukan
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-850 dark:text-white tracking-tight">
            Kode Error 404
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Maaf, halaman posko KKN yang Anda cari tidak ada atau telah dipindahkan ke folder dokumen lain.
          </p>
        </div>

        {/* Redirect buttons */}
        <div className="pt-2">
          <Link href="/dashboard" passHref legacyBehavior>
            <Button className="bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 text-white font-bold px-6 py-5 rounded-2xl text-xs shadow-md transition-transform hover:scale-102 cursor-pointer inline-flex items-center gap-2">
              <MoveLeft className="h-4 w-4" />
              <span>Kembali ke Dashboard</span>
            </Button>
          </Link>
        </div>

        {/* Help footer */}
        <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <HelpCircle className="h-3 w-3" />
          Hubungi Admin Posko jika Anda merasa ini adalah kesalahan sistem.
        </p>
      </div>
    </main>
  );
}
