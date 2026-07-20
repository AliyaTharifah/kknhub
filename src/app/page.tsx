"use client";

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import Countdown from "@/components/landing/Countdown";
import ProgressCircle from "@/components/landing/ProgressCircle";
import Statistics from "@/components/landing/Statistics";
import TimelinePreview from "@/components/landing/TimelinePreview";
import ProkerPreview from "@/components/landing/ProkerPreview";
import GalleryPreview from "@/components/landing/GalleryPreview";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* Navigation */}
      <Navbar />

      {/* Hero Block */}
      <HeroSection />

      {/* Main Section Wrappers */}
      <main className="flex-grow space-y-24 md:space-y-32 pb-24">
        
        {/* Status Hub (Countdown & Circular Progress) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <Countdown />
            <ProgressCircle />
          </div>
        </section>

        {/* Statistics Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Statistics />
        </section>



        {/* Timeline Preview */}
        <section id="timeline" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <TimelinePreview />
        </section>

        {/* Proker Preview */}
        <section id="proker" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <ProkerPreview />
        </section>



        {/* Gallery Preview */}
        <section id="gallery" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <GalleryPreview />
        </section>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
