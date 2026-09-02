import type { Metadata } from 'next';
import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { TeamGrid, type TeamMember } from '@/components/about/TeamGrid';
import { AnimatedCounter } from '@/components/about/AnimatedCounter';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'About Hamplard',
  description: 'Learn about Hamplard mission, team, and our commitment to bringing practical skills education to Africa.',
  path: '/about',
});

const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Ava Chen',
    role: 'Co-founder & CEO',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    bio: 'Former EdTech executive with 8 years in online education.',
  },
  {
    id: '2',
    name: 'Kwame Asante',
    role: 'Co-founder & CTO',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    bio: 'Full-stack engineer focused on scalable education platforms.',
  },
  {
    id: '3',
    name: 'Zainab Mohammed',
    role: 'Head of Content',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    bio: 'Curriculum designer with expertise in vocational training.',
  },
  {
    id: '4',
    name: 'James Okonkwo',
    role: 'Head of Instructor Relations',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    bio: 'Builds relationships with skilled instructors across Africa.',
  },
  {
    id: '5',
    name: 'Amara Diallo',
    role: 'Head of Community',
    image: 'https://images.unsplash.com/photo-1517841905240-5629cf63a46e?w=400&h=400&fit=crop',
    bio: 'Creates engaging learning communities and support systems.',
  },
  {
    id: '6',
    name: 'Chioma Ugwu',
    role: 'Head of Growth',
    image: 'https://images.unsplash.com/photo-1519235855830-efe32cf4d8ad?w=400&h=400&fit=crop',
    bio: 'Growth strategist scaling Hamplard across Africa.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      <TopBar />

      {/* Hero Section */}
      <section
        className="relative overflow-hidden w-full py-16 md:py-24"
        style={{ background: 'linear-gradient(135deg, #26215C 0%, #3C3489 100%)' }}
        aria-label="Hero"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(127,119,221,0.18) 0%, transparent 70%)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[10%] w-[360px] h-[360px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(238,237,254,0.07) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-4xl px-6 text-center xl:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#EEEDFE]/80">
            Our Mission
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Empowering Africa with practical skills
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#EEEDFE]/90 max-w-2xl mx-auto">
            Hamplard connects ambitious learners across Africa with world-class vocational training in tailoring, makeup artistry, baking, photography, and more. We believe practical skills are the foundation for economic opportunity.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24 xl:px-10">
        <div className="rounded-[32px] border border-[#D5D2F6] bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7F77DD]">
            Our Story
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#26215C] sm:text-4xl">
            Founded in 2022
          </h2>
          <div className="mt-6 space-y-4 text-lg leading-8 text-[#5A5578]">
            <p>
              Hamplard began with a simple observation: across Africa, there are thousands of skilled professionals eager to teach, and millions of young people ready to learn practical, income-generating skills. Yet the gap between them persisted.
            </p>
            <p>
              Our founders saw this challenge and built Hamplard as the bridge. We started by connecting a handful of talented instructors with curious learners in Lagos, Accra, and Nairobi. Today, we serve learners across 25+ African countries.
            </p>
            <p>
              We're committed to making quality vocational education accessible, affordable, and recognized globally through blockchain-verified certificates. Every course on Hamplard is designed to turn aspiration into action.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24 xl:px-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="rounded-[24px] border border-[#D5D2F6] bg-gradient-to-br from-[#EEEDFE] to-white p-8 text-center shadow-sm">
            <div className="text-4xl font-bold text-[#26215C]">
              <AnimatedCounter value={10000} suffix="+" />
            </div>
            <p className="mt-2 text-sm font-medium text-[#5A5578]">Active Learners</p>
          </div>

          <div className="rounded-[24px] border border-[#D5D2F6] bg-gradient-to-br from-[#EEEDFE] to-white p-8 text-center shadow-sm">
            <div className="text-4xl font-bold text-[#26215C]">
              <AnimatedCounter value={500} suffix="+" />
            </div>
            <p className="mt-2 text-sm font-medium text-[#5A5578]">Quality Courses</p>
          </div>

          <div className="rounded-[24px] border border-[#D5D2F6] bg-gradient-to-br from-[#EEEDFE] to-white p-8 text-center shadow-sm">
            <div className="text-4xl font-bold text-[#26215C]">
              <AnimatedCounter value={200} suffix="+" />
            </div>
            <p className="mt-2 text-sm font-medium text-[#5A5578]">Expert Instructors</p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24 xl:px-10">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7F77DD]">
            Our Values
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#26215C] sm:text-4xl">
            Built on principles that matter
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'Accessibility',
              description: 'Quality education shouldn\'t be a privilege. We keep courses affordable and available to everyone.',
            },
            {
              title: 'Excellence',
              description: 'Every course is created by verified experts. Our instructors are practitioners, not just educators.',
            },
            {
              title: 'Empowerment',
              description: 'We equip learners with real, marketable skills that lead to jobs, side hustles, or business ventures.',
            },
            {
              title: 'Transparency',
              description: 'Your certificates are verified on the blockchain. Your progress is always your own, portable and trusted.',
            },
            {
              title: 'Community',
              description: 'Learning together matters. Our learners support each other, ask questions, and celebrate wins together.',
            },
            {
              title: 'Impact',
              description: 'We measure success by the lives we help transform. Every graduate represents economic opportunity.',
            },
          ].map((value) => (
            <div
              key={value.title}
              className="rounded-[24px] border border-[#D5D2F6] bg-white p-6 shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold text-[#26215C]">{value.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#5A5578]">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24 xl:px-10">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7F77DD]">
            Our Team
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#26215C] sm:text-4xl">
            Talented people on a mission
          </h2>
          <p className="mt-4 text-lg text-[#5A5578] max-w-2xl mx-auto">
            We're a small, focused team of education innovators, engineers, and creators building the future of vocational learning.
          </p>
        </div>

        <TeamGrid members={teamMembers} />
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24 xl:px-10">
        <div className="rounded-[32px] bg-gradient-to-r from-[#26215C] to-[#3C3489] p-10 text-center sm:p-14">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to join us?
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#EEEDFE]">
            Whether you're eager to learn new skills or ready to teach, we'd love to have you as part of the Hamplard community.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-sm font-semibold text-[#26215C] transition hover:bg-[#F4F2FF]"
            >
              Join as a student
            </Link>
            <Link
              href="/instructor-apply"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Become an instructor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
