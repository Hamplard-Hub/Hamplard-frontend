import { CourseBrowser } from "@/components/courses/CourseBrowser";
import { TopBar } from "@/components/layout/TopBar";
import { HeroSection } from "@/components/layout/HeroSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <TopBar />
      <HeroSection />

      {/* ── Course grid ── */}
      <section className="mx-auto max-w-[1280px] px-6 py-12 xl:px-10">
        <h2 className="section-heading mb-6">Featured courses</h2>
        <CourseBrowser />
      </section>
    </div>
  );
}
