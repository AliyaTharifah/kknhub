import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KKNHub - Smart KKN Management System Kelompok 211",
  description:
    "Satu platform untuk mengelola seluruh aktivitas KKN Kelompok 211 Desa Sukaluyu, mulai dari timeline, program kerja, logbook, dokumentasi, notulen rapat, hingga laporan akhir.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('kkn_theme') === 'dark' || (!('kkn_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-100 overflow-x-hidden">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
