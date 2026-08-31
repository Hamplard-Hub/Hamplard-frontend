import { TopBar } from "@/components/layout/TopBar";
import { HeroSection } from "@/components/layout/HeroSection";
import { PricingPlansSection } from "@/components/pricing/PricingPlansSection";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { HomepageCarousels, RecentlyViewed, TestimonialsCarousel } from "@/components/home";
import type { Testimonial } from "@/components/home";

const DEFAULT_OG_IMAGE = "/hamplard-og.svg";

export const metadata: Metadata = buildMetadata({
  title: "Hamplard",
  description:
    "Learn practical skills — tailoring, makeup, baking, photography and more. Africa's online vocational skills platform.",
  openGraph: {
    title: "Hamplard",
    description:
      "Learn practical skills — tailoring, makeup, baking, photography and more. Africa's online vocational skills platform.",
    url: "/",
    siteName: "Hamplard",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE, alt: "Hamplard brand preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hamplard",
    description:
      "Learn practical skills — tailoring, makeup, baking, photography and more. Africa's online vocational skills platform.",
    images: [DEFAULT_OG_IMAGE],
  },
});

// Sample testimonials data
const SAMPLE_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Amina Okafor',
    role: 'Fashion Designer',
    courseTaken: 'Advanced Tailoring Techniques',
    quote: 'The tailoring course completely transformed my business. I went from basic alterations to creating custom wedding dresses. The instructors were patient and the lessons were practical.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Kwame Mensah',
    role: 'Professional Photographer',
    courseTaken: 'Professional Photography Masterclass',
    quote: 'As someone who learned photography on my own, this course filled in all the gaps. The lighting techniques and composition lessons have taken my work to the next level.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Fatima Hassan',
    role: 'Pastry Chef',
    courseTaken: 'Professional Baking & Pastry Arts',
    quote: "I started my home bakery after completing this course. The detailed instructions and recipes are amazing. I'm now confident taking custom orders and my business is thriving!",
    rating: 5,
  },
  {
    id: '4',
    name: 'David Oluwaseun',
    role: 'Makeup Artist',
    courseTaken: 'Bridal Makeup Artistry',
    quote: 'This course gave me the skills and confidence to start my own makeup business. The techniques I learned have helped me build a strong client base. Highly recommended!',
    rating: 5,
  },
  {
    id: '5',
    name: 'Grace Mwangi',
    role: 'Hair Stylist',
    courseTaken: 'Professional Hairstyling',
    quote: 'The step-by-step tutorials made learning complex hairstyles so easy. I can now offer a wider range of services to my clients and my income has increased significantly.',
    rating: 5,
  },
  {
    id: '6',
    name: 'Emmanuel Adeyemi',
    role: 'Nail Technician',
    courseTaken: 'Nail Art & Technology',
    quote: 'From basic manicures to intricate nail art designs, this course covered everything. The hygiene and safety modules were particularly valuable. Worth every penny!',
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <TopBar />
      <HeroSection />

      <section className="mx-auto max-w-[1280px] px-6 pt-12 xl:px-10">
        <RecentlyViewed />
      </section>

      {/* ── Course discovery carousels ── */}
      <section className="mx-auto max-w-[1280px] px-6 py-12 xl:px-10">
        <HomepageCarousels />
      </section>

      {/* ── Student Testimonials ── */}
      <section className="bg-gradient-to-br from-hamplard-lilac/30 via-saffron-50/20 to-leaf-50/30">
        <TestimonialsCarousel testimonials={SAMPLE_TESTIMONIALS} />
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-16 xl:px-10">
        <PricingPlansSection
          heading="Plans that support every stage of your learning journey"
          intro="Students can start with the Free plan and upgrade when they want deeper tools, while instructors can unlock analytics and better learner engagement with Pro."
        />
      </section>
    </div>
  );
}
