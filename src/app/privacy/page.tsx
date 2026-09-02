'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'information-collection', label: 'Information We Collect' },
  { id: 'how-we-use', label: 'How We Use Your Information' },
  { id: 'information-sharing', label: 'Information Sharing' },
  { id: 'data-security', label: 'Data Security' },
  { id: 'cookies', label: 'Cookies and Tracking' },
  { id: 'user-rights', label: 'Your Rights' },
  { id: 'retention', label: 'Data Retention' },
  { id: 'third-parties', label: 'Third-Party Services' },
  { id: 'contact', label: 'Contact Us' },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] print:bg-white">
      <TopBar />
      <main className="mx-auto flex max-w-6xl gap-8 px-6 py-12 xl:px-10">
        {/* Left sidebar - Table of Contents */}
        <aside className="sticky top-24 hidden h-fit w-48 flex-shrink-0 lg:block print:hidden">
          <nav className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7F77DD]">
              On this page
            </p>
            <ul className="space-y-2">
              {sections.map(({ id, label }) => (
                <li key={id}>
                  <Link
                    href={`#${id}`}
                    className={`block rounded px-3 py-2 text-sm transition-colors ${
                      activeSection === id
                        ? 'bg-[#EEEDFE] font-semibold text-[#26215C]'
                        : 'text-[#5A5578] hover:text-[#26215C]'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <section className="rounded-[32px] border border-[#D5D2F6] bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7F77DD]">
              Privacy Policy
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#26215C] sm:text-4xl">
              Your privacy matters to us.
            </h1>
            <p className="mt-4 text-sm text-[#5A5578]">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </section>

          <div className="mt-8 space-y-12 rounded-[32px] border border-[#D5D2F6] bg-white p-8 shadow-sm prose prose-sm max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none">
            {/* Overview Section */}
            <section id="overview" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Overview</h2>
              <p className="text-[#5A5578]">
                Hamplard respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
              <p className="text-[#5A5578]">
                Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Service.
              </p>
            </section>

            {/* Information Collection Section */}
            <section id="information-collection" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Information We Collect</h2>
              <p className="text-[#5A5578]">
                We collect information in several ways:
              </p>
              <h3 className="mt-4 text-lg font-semibold text-[#3C3489]">Information You Provide</h3>
              <ul className="list-disc space-y-2 pl-6 text-[#5A5578]">
                <li>Account registration information (name, email, password)</li>
                <li>Profile information (bio, profile picture, learning preferences)</li>
                <li>Course enrollment and progress data</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Communication data (support tickets, feedback, reviews)</li>
              </ul>
              <h3 className="mt-4 text-lg font-semibold text-[#3C3489]">Information Collected Automatically</h3>
              <ul className="list-disc space-y-2 pl-6 text-[#5A5578]">
                <li>Device information (IP address, browser type, device type)</li>
                <li>Usage data (pages visited, time spent, interactions)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            {/* How We Use Section */}
            <section id="how-we-use" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">How We Use Your Information</h2>
              <p className="text-[#5A5578]">
                Hamplard uses collected information for:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-[#5A5578]">
                <li>Providing and personalizing your learning experience</li>
                <li>Processing transactions and sending related information</li>
                <li>Sending promotional emails and course recommendations</li>
                <li>Responding to your inquiries and providing support</li>
                <li>Analyzing usage patterns to improve our Service</li>
                <li>Complying with legal obligations</li>
                <li>Detecting and preventing fraudulent activity</li>
              </ul>
            </section>

            {/* Information Sharing Section */}
            <section id="information-sharing" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Information Sharing</h2>
              <p className="text-[#5A5578]">
                We do not sell or rent your personal information to third parties. We may share information with:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-[#5A5578]">
                <li>Service providers who assist us in operating our website and conducting our business</li>
                <li>Instructors (limited course-related information for educational purposes)</li>
                <li>Law enforcement or legal authorities when required by law</li>
              </ul>
            </section>

            {/* Data Security Section */}
            <section id="data-security" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Data Security</h2>
              <p className="text-[#5A5578]">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These include encryption, secure servers, and access controls.
              </p>
              <p className="text-[#5A5578]">
                However, no security system is impenetrable. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Cookies and Tracking Section */}
            <section id="cookies" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Cookies and Tracking</h2>
              <p className="text-[#5A5578]">
                Hamplard uses cookies to keep the platform secure, remember your preferences, and improve your experience. Cookies are small files stored on your device that contain information about your browsing activity.
              </p>
              <p className="text-[#5A5578]">
                You can review or change your cookie preferences at any time through your browser settings. Disabling cookies may limit certain functionality on our platform.
              </p>
            </section>

            {/* User Rights Section */}
            <section id="user-rights" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Your Rights</h2>
              <p className="text-[#5A5578]">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-[#5A5578]">
                <li>Right to access your personal data</li>
                <li>Right to correct inaccurate data</li>
                <li>Right to delete your data</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to withdraw consent</li>
              </ul>
              <p className="mt-4 text-[#5A5578]">
                To exercise any of these rights, please contact us at{' '}
                <Link href="mailto:support@hamplard.app" className="text-[#7F77DD] hover:underline">
                  support@hamplard.app
                </Link>
                .
              </p>
            </section>

            {/* Data Retention Section */}
            <section id="retention" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Data Retention</h2>
              <p className="text-[#5A5578]">
                We retain your personal data for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. You may request deletion of your data at any time, subject to legal and operational requirements.
              </p>
            </section>

            {/* Third-Party Services Section */}
            <section id="third-parties" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Third-Party Services</h2>
              <p className="text-[#5A5578]">
                Our website may contain links to third-party websites and services. This Privacy Policy applies only to Hamplard. We are not responsible for the privacy practices of third-party sites. We encourage you to review their privacy policies before providing personal information.
              </p>
            </section>

            {/* Contact Section */}
            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Contact Us</h2>
              <p className="text-[#5A5578]">
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="mt-4 space-y-2 text-[#5A5578]">
                <p>
                  <span className="font-semibold">Email:</span>{' '}
                  <Link href="mailto:support@hamplard.app" className="text-[#7F77DD] hover:underline">
                    support@hamplard.app
                  </Link>
                </p>
                <p>
                  <span className="font-semibold">Website:</span>{' '}
                  <Link href="https://hamplard.app" className="text-[#7F77DD] hover:underline">
                    hamplard.app
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
