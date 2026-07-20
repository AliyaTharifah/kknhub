"use client";

import { LayoutDashboard, FileText, CalendarRange, FolderGit2, ScrollText, Users2, Bell, Search, Activity, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPreview() {

  const sidebarLinks = [
    { name: "Dashboard", icon: LayoutDashboard, active: true },
    { name: "Logbook Anggota", icon: FileText, active: false },
    { name: "Timeline Kegiatan", icon: CalendarRange, active: false },
    { name: "Program Kerja", icon: FolderGit2, active: false },
    { name: "Notulen Rapat", icon: ScrollText, active: false },
    { name: "Daftar Anggota", icon: Users2, active: false },
  ];

  const recentActivities = [
    {
      id: "act-1",
      user: "Siti Rahma",
      avatar: "SR",
      color: "bg-purple-500",
      action: "mengunggah logbook harian",
      target: "Penyuluhan stunting Posyandu Melati",
      time: "10 menit yang lalu",
    },
    {
      id: "act-2",
      user: "Rian Ardiansyah",
      avatar: "RA",
      color: "bg-blue-500",
      action: "memperbarui progress proker",
      target: "Website Profil Desa Sukaluyu (65%)",
      time: "2 jam yang lalu",
    },
    {
      id: "act-3",
      user: "Budi Santoso",
      avatar: "BS",
      color: "bg-emerald-500",
      action: "menambahkan notulen rapat",
      target: "Evaluasi program kerja minggu kedua",
      time: "4 jam yang lalu",
    },
  ];

  return (
    <div className="w-full">
      <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/80 dark:bg-purple-900/30 border border-purple-200/40 text-kkn-purple text-xs font-bold uppercase">
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span>Dashboard Preview</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Intip Sistem Kerja KKNHub
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Tampilan dashboard modern yang mempermudah koordinasi, pemantauan tugas harian, dan pertanggungjawaban program kerja kelompok secara real-time.
        </p>
      </div>

      {/* Mockup Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ type: "spring", duration: 0.8 }}
        className="relative bg-slate-900/5 dark:bg-black/20 p-2 md:p-4 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="w-full h-full bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 overflow-hidden flex shadow-sm min-h-[480px]">
          
          {/* Mock Sidebar */}
          <aside className="hidden md:flex flex-col w-56 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-900 p-4 justify-between">
            <div className="space-y-6">
              {/* Branding */}
              <div className="flex items-center gap-2 px-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-kkn-blue to-kkn-purple flex items-center justify-center font-bold text-white text-sm">
                  K
                </div>
                <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-white">
                  KKNHub 211
                </span>
              </div>

              {/* Sidebar items */}
              <nav className="space-y-1">
                {sidebarLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <div
                      key={link.name}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 ${
                        link.active
                          ? "bg-gradient-to-r from-kkn-blue to-kkn-purple text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/80"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.name}</span>
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Profile footer */}
            <div className="flex items-center gap-2.5 border-t border-slate-200/50 dark:border-slate-800/50 pt-3 px-1">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                BS
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[11px] font-bold text-slate-800 dark:text-white leading-tight">
                  Budi Santoso
                </span>
                <span className="text-[9px] text-slate-400 font-semibold truncate leading-tight">
                  Ketua Kelompok
                </span>
              </div>
            </div>
          </aside>

          {/* Mock Main Dashboard Page */}
          <main className="flex-1 flex flex-col bg-white dark:bg-slate-950">
            {/* Header bar */}
            <header className="h-14 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between px-6">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl px-3 py-1.5 w-60 border border-slate-100/50 dark:border-slate-850">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] font-medium text-slate-400">Cari logbook, proker...</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <div className="h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center relative cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-850">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                </div>
              </div>
            </header>

            {/* Inner Dashboard View */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[420px]">
              {/* Greeting row */}
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Halo, Budi Santoso 👋
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Hari ini adalah hari ke-15 KKN Desa Sukaluyu. Pantau aktivitas kelompok di sini.
                  </p>
                </div>
              </div>

              {/* Content Grid splits */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: Recent Activities */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                      Aktivitas Terbaru Anggota
                    </span>
                    <span className="text-[10px] text-kkn-blue font-bold flex items-center cursor-pointer hover:underline">
                      Lihat Semua <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {recentActivities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100/50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full ${act.color} flex items-center justify-center font-bold text-white text-xs`}>
                            {act.avatar}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-800 dark:text-white">
                              {act.user}{" "}
                              <span className="font-medium text-slate-400">{act.action}</span>
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[200px] md:max-w-xs mt-0.5">
                              {act.target}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-semibold text-slate-400">
                          {act.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side: Proker Tracker Summary */}
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide block">
                    Grafik Progress Ringkas
                  </span>
                  
                  {/* Styled Mock SVG Graph representing weekly activity counts */}
                  <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-4 border border-slate-100/50 dark:border-slate-850 flex flex-col justify-between aspect-[4/3] relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-slate-400">Logbook Mingguan</span>
                      <span className="text-[10px] font-bold text-green-500 flex items-center gap-0.5">
                        <Activity className="h-3 w-3" /> +18.4%
                      </span>
                    </div>

                    {/* Custom SVG Line Area Graph */}
                    <div className="flex-1 w-full relative min-h-[90px] mt-2">
                      <svg viewBox="0 0 200 80" className="w-full h-full">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="200" y2="20" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800" />
                        <line x1="0" y1="50" x2="200" y2="50" stroke="#f1f5f9" strokeWidth="0.5" className="dark:stroke-slate-800" />
                        
                        {/* Area */}
                        <path
                          d="M 0,70 L 30,55 L 60,62 L 90,30 L 120,45 L 150,20 L 180,35 L 200,15 L 200,80 L 0,80 Z"
                          fill="url(#chartGradient)"
                        />
                        {/* Line */}
                        <path
                          d="M 0,70 L 30,55 L 60,62 L 90,30 L 120,45 L 150,20 L 180,35 L 200,15"
                          fill="transparent"
                          stroke="url(#lineGradient)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          className="stroke-kkn-blue"
                        />
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>

                        {/* Nodes */}
                        <circle cx="90" cy="30" r="3" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
                        <circle cx="150" cy="20" r="3" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1" />
                        <circle cx="200" cy="15" r="3" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1" />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-2 text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                      <span>Mgg 1</span>
                      <span>Mgg 2</span>
                      <span>Mgg 3</span>
                      <span>Mgg 4</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </main>

        </div>
      </motion.div>
    </div>
  );
}
