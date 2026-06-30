import { CourseBrowser } from "@/components/courses/CourseBrowser";
import { TopBar } from "@/components/layout/TopBar";
import { HeroSection } from "@/components/layout/HeroSection";
import { PricingPlansSection } from "@/components/pricing/PricingPlansSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <TopBar />
      <HeroSection />

      <section className="mx-auto max-w-[1280px] px-6 py-16 xl:px-10">
        <PricingPlansSection heading="Plans that support every stage of your learning journey" intro="Students can start with the Free plan and upgrade when they want deeper tools, while instructors can unlock analytics and better learner engagement with Pro." />
      </section>

      {/* ── Course grid ── */}
      <section className="mx-auto max-w-[1280px] px-6 py-12 xl:px-10">
        <h2 className="section-heading mb-6">Featured courses</h2>
        <CourseBrowser />
      </section>
    </div>
  );
}
