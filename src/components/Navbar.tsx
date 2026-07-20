"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Fitur", href: "#features" },
    { name: "Timeline", href: "#timeline" },
    { name: "Program Kerja", href: "#proker" },
    { name: "Galeri", href: "#gallery" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "py-3 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm"
          : "py-5 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-kkn-blue to-kkn-purple flex items-center justify-center shadow-md shadow-blue-500/20 transition-transform group-hover:scale-105 duration-300">
              <span className="text-white font-extrabold text-xl tracking-tight">K</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-kkn-blue to-kkn-purple bg-clip-text text-transparent">
                KKNHub
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider -mt-1 uppercase">
                Sukaluyu 211
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-semibold text-slate-600 hover:text-kkn-blue dark:text-slate-300 dark:hover:text-kkn-blue transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="#dashboard-preview"
              className={buttonVariants({
                variant: "ghost",
                className: "font-semibold text-slate-700 hover:text-kkn-blue dark:text-slate-200",
              })}
            >
              Pelajari
            </Link>
            <Link
              href="/login"
              className={buttonVariants({
                className: "relative group overflow-hidden bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-semibold text-white px-5 rounded-xl shadow-md shadow-blue-500/10 transition-all duration-300 hover:scale-[1.02]",
              })}
            >
              Masuk
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-b border-slate-200/50 dark:border-slate-800/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:text-kkn-blue hover:bg-slate-50 dark:text-slate-300 dark:hover:text-kkn-blue dark:hover:bg-slate-800 transition-all duration-200"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-3 px-3">
                <Link
                  href="#dashboard-preview"
                  onClick={() => setIsOpen(false)}
                  className={buttonVariants({
                    variant: "outline",
                    className: "w-full font-semibold rounded-xl border-slate-200 dark:border-slate-700 text-center justify-center flex items-center",
                  })}
                >
                  Pelajari Fitur
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className={buttonVariants({
                    className: "w-full bg-gradient-to-r from-kkn-blue to-kkn-purple hover:opacity-95 font-semibold text-white rounded-xl shadow-md text-center justify-center flex items-center",
                  })}
                >
                  Masuk
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
