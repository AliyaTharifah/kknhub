"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Briefcase,
  FileText,
  Camera,
  ScrollText,
  Percent,
  Sparkles,
  PlusCircle,
  Calendar,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useLandingStore } from "@/hooks/useLandingStore";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { 
    totalMembers, 
    totalLogbooks, 
    totalDocs, 
    prokers, 
    logbooks, 
    notulen, 
    initializeStats, 
    getAverageProgress 
  } = useLandingStore();
  const averageProgress = getAverageProgress();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initializeStats();
  }, [initializeStats]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const totalNotulen = notulen.length;

  // Dynamic calculations for charts
  const prokerCounts = useMemo(() => {
    const counts = { "Belum Mulai": 0, "Sedang Berjalan": 0, "Selesai": 0 };
    prokers.forEach((p) => {
      if (p.status === "Selesai") counts["Selesai"] += 1;
      else if (p.status === "Sedang Berjalan") counts["Sedang Berjalan"] += 1;
      else counts["Belum Mulai"] += 1;
    });
    return [
      { name: "Belum Mulai", count: counts["Belum Mulai"], fill: "#94a3b8" },
      { name: "Berjalan", count: counts["Sedang Berjalan"], fill: "#3b82f6" },
      { name: "Selesai", count: counts["Selesai"], fill: "#10b981" },
    ];
  }, [prokers]);

  // Curated Color Palettes
  const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f97316", "#f59e0b", "#ef4444"];

  // Dynamic Logbook counts for last 7 calendar days
  const logbookActivityData = useMemo(() => {
    const data = [];
    const daysToGenerate = 7;
    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      const isoDate = d.toISOString().split("T")[0];
      
      const count = logbooks.filter((log) => log.date === isoDate).length;
      data.push({ name: dateStr, count });
    }
    return data;
  }, [logbooks]);

  // Dynamic Photo distribution per Proker/Timeline
  const photoDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    logbooks.forEach((log) => {
      if (log.status === "Selesai" && log.photos && log.photos.length > 0) {
        const title = log.timeline_title;
        counts[title] = (counts[title] || 0) + log.photos.length;
      }
    });
    
    return Object.entries(counts).map(([name, value]) => ({
      name: name.length > 15 ? `${name.slice(0, 15)}...` : name,
      value
    }));
  }, [logbooks]);

  // Dynamic weekly activity data grouped by day of week
  const weeklyActivityData = useMemo(() => {
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const counts: Record<string, number> = { "Sen": 0, "Sel": 0, "Rab": 0, "Kam": 0, "Jum": 0, "Sab": 0, "Min": 0 };
    
    logbooks.forEach((log) => {
      try {
        const d = new Date(log.date);
        const dayName = dayNames[d.getDay()];
        if (counts[dayName] !== undefined) {
          counts[dayName]++;
        }
      } catch (e) {
        console.error(e);
      }
    });
    
    return [
      { name: "Sen", count: counts["Sen"] },
      { name: "Sel", count: counts["Sel"] },
      { name: "Rab", count: counts["Rab"] },
      { name: "Kam", count: counts["Kam"] },
      { name: "Jum", count: counts["Jum"] },
      { name: "Sab", count: counts["Sab"] },
      { name: "Min", count: counts["Min"] },
    ];
  }, [logbooks]);

  const userLogbooksCount = useMemo(() => {
    if (!user) return 0;
    const individualCount = logbooks.filter((l) => l.user_id === user.id).length;
    if (user.role === "Sekretaris") {
      return individualCount > 0 ? individualCount : logbooks.length;
    }
    return individualCount;
  }, [logbooks, user]);

  const userDocsCount = useMemo(() => {
    if (!user) return 0;
    const individualPhotos = logbooks
      .filter((l) => l.user_id === user.id)
      .reduce((sum, l) => sum + (l.photos?.length || 0), 0);
    
    const userUploadedDocs = (useLandingStore.getState().documents || []).filter(
      (d) => d.uploadedBy === user.full_name || d.uploadedBy === user.id
    ).length;

    const userTotal = individualPhotos + userUploadedDocs;
    if (user.role === "Sekretaris") {
      const groupPhotos = logbooks.reduce((sum, l) => sum + (l.photos?.length || 0), 0);
      const groupDocsCount = useLandingStore.getState().documents.length;
      return userTotal > 0 ? userTotal : (groupPhotos + groupDocsCount);
    }
    return userTotal;
  }, [logbooks, user]);

  const stats = [
    { label: "Total Anggota", value: totalMembers, icon: Users, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/10" },
    { label: "Program Kerja", value: prokers.length, icon: Briefcase, color: "text-purple-500 bg-purple-50 dark:bg-purple-900/10" },
    { label: "Total Logbook", value: userLogbooksCount, icon: FileText, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" },
    { label: "Dokumentasi", value: userDocsCount, icon: Camera, color: "text-orange-500 bg-orange-50 dark:bg-orange-900/10" },
    { label: "Notulen Rapat", value: totalNotulen, icon: ScrollText, color: "text-amber-500 bg-amber-50 dark:bg-amber-900/10" },
    { label: "Progress Proker", value: `${averageProgress}%`, icon: Percent, color: "text-rose-500 bg-rose-50 dark:bg-rose-900/10" },
  ];

  const quickActions = [
    { label: "Tambah Logbook", icon: PlusCircle, href: "/logbook", color: "from-blue-500 to-indigo-500 text-white" },
    { label: "Lihat Timeline", icon: Calendar, href: "/timeline", color: "from-purple-500 to-pink-500 text-white" },
    { label: "Unduh Laporan", icon: Download, href: "/laporan", color: "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800" },
  ];

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-strong rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full filter blur-2xl -z-10" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-500/10 text-kkn-blue px-2.5 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            <span>Kondisi Posko Terkini</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
            Selamat datang, {user.full_name} 👋
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Semoga kegiatan KKN hari ini di Desa Sukaluyu berjalan lancar.
          </p>
        </div>
      </motion.div>

      {/* Main Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between shadow-sm"
            >
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                {stat.label}
              </span>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg md:text-xl font-extrabold text-slate-800 dark:text-white leading-none">
                  {stat.value}
                </span>
                <div className={`h-8 w-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Grid: Charts & Circular Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Main activity tracking */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Chart 1: Logbook count line chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-6">
              Aktivitas Logbook Harian
            </h3>
            <div className="h-[250px] w-full">
              {!mounted ? (
                <div className="h-full flex items-center justify-center text-slate-400">Loading chart...</div>
              ) : logbooks.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logbookActivityData}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4, stroke: "#3b82f6", strokeWidth: 2, fill: "#fff" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6">
                  <FileText className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Belum ada catatan logbook</p>
                  <p className="text-[10px] text-slate-405 dark:text-slate-500 mt-1 text-center">Data grafik akan muncul setelah anggota mengisi logbook.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chart 2: Proker status bar chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-6">
                Status Program Kerja
              </h3>
              <div className="h-[200px] w-full">
                {!mounted ? (
                  <div className="h-full flex items-center justify-center text-slate-400">Loading chart...</div>
                ) : prokers.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prokerCounts}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {prokerCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-4">
                    <Briefcase className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Belum ada program kerja</p>
                    <p className="text-[10px] text-slate-405 dark:text-slate-500 mt-1 text-center">Data status akan terisi setelah program kerja ditambahkan.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 3: Photos Pie Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-6">
                Dokumentasi per Proker
              </h3>
              <div className="h-[200px] w-full flex items-center justify-center">
                {!mounted ? (
                  <div className="h-full flex items-center justify-center text-slate-400">Loading chart...</div>
                ) : photoDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={photoDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {photoDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-4">
                    <Camera className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Belum ada dokumentasi</p>
                    <p className="text-[10px] text-slate-405 dark:text-slate-500 mt-1 text-center">Unggah foto saat menyelesaikan logbook untuk melihat bagan.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart 4: Area chart for 7-day activity metrics */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-6">
              Volume Aktivitas Mingguan
            </h3>
            <div className="h-[200px] w-full">
              {!mounted ? (
                <div className="h-full flex items-center justify-center text-slate-400">Loading chart...</div>
              ) : logbooks.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyActivityData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-4">
                  <FileText className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Belum ada volume aktivitas</p>
                  <p className="text-[10px] text-slate-405 dark:text-slate-500 mt-1 text-center">Aktivitas mingguan Anda akan terekam otomatis di sini.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Quick Actions & Gauge */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Progress Circular Gauge */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
            <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
              Penyelesaian Proker KKN
            </span>
            <div className="relative flex items-center justify-center w-36 h-36">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="52"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="52"
                  className="stroke-kkn-blue"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 - (averageProgress / 100) * (2 * Math.PI * 52)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800 dark:text-white">
                  {averageProgress}%
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                  Tuntas
                </span>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-4">
              {averageProgress < 75 ? "Kerja bagus! Ayo tuntaskan sisanya." : "Sangat dekat! Desa Sukaluyu menanti baktimu."}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Tindakan Cepat
            </h3>
            <div className="flex flex-col gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-transform active:scale-98 shadow-sm justify-center ${
                      action.color.includes("from-")
                        ? `bg-gradient-to-r ${action.color} hover:opacity-95`
                        : action.color
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
