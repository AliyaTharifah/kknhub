"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  FolderGit2,
  FileText,
  Camera,
  FolderDot,
  ScrollText,
  BarChart4,
  LogOut,
  Menu,
  X,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useLandingStore } from "@/hooks/useLandingStore";
import { isSandboxMode } from "@/lib/supabase";
import GlobalSearch from "@/components/GlobalSearch";

import ThemeToggle from "@/components/ThemeToggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, initializeAuth } = useAuthStore();
  const fetchLandingData = useLandingStore((state) => state.fetchLandingData);
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchLandingData();
    }
  }, [user, isLoading, router, fetchLandingData]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="h-10 w-10 border-4 border-t-kkn-blue border-slate-700 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-400 tracking-widest uppercase">
          Menyiapkan Posko KKN...
        </span>
      </div>
    );
  }

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Timeline", href: "/timeline", icon: CalendarRange },
    { name: "Program Kerja", href: "/proker", icon: FolderGit2 },
    { name: "Logbook", href: "/logbook", icon: FileText },
    { name: "Galeri", href: "/galeri", icon: Camera },
    { name: "Dokumen", href: "/dokumen", icon: FolderDot },
    { name: "Notulen", href: "/notulen", icon: ScrollText },
    { name: "Laporan", href: "/laporan", icon: BarChart4 },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-100">
      
      {/* 1. Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-800/60 p-5 shrink-0 justify-between">
        <div className="space-y-8">
          {/* Logo Branding */}
          <Link href="/dashboard" className="flex items-center gap-2 px-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-kkn-blue to-kkn-purple flex items-center justify-center font-extrabold text-white text-base shadow-md shadow-blue-500/10">
              K
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white leading-none">
                KKNHub
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Sisdamas 211
              </span>
            </div>
          </Link>
          
          <div className="px-2">
            <GlobalSearch />
          </div>

          {/* Sandbox Indicator */}
          {isSandboxMode && (
            <div className="px-3.5 py-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl text-[10px] font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 animate-pulse" />
              <span>Mode Simulasi (Offline)</span>
            </div>
          )}

          {/* Sidebar Menu Items */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-kkn-blue to-kkn-purple text-white shadow-md shadow-blue-500/10"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout Bottom Column */}
        <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-850">
          <div className="flex items-center justify-between gap-2 px-1">
            <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity truncate">
              <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-extrabold flex items-center justify-center shadow-sm text-sm">
                {user.photo_url ? (
                  <img src={user.photo_url} alt={user.full_name} className="h-full w-full object-cover" />
                ) : (
                  user.full_name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight truncate">
                  {user.full_name}
                </span>
                <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                  <UserCheck className="h-3 w-3 text-kkn-purple" />
                  {user.role}
                </span>
              </div>
            </Link>
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors text-left"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Page Layout Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-14 bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between px-4 z-40 sticky top-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-kkn-blue to-kkn-purple flex items-center justify-center font-bold text-white text-xs">
              K
            </div>
            <span className="font-extrabold text-xs tracking-tight text-slate-800 dark:text-white">
              KKNHub
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
          </div>
        </header>

        {/* Actual children page */}
        <main className="flex-grow p-4 md:p-8 lg:p-10 relative overflow-y-auto">
          {children}
        </main>
      </div>

      {/* 3. Mobile Navigation Sidebar Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />
            {/* Sidebar box */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0.15 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between z-50 lg:hidden border-r border-slate-200/50 dark:border-slate-800/60 shadow-2xl"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-kkn-blue to-kkn-purple flex items-center justify-center font-extrabold text-white text-sm">
                      K
                    </div>
                    <span className="font-extrabold text-sm text-slate-800 dark:text-white leading-none">
                      KKNHub Sisdamas 211
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>

                {isSandboxMode && (
                  <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 rounded-lg text-[9px] font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span>Mode Simulasi (Offline)</span>
                  </div>
                )}

                <GlobalSearch />

                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-kkn-blue to-kkn-purple text-white shadow-md"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-850"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 hover:opacity-85 transition-opacity">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-bold flex items-center justify-center text-xs">
                    {user.photo_url ? (
                      <img src={user.photo_url} alt={user.full_name} className="h-full w-full object-cover rounded-full" />
                    ) : (
                      user.full_name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight">
                      {user.full_name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors text-left"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  <span>Keluar Sesi</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
