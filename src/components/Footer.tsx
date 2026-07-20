"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-400 py-12 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Col */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-kkn-blue to-kkn-purple flex items-center justify-center font-bold text-white text-sm shadow-md shadow-blue-500/10">
                K
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">KKNHub</span>
            </div>
            <p className="text-xs max-w-sm leading-relaxed text-slate-400">
              Sistem Manajemen KKN Terintegrasi untuk Kelompok 211 Universitas Islam Negeri Sunan Gunung Djati, dilaksanakan di Desa Sukaluyu, Kecamatan Sukaluyu, Kabupaten Cianjur, Jawa Barat.
            </p>
          </div>

          {/* Nav Links Col */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Aplikasi</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="#features" className="hover:text-white transition-colors">Fitur Utama</Link>
              </li>
              <li>
                <Link href="#timeline" className="hover:text-white transition-colors">Jadwal Timeline</Link>
              </li>
              <li>
                <Link href="#proker" className="hover:text-white transition-colors">Program Kerja</Link>
              </li>
              <li>
                <Link href="#gallery" className="hover:text-white transition-colors">Galeri Dokumentasi</Link>
              </li>
            </ul>
          </div>

          {/* Location details */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Lokasi Posko</h4>
            <p className="text-xs leading-relaxed text-slate-400">
              Desa Sukaluyu, Kec. Sukaluyu, Kabupaten Cianjur, Jawa Barat.
            </p>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="border-t border-slate-800/80 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <span className="font-medium text-slate-500">
            &copy; {new Date().getFullYear()} KKNHub Kelompok 211. All Rights Reserved.
          </span>
          <span className="flex items-center gap-1 text-slate-500 font-medium">
            Dibuat dengan <Heart className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" /> oleh Tim IT Kelompok 211 Desa Sukaluyu
          </span>
        </div>
      </div>
    </footer>
  );
}
