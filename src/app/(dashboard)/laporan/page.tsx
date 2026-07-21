"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart4,
  FileText,
  Download,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Award,
  ChevronRight,
  BookOpen,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useLandingStore } from "@/hooks/useLandingStore";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";

interface MemberRank {
  id?: string;
  name: string;
  logbooksCount: number;
  photosCount: number;
  prokerCount: number;
  score: number;
}

export default function LaporanPage() {
  const { user } = useAuthStore();
  const { logbooks, prokers, timelineEvents, notulen } = useLandingStore();

  const isDbEmpty = useMemo(() => {
    return logbooks.length === 0 && prokers.length === 0 && notulen.length === 0;
  }, [logbooks, prokers, notulen]);

  const [mounted, setMounted] = useState(false);
  const [printMode, setPrintMode] = useState<"none" | "group" | "personal">("none");
  const [draftGenerated, setDraftGenerated] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [usersList, setUsersList] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const isSecretary = user?.role === "Sekretaris";

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from("users").select("id, full_name");
      if (data) {
        setUsersList(data);
      }
    };
    fetchUsers();
  }, []);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return user;
    const found = usersList.find((u) => u.id === selectedUserId);
    return found ? { id: found.id, full_name: found.full_name, role: "Anggota" } : user;
  }, [selectedUserId, usersList, user]);

  // 1. Calculations for KPIs
  const prokerStats = useMemo(() => {
    let selesai = 0;
    let berjalan = 0;
    let belumMulai = 0;
    prokers.forEach((p) => {
      if (p.status === "Selesai") selesai++;
      else if (p.status === "Sedang Berjalan") berjalan++;
      else belumMulai++;
    });
    return { total: prokers.length, selesai, berjalan, belumMulai };
  }, [prokers]);

  const activityStats = useMemo(() => {
    let docsCount = 0;
    const targetLogs = (!isSecretary && user)
      ? logbooks.filter((l) => l.user_id === user.id)
      : logbooks;

    targetLogs.forEach((log) => {
      docsCount += log.photos?.length || 0;
    });

    const targetMeetings = (!isSecretary && user)
      ? notulen.filter((n) => n.attendees.includes(user.full_name))
      : notulen;

    return {
      logbooks: targetLogs.length,
      docs: docsCount,
      meetings: targetMeetings.length > 0 ? targetMeetings.length : notulen.length,
      timelines: timelineEvents.length,
    };
  }, [logbooks, notulen, timelineEvents, isSecretary, user]);

  // 2. Member Rankings calculation based strictly on usersList (excluding fake user names like Aminah)
  const memberRankings = useMemo<MemberRank[]>(() => {
    const listToUse = usersList.length > 0 ? usersList : (user && user.full_name ? [{ id: user.id, full_name: user.full_name }] : []);
    
    return listToUse.map((u) => {
      const uLogs = logbooks.filter((l) => l.user_id === u.id);
      const logbooksCount = uLogs.length;
      const photosCount = uLogs
        .filter((l) => l.status === "Selesai")
        .reduce((acc, curr) => acc + (curr.photos?.length || 0), 0);
      
      const prokerCount = prokers.filter((p) => p.pic === u.full_name).length;
      const score = logbooksCount * 5 + photosCount * 3 + prokerCount * 10;
      
      return {
        id: u.id,
        name: u.full_name,
        logbooksCount,
        photosCount,
        prokerCount,
        score,
      };
    }).sort((a, b) => b.score - a.score);
  }, [logbooks, prokers, usersList, user]);

  // Donut chart colors
  const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

  // Donut chart data mapping
  const donutData = useMemo(() => {
    return memberRankings
      .filter((item) => item.score > 0)
      .map((item) => ({
        name: item.name.split(" ")[0], // short name
        value: item.score,
      }));
  }, [memberRankings]);

  // Weekly activities count (for Area Chart)
  const weeklyData = useMemo(() => {
    const start = new Date("2026-07-21T00:00:00+07:00");
    const data = [
      { name: "Minggu 1", logbooks: 0, meetings: 0 },
      { name: "Minggu 2", logbooks: 0, meetings: 0 },
      { name: "Minggu 3", logbooks: 0, meetings: 0 },
      { name: "Minggu 4", logbooks: 0, meetings: 0 },
    ];

    logbooks.forEach((log) => {
      try {
        const logDate = new Date(log.date);
        const diffTime = logDate.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weekIdx = Math.floor(diffDays / 7);
        if (weekIdx >= 0 && weekIdx < 4) {
          data[weekIdx].logbooks++;
        }
      } catch (e) {
        console.error(e);
      }
    });

    notulen.forEach((note) => {
      try {
        const noteDate = new Date(note.date);
        const diffTime = noteDate.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weekIdx = Math.floor(diffDays / 7);
        if (weekIdx >= 0 && weekIdx < 4) {
          data[weekIdx].meetings++;
        }
      } catch (e) {
        console.error(e);
      }
    });

    return data;
  }, [logbooks, notulen]);

  // Daily activity log (Line Chart) grouped by day of the week
  const dailyData = useMemo(() => {
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const counts: Record<string, number> = { "Sen": 0, "Sel": 0, "Rab": 0, "Kam": 0, "Jum": 0, "Sab": 0, "Min": 0 };
    
    logbooks.forEach((log) => {
      try {
        const d = new Date(log.date).getDay();
        const dayName = days[d];
        if (counts[dayName] !== undefined) {
          counts[dayName]++;
        }
      } catch (e) {
        console.error(e);
      }
    });
    
    return [
      { day: "Sen", count: counts["Sen"] },
      { day: "Sel", count: counts["Sel"] },
      { day: "Rab", count: counts["Rab"] },
      { day: "Kam", count: counts["Kam"] },
      { day: "Jum", count: counts["Jum"] },
      { day: "Sab", count: counts["Sab"] },
      { day: "Min", count: counts["Min"] },
    ];
  }, [logbooks]);

  // Program Kerja progress data
  const prokerProgressData = useMemo(() => {
    return prokers.map((p) => ({
      name: p.name.length > 15 ? `${p.name.slice(0, 15)}...` : p.name,
      progress: p.progress,
    }));
  }, [prokers]);

  // 3. Automated Report Generator logic
  const handleGenerateDraft = () => {
    const text = `LAPORAN AKHIR PELAKSANAAN KKN SISDAMAS KELOMPOK 211
DESA SUKALUYU, CIANJUR JAWA BARAT
===================================================

1. PENDAHULUAN
KKN Sisdamas Kelompok 211, Universitas Islam Negeri Sunan Gunung Djati Bandung melaksanakan KKN di Desa Sukaluyu, Cianjur Jawa Barat selama 40 hari. Kegiatan KKN berfokus pada digitalisasi desa, penyuluhan kesehatan balita stunting, dan revitalisasi pojok baca.

2. STATISTIK UTAMA
- Total Program Kerja: ${prokerStats.total} program
- Program Kerja Selesai: ${prokerStats.selesai} (${prokerStats.total > 0 ? Math.round((prokerStats.selesai / prokerStats.total) * 100) : 0}%)
- Total Logbook Kegiatan: ${activityStats.logbooks} logbook
- Jumlah Foto Dokumentasi: ${activityStats.docs} foto
- Jumlah Rapat Koordinasi: ${activityStats.meetings} rapat

3. REKAPITULASI PROGRAM KERJA
${prokers.map((p, i) => `${i + 1}. ${p.name} (PIC: ${p.pic}) - Status: ${p.status} (${p.progress}%)`).join("\n")}

4. DOKUMENTASI KEGIATAN UTAMA
Daftar kegiatan KKN kelompok yang berhasil didokumentasikan di posko mencakup opening ceremony, pemetaan UMKM RW 02, pendampingan posyandu, dan penyusunan peta rawan bencana.

5. KONTRIBUSI ANGGOTA TERBAIK (Pencatat Teraktif)
${memberRankings.map((m, i) => `Rank #${i + 1}: ${m.name} - Nilai Kontribusi: ${m.score} poin`).join("\n")}

6. KESIMPULAN
Secara keseluruhan, pelaksanaan program kerja pengabdian KKN kelompok 211 di Desa Sukaluyu berjalan dengan sukses dengan tingkat kelancaran yang sangat tinggi.`;

    setDraftText(text);
    setDraftGenerated(true);
  };

  // 4. Excel Download Simulation
  const handleExportExcel = () => {
    const headers = "Tanggal,Mahasiswa,Program Kerja,Keterangan,Jam Mulai,Jam Selesai,Lokasi,Status\n";
    const rows = logbooks.map((log) => {
      return `"${log.date}","${log.user_name}","${log.timeline_title}","${log.description.replace(/"/g, '""')}","${log.start_time}","${log.end_time}","${log.location}","${log.status}"`;
    }).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "laporan_logbook_kkn211.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. PDF Export Triggers using print-stylesheets
  const triggerPrint = (type: "group" | "personal") => {
    setPrintMode(type);
    setTimeout(() => {
      window.print();
      setPrintMode("none");
    }, 300);
  };

  return (
    <div className="space-y-8">
      {/* ----------------- HIDDEN PRINT LAYOUT CONTAINER ----------------- */}
      {printMode !== "none" && mounted && createPortal(
        <div id="print-area" className="fixed inset-0 bg-white text-black p-8 z-[99999] overflow-y-auto block font-serif">
          {printMode === "group" ? (
            <div className="space-y-8">
              {/* Header Title */}
              <div className="text-center border-b-2 border-black pb-4 space-y-2">
                <h1 className="text-xl font-bold uppercase">Laporan Evaluasi Pelaksanaan KKN Sisdamas Kelompok 211</h1>
                <h2 className="text-sm font-bold uppercase">Universitas Islam Negeri Sunan Gunung Djati Bandung</h2>
                <h3 className="text-xs font-bold uppercase">Desa Sukaluyu, Cianjur Jawa Barat</h3>
                <p className="text-[10px]">Dicetak otomatis melalui KKNHub pada tanggal {new Date().toLocaleDateString("id-ID")}</p>
              </div>

              {/* Stats Summary Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase border-b border-black pb-1">1. Rangkuman Kinerja Kelompok</h3>
                <table className="w-full text-xs border border-black border-collapse">
                  <thead>
                    <tr className="border-b border-black bg-slate-100">
                      <th className="border-r border-black p-2 text-left">Metrik Kegiatan</th>
                      <th className="p-2 text-center">Jumlah / Hasil</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-2">Total Program Kerja KKN</td>
                      <td className="p-2 text-center">{prokerStats.total} Program</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-2">Program Kerja Selesai</td>
                      <td className="p-2 text-center">{prokerStats.selesai} Program</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-2">Total Logbook Kegiatan Anggota</td>
                      <td className="p-2 text-center">{activityStats.logbooks} Catatan</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-2">Foto Dokumentasi Kegiatan</td>
                      <td className="p-2 text-center">{activityStats.docs} Foto</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-2">Notulensi Rapat Posko</td>
                      <td className="p-2 text-center">{activityStats.meetings} Kali</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Prokers listing */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase border-b border-black pb-1">2. Daftar Program Kerja & Progress</h3>
                <table className="w-full text-xs border border-black border-collapse">
                  <thead>
                    <tr className="border-b border-black bg-slate-100">
                      <th className="border-r border-black p-2 text-left">Nama Program</th>
                      <th className="border-r border-black p-2 text-left">PIC</th>
                      <th className="border-r border-black p-2 text-center">Progress</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prokers.map((p) => (
                      <tr key={p.id} className="border-b border-black">
                        <td className="border-r border-black p-2">{p.name}</td>
                        <td className="border-r border-black p-2">{p.pic}</td>
                        <td className="border-r border-black p-2 text-center">{p.progress}%</td>
                        <td className="p-2 text-center">{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Members Contribution List */}
              <div className="space-y-3 page-break">
                <h3 className="text-sm font-bold uppercase border-b border-black pb-1">3. Rangking Kontribusi Pengabdian Anggota KKN</h3>
                <table className="w-full text-xs border border-black border-collapse">
                  <thead>
                    <tr className="border-b border-black bg-slate-100">
                      <th className="border-r border-black p-2 text-center">Rank</th>
                      <th className="border-r border-black p-2 text-left">Nama Lengkap</th>
                      <th className="border-r border-black p-2 text-center">Total Logbook</th>
                      <th className="border-r border-black p-2 text-center">Total Foto</th>
                      <th className="p-2 text-center">Skor Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberRankings.map((m, idx) => (
                      <tr key={m.id || `${m.name}-${idx}`} className="border-b border-black">
                        <td className="border-r border-black p-2 text-center">#{idx + 1}</td>
                        <td className="border-r border-black p-2">{m.name}</td>
                        <td className="border-r border-black p-2 text-center">{m.logbooksCount}</td>
                        <td className="border-r border-black p-2 text-center">{m.photosCount}</td>
                        <td className="p-2 text-center font-bold">{m.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Personal Logbook PDF Print */}
              <div className="text-center border-b-2 border-black pb-4 space-y-2">
                <h1 className="text-xl font-bold uppercase">Laporan Logbook Harian Individu Mahasiswa KKN</h1>
                <h2 className="text-sm font-bold uppercase">KKN Sisdamas Kelompok 211, Universitas Islam Negeri Sunan Gunung Djati Bandung</h2>
                <h3 className="text-xs font-bold uppercase">Desa Sukaluyu, Cianjur Jawa Barat</h3>
              </div>

              {/* Student Metadata Card */}
              <div className="grid grid-cols-2 gap-4 border border-black p-4 text-xs">
                <div className="space-y-1">
                  <p>Nama Lengkap : <strong className="text-sm font-bold">{selectedUser?.full_name}</strong></p>
                  <p>Jabatan / Role : <strong>{selectedUser?.id === user?.id ? user?.role : "Anggota"}</strong></p>
                  <p>Lokasi Posko : <strong>Balai Desa Sukaluyu</strong></p>
                </div>
                <div className="space-y-1 text-right">
                  <p>Jumlah Logbook Tuntas: <strong>{logbooks.filter((l) => l.user_id === selectedUser?.id && l.status === "Selesai").length} Catatan</strong></p>
                  <p>Tanggal Cetak : <strong>{new Date().toLocaleDateString("id-ID")}</strong></p>
                </div>
              </div>

              {/* Logbooks lists */}
              <div className="space-y-6 pt-4">
                <h3 className="text-sm font-bold uppercase border-b border-black pb-1">Daftar Aktivitas Logbook Harian</h3>
                {logbooks
                  .filter((l) => l.user_id === selectedUser?.id)
                  .map((log, idx) => (
                    <div key={log.id} className="border border-black p-4 space-y-3 text-xs break-inside-avoid">
                      <div className="flex justify-between border-b border-slate-300 pb-1 font-bold">
                        <span>Aktivitas #{idx + 1}: {log.timeline_title}</span>
                        <span>{log.date} ({log.start_time} - {log.end_time} WIB)</span>
                      </div>
                      <p className="leading-relaxed"><strong className="block text-[10px] text-slate-550 uppercase">Deskripsi Kegiatan:</strong>{log.description}</p>
                      <p><strong>Lokasi Pelaksanaan:</strong> {log.location} | <strong>Status Catatan:</strong> {log.status}</p>
                      {log.photos && log.photos.length > 0 && (
                        <div className="flex gap-2 pt-2 border-t border-slate-200 mt-2">
                          {log.photos.map((photo, i) => (
                            <div key={i} className="h-16 w-24 border border-black rounded overflow-hidden">
                              <img src={photo} alt="Dokumentasi" className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* ----------------- WEB SCREEN APPLICATION DISPLAY ----------------- */}

      {/* Top Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-900/30 text-kkn-blue text-xs font-bold uppercase">
            <BarChart4 className="h-3.5 w-3.5" />
            <span>Laporan & Ekspor</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Laporan Analitik KKN
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Kompilasi rangkuman data kegiatan kelompok, kontribusi harian, grafis visual, serta modul ekspor siap cetak A4.
          </p>
        </div>
      </div>

      {isDbEmpty ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="h-20 w-20 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full flex items-center justify-center text-kkn-blue">
            <BarChart4 className="h-10 w-10 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white">
              Belum ada data laporan
            </h3>
            <p className="text-xs md:text-sm text-slate-505 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Statistik dan visualisasi akan muncul secara otomatis setelah anggota mulai mengisi logbook, program kerja, dokumentasi, dan notulen.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Program Kerja</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-xl font-black text-slate-800 dark:text-white">{prokerStats.total}</span>
                <span className="text-[9px] text-slate-400 font-bold">
                  {prokerStats.selesai} Selesai / {prokerStats.berjalan} Berjalan
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Logbook</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-xl font-black text-slate-800 dark:text-white">{activityStats.logbooks}</span>
                <span className="text-[9px] text-slate-400 font-bold">Catatan Kegiatan</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Dokumentasi & Notulen</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-xl font-black text-slate-800 dark:text-white">{activityStats.docs + activityStats.meetings}</span>
                <span className="text-[9px] text-slate-400 font-bold">
                  {activityStats.docs} Foto / {activityStats.meetings} Rapat
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Persentase Penyelesaian</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-xl font-black text-slate-800 dark:text-white">
                  {prokerStats.total > 0 ? Math.round(prokers.reduce((acc, curr) => acc + curr.progress, 0) / prokerStats.total) : 0}%
                </span>
                <span className="text-[9px] text-slate-400 font-bold">Rata-rata Progress</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Analytics dashboards, charts, rankings */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Rank contributions table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="h-5 w-5 text-kkn-blue" />
                  <h3 className="text-sm font-extrabold text-slate-855 dark:text-white uppercase tracking-wider">
                    Rangking Kontribusi Mahasiswa
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm text-left">
                    <thead>
                      <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2">
                        <th className="py-2.5 font-extrabold uppercase">Rank</th>
                        <th className="py-2.5 font-extrabold uppercase">Nama Anggota</th>
                        <th className="py-2.5 font-extrabold text-center uppercase">Logbook</th>
                        <th className="py-2.5 font-extrabold text-center uppercase">Foto</th>
                        <th className="py-2.5 font-extrabold text-center uppercase">Proker</th>
                        <th className="py-2.5 font-extrabold text-right uppercase">Skor Kontribusi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberRankings.length === 0 || (memberRankings.length === 1 && memberRankings[0].score === 0) ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                            Belum ada kontribusi. Laporan ranking akan terhitung secara otomatis setelah logbook harian diisi.
                          </td>
                        </tr>
                      ) : (
                        memberRankings.map((item, idx) => (
                          <tr
                            key={item.id || `${item.name}-${idx}`}
                            className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors"
                          >
                            <td className="py-3 font-bold text-slate-550">#{idx + 1}</td>
                            <td className="py-3 font-bold text-slate-800 dark:text-white">{item.name}</td>
                            <td className="py-3 text-center font-semibold text-slate-500">{item.logbooksCount}</td>
                            <td className="py-3 text-center font-semibold text-slate-500">{item.photosCount}</td>
                            <td className="py-3 text-center font-semibold text-slate-500">{item.prokerCount}</td>
                            <td className="py-3 text-right font-black text-kkn-blue">{item.score} pt</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Weekly activity trends */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-6">
                    Tren Laporan per Minggu
                  </h3>
                  <div className="h-[220px] w-full">
                    {!mounted ? (
                      <div className="h-full flex items-center justify-center text-slate-400">Loading chart...</div>
                    ) : logbooks.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyData}>
                          <defs>
                            <linearGradient id="colLogbooks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                          <Area type="monotone" dataKey="logbooks" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colLogbooks)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-450 py-4">
                        <BarChart4 className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-450">Belum ada data mingguan</p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 text-center">Data trend akan tampil saat logbook diisi.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contribution shares donut chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-6">
                    Distribusi Nilai Kontribusi
                  </h3>
                  <div className="h-[220px] w-full flex items-center justify-center">
                    {!mounted ? (
                      <div className="h-full flex items-center justify-center text-slate-400">Loading chart...</div>
                    ) : donutData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {donutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-455 py-4">
                        <Award className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-450">Belum ada distribusi kontribusi</p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 text-center">Data kontribusi dihitung berdasarkan logbook.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Second Row of Charts: Daily and Proker Progress */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Daily counts line chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-6">
                    Distribusi Logbook Harian
                  </h3>
                  <div className="h-[200px] w-full">
                    {!mounted ? (
                      <div className="h-full flex items-center justify-center text-slate-400">Loading chart...</div>
                    ) : logbooks.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyData}>
                          <XAxis dataKey="day" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                          <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-455 py-4">
                        <FileText className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-455">Belum ada data harian</p>
                        <p className="text-[10px] text-slate-455 dark:text-slate-500 mt-1 text-center">Data harian akan tampil saat logbook diisi.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Program Kerja chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-6">
                    Progress Program Kerja (%)
                  </h3>
                  <div className="h-[200px] w-full">
                    {!mounted ? (
                      <div className="h-full flex items-center justify-center text-slate-400">Loading chart...</div>
                    ) : prokers.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={prokerProgressData}>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} />
                          <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                          <Bar dataKey="progress" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-455 py-4">
                        <Briefcase className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 animate-pulse" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-455">Belum ada progress proker</p>
                        <p className="text-[10px] text-slate-455 dark:text-slate-500 mt-1 text-center">Progress akan tampil setelah program kerja dibuat.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Automated draft report generator panel */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-kkn-purple" />
                    <h3 className="text-sm font-extrabold text-slate-850 dark:text-white uppercase tracking-wider">
                      Draf Laporan Akhir Otomatis
                    </h3>
                  </div>

                  <Button
                    onClick={handleGenerateDraft}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Susun Draf Laporan</span>
                  </Button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sistem akan merangkum seluruh logbook, statistik program kerja, dan ranking kontribusi mahasiswa ke dalam rancangan laporan akhir yang siap diedit oleh Sekretaris.
                </p>

                {draftGenerated && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-855"
                  >
                    <textarea
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      rows={10}
                      className="w-full text-xs font-mono text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-2xl p-4 outline-none resize-y leading-relaxed"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setDraftGenerated(false)}
                        className="text-xs font-bold rounded-xl"
                      >
                        Tutup
                      </Button>
                      <Button
                        onClick={() => triggerPrint("group")}
                        className="bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-bold text-white text-xs px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Cetak Lembar Laporan</span>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right Column: PDF / Excel Action triggers */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2.5">
                  Ekspor Berkas & Data
                </h3>

                <div className="flex flex-col gap-3">
                  {/* Excel button */}
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col">
                        <span>Unduh Rekap Excel</span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Seluruh Logbook (.CSV)</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  {/* Group PDF button */}
                  <button
                    onClick={() => triggerPrint("group")}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 bg-blue-500/10 text-kkn-blue rounded-lg flex items-center justify-center">
                        <Printer className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col">
                        <span>Laporan Kelompok</span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Ekspor Format PDF A4</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-850 my-2" />

                  {/* Member Selector for Sekretaris */}
                  {isSecretary && (
                    <div className="space-y-1.5 px-1">
                      <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                        Pilih Anggota (Logbook Cetak)
                      </label>
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full text-xs text-slate-850 dark:text-white bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 focus:border-kkn-blue rounded-xl py-2 px-3 outline-none"
                      >
                        <option value="">-- Diri Sendiri ({user?.full_name}) --</option>
                        {usersList.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Personal PDF button */}
                  <button
                    onClick={() => triggerPrint("personal")}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 bg-purple-500/10 text-kkn-purple rounded-lg flex items-center justify-center">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col">
                        <span>Logbook Individu</span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Format Cetak {selectedUserId ? "Anggota" : "Pribadi"}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
